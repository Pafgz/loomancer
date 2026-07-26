import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  createInlineChartGenerator,
  type ChartGenerator,
} from "../chart/chart-generator";
import {
  DEFAULT_CHART_COLORS,
  DEFAULT_DETAIL,
  gridSizeFromDetail,
  MAX_CHART_DIMENSION,
} from "../chart/chart-types";
import { rasterizeSourceToRgba } from "../chart/rasterize-source";
import {
  fullImageCrop,
  rotateClockwise,
  type CropRect,
  type PatternProject,
  type YarnColor,
} from "../domain/models";
import {
  fitCropToAspect,
  maxCropForAspect,
  orientedDimensions,
} from "../image/framing";
import {
  defaultDecodeSourceImage,
  validateSourceImage,
  type SourceImageDecoder,
} from "../image/validate-source-image";
import { ChartView } from "./ChartView";
import { ColorKeyPanel } from "./ColorKeyPanel";
import { ExportMenu } from "./ExportMenu";
import { ImageControls } from "./ImageControls";
import { ThemeToggle } from "./ThemeToggle";
import { useMediaQuery } from "./useMediaQuery";

type StudioTab = "framing" | "chart" | "colors";

const STUDIO_TABS = [
  ["framing", "Framing"],
  ["chart", "Chart"],
  ["colors", "Colors"],
] as const satisfies ReadonlyArray<readonly [StudioTab, string]>;

/** Below this width the three panes collapse into a real tab set. */
const COMPACT_LAYOUT = "(max-width: 64rem)";

type StudioProps = {
  project: PatternProject;
  inventory: YarnColor[];
  onBack: () => void;
  onProjectChange: (project: PatternProject) => Promise<void>;
  onInventoryChange: (inventory: YarnColor[]) => Promise<void>;
  decodeSourceImage?: SourceImageDecoder;
  generateChart?: ChartGenerator;
  rasterizeSource?: typeof rasterizeSourceToRgba;
  confirmRegeneration?: (message: string) => boolean;
};

const GENERATE_DEBOUNCE_MS = 300;

export function Studio({
  project,
  inventory,
  onBack,
  onProjectChange,
  onInventoryChange,
  decodeSourceImage = defaultDecodeSourceImage,
  generateChart = createInlineChartGenerator(),
  rasterizeSource = rasterizeSourceToRgba,
  confirmRegeneration = (message) => window.confirm(message),
}: StudioProps) {
  const [draft, setDraft] = useState(project);
  const draftRef = useRef(project);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [undoStack, setUndoStack] = useState<PatternProject["chart"][]>([]);
  const [redoStack, setRedoStack] = useState<PatternProject["chart"][]>([]);
  const [holdGeneration, setHoldGeneration] = useState(false);
  const [framingCrop, setFramingCrop] = useState<CropRect | null>(
    project.crop,
  );
  const [studioTab, setStudioTab] = useState<StudioTab>("framing");
  const generationIdRef = useRef(0);
  const compact = useMediaQuery(COMPACT_LAYOUT);

  /**
   * Wide layout shows all three panes at once — they are landmarks, not tabs.
   * Only the compact layout is a tab set, so the roles follow the breakpoint.
   */
  function paneProps(id: StudioTab, label: string) {
    return compact
      ? {
          id: `studio-pane-${id}`,
          role: "tabpanel" as const,
          "aria-labelledby": `studio-tab-${id}`,
        }
      : { id: `studio-pane-${id}`, "aria-label": label };
  }

  function onTabKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (!compact) {
      return;
    }
    const index = STUDIO_TABS.findIndex(([id]) => id === studioTab);
    let next = index;
    if (event.key === "ArrowRight") {
      next = (index + 1) % STUDIO_TABS.length;
    } else if (event.key === "ArrowLeft") {
      next = (index - 1 + STUDIO_TABS.length) % STUDIO_TABS.length;
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = STUDIO_TABS.length - 1;
    } else {
      return;
    }
    event.preventDefault();
    const target = STUDIO_TABS[next];
    if (!target) {
      return;
    }
    setStudioTab(target[0]);
    document.getElementById(`studio-tab-${target[0]}`)?.focus();
  }

  useEffect(() => {
    setDraft(project);
    draftRef.current = project;
  }, [project]);

  // Sync framing draft only when the applied crop / source / rotation changes —
  // not on unrelated project saves (detail, colors), so dirty pan/zoom survives.
  const framingSyncKey = [
    project.id,
    project.rotationDegrees,
    project.sourceFileName ?? "",
    project.crop
      ? `${project.crop.x},${project.crop.y},${project.crop.width},${project.crop.height}`
      : "none",
  ].join("|");

  useEffect(() => {
    setFramingCrop(project.crop);
    // framingSyncKey captures the applied crop identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [framingSyncKey]);

  useEffect(() => {
    if (!draft.sourceImage) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(draft.sourceImage);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [draft.sourceImage]);

  useEffect(() => {
    if (
      holdGeneration ||
      !draft.sourceImage ||
      !draft.crop ||
      !draft.naturalWidth ||
      !draft.naturalHeight
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void runGeneration(draftRef.current);
    }, GENERATE_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
    // Intentionally regenerate when generation inputs change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    holdGeneration,
    draft.sourceImage,
    draft.crop,
    draft.rotationDegrees,
    draft.chartWidth,
    draft.chartHeight,
    draft.maxColors,
    draft.naturalWidth,
    draft.naturalHeight,
  ]);

  async function persist(
    updater: (current: PatternProject) => PatternProject,
  ) {
    const stamped = {
      ...updater(draftRef.current),
      updatedAt: new Date().toISOString(),
    };
    draftRef.current = stamped;
    setDraft(stamped);
    await onProjectChange(stamped);
  }

  async function runGeneration(current: PatternProject) {
    if (
      !current.sourceImage ||
      !current.crop ||
      !current.naturalWidth ||
      !current.naturalHeight
    ) {
      return;
    }

    if (current.paletteManuallyEdited) {
      const confirmed = confirmRegeneration(
        "Regenerating will replace your palette edits. Continue?",
      );
      if (!confirmed) {
        setHoldGeneration(true);
        return;
      }
    }

    const generationId = generationIdRef.current + 1;
    generationIdRef.current = generationId;
    setIsGenerating(true);
    setError(null);

    try {
      const image = await rasterizeSource({
        sourceImage: current.sourceImage,
        naturalWidth: current.naturalWidth,
        naturalHeight: current.naturalHeight,
        rotationDegrees: current.rotationDegrees,
        crop: current.crop,
        targetWidth: current.chartWidth,
        targetHeight: current.chartHeight,
      });
      const chart = await generateChart({
        image,
        width: current.chartWidth,
        height: current.chartHeight,
        maxColors: current.maxColors,
      });

      if (generationId !== generationIdRef.current) {
        return;
      }

      await persist((latest) => ({
        ...latest,
        chart,
        paletteManuallyEdited: false,
      }));
      setUndoStack([]);
      setRedoStack([]);
    } catch (generationError) {
      if (generationId !== generationIdRef.current) {
        return;
      }
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Chart generation failed",
      );
    } finally {
      if (generationId === generationIdRef.current) {
        setIsGenerating(false);
      }
    }
  }

  async function applyPaletteChart(nextChart: NonNullable<PatternProject["chart"]>) {
    setUndoStack((stack) =>
      draft.chart ? [...stack, draft.chart].slice(-30) : stack,
    );
    setRedoStack([]);
    setHoldGeneration(true);
    await persist((current) => ({
      ...current,
      chart: nextChart,
      paletteManuallyEdited: true,
    }));
  }

  async function handleUndo() {
    const previous = undoStack.at(-1);
    if (!previous || !draft.chart) {
      return;
    }
    setUndoStack((stack) => stack.slice(0, -1));
    setRedoStack((stack) => [...stack, draft.chart]);
    await persist((current) => ({
      ...current,
      chart: previous,
      paletteManuallyEdited: true,
    }));
  }

  async function handleRedo() {
    const next = redoStack.at(-1);
    if (!next || !draft.chart) {
      return;
    }
    setRedoStack((stack) => stack.slice(0, -1));
    setUndoStack((stack) => [...stack, draft.chart]);
    await persist((current) => ({
      ...current,
      chart: next,
      paletteManuallyEdited: true,
    }));
  }

  async function handleFileChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) {
      return;
    }

    const validation = await validateSourceImage(file, decodeSourceImage);
    if (!validation.ok) {
      setError(validation.message);
      return;
    }

    setError(null);
    setHoldGeneration(false);
    const aspect = validation.width / Math.max(1, validation.height);
    const grid = gridSizeFromDetail(DEFAULT_DETAIL, aspect);
    const nextCrop = fullImageCrop(validation.width, validation.height);
    setFramingCrop(nextCrop);
    setStudioTab("framing");
    await persist((current) => ({
      ...current,
      sourceImage: file,
      sourceFileName: file.name,
      sourceMimeType: validation.mimeType,
      naturalWidth: validation.width,
      naturalHeight: validation.height,
      rotationDegrees: 0,
      crop: nextCrop,
      detailLevel: DEFAULT_DETAIL,
      chartWidth: grid.width,
      chartHeight: grid.height,
      aspectLocked: true,
      maxColors: current.maxColors || DEFAULT_CHART_COLORS,
      chart: current.chart,
    }));
  }

  const oriented = useMemo(() => {
    if (!draft.naturalWidth || !draft.naturalHeight) {
      return { width: 0, height: 0 };
    }
    return orientedDimensions(
      draft.naturalWidth,
      draft.naturalHeight,
      draft.rotationDegrees,
    );
  }, [draft.naturalWidth, draft.naturalHeight, draft.rotationDegrees]);

  async function handleRotate() {
    if (!draft.naturalWidth || !draft.naturalHeight) {
      return;
    }
    const nextRotation = rotateClockwise(draft.rotationDegrees);
    const nextOriented = orientedDimensions(
      draft.naturalWidth,
      draft.naturalHeight,
      nextRotation,
    );
    const nextCrop = draft.aspectLocked
      ? maxCropForAspect(
          draft.chartWidth / Math.max(1, draft.chartHeight),
          nextOriented.width,
          nextOriented.height,
        )
      : fullImageCrop(nextOriented.width, nextOriented.height);
    setFramingCrop(nextCrop);
    setHoldGeneration(false);
    await persist((current) => ({
      ...current,
      rotationDegrees: nextRotation,
      crop: nextCrop,
    }));
  }

  async function applyFraming() {
    if (!framingCrop) {
      return;
    }
    setHoldGeneration(false);
    await persist((current) => ({
      ...current,
      crop: framingCrop,
    }));
  }

  function handleFramingCropChange(crop: CropRect) {
    setFramingCrop(crop);
  }

  async function handleDetailChange(rawValue: string) {
    const detail = Number(rawValue);
    if (!Number.isFinite(detail) || !draft.crop) {
      return;
    }
    setHoldGeneration(false);
    const aspect = draft.crop.width / Math.max(1, draft.crop.height);
    const grid = gridSizeFromDetail(detail, aspect);
    await persist((current) => ({
      ...current,
      detailLevel: detail,
      chartWidth: grid.width,
      chartHeight: grid.height,
    }));
  }

  async function handleDimensionChange(
    field: "chartWidth" | "chartHeight",
    rawValue: string,
  ) {
    const value = Number(rawValue);
    if (!Number.isFinite(value)) {
      return;
    }
    const clamped = Math.min(MAX_CHART_DIMENSION, Math.max(1, Math.round(value)));
    setHoldGeneration(false);

    const aspectSource = framingCrop ?? draft.crop;
    const aspect = aspectSource
      ? aspectSource.width / Math.max(1, aspectSource.height)
      : draft.chartWidth / Math.max(1, draft.chartHeight);

    let chartWidth = draft.chartWidth;
    let chartHeight = draft.chartHeight;
    if (!draft.aspectLocked) {
      if (field === "chartWidth") {
        chartWidth = clamped;
      } else {
        chartHeight = clamped;
      }
    } else if (field === "chartWidth") {
      chartWidth = clamped;
      chartHeight = Math.max(
        1,
        Math.min(MAX_CHART_DIMENSION, Math.round(clamped / aspect)),
      );
    } else {
      chartHeight = clamped;
      chartWidth = Math.max(
        1,
        Math.min(MAX_CHART_DIMENSION, Math.round(clamped * aspect)),
      );
    }

    if (draft.aspectLocked && framingCrop && oriented.width && oriented.height) {
      setFramingCrop(
        fitCropToAspect(
          framingCrop,
          chartWidth / Math.max(1, chartHeight),
          oriented.width,
          oriented.height,
        ),
      );
    }

    await persist((current) => ({
      ...current,
      chartWidth,
      chartHeight,
    }));
  }

  async function handleAspectLockChange(checked: boolean) {
    await persist((current) => ({
      ...current,
      aspectLocked: checked,
    }));
    if (
      checked &&
      framingCrop &&
      oriented.width &&
      oriented.height
    ) {
      setFramingCrop(
        fitCropToAspect(
          framingCrop,
          draft.chartWidth / Math.max(1, draft.chartHeight),
          oriented.width,
          oriented.height,
        ),
      );
    }
  }

  return (
    <div className="studio">
      <header className="studio-header">
        <div className="brand-mark">
          <button
            type="button"
            className="ghost icon"
            onClick={onBack}
            aria-label="All projects"
            title="All projects"
          >
            <span aria-hidden="true">←</span>
          </button>
          <div className="header-titles">
            <p className="brand">Local Pattern Project</p>
            <h1>{draft.name}</h1>
          </div>
        </div>
        <div className="actions">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => void handleUndo()}
            disabled={undoStack.length === 0}
          >
            Undo
          </button>
          <button
            type="button"
            onClick={() => void handleRedo()}
            disabled={redoStack.length === 0}
          >
            Redo
          </button>
          <ExportMenu
            chart={draft.chart}
            projectName={draft.name}
            showSymbols={draft.showChartSymbols}
          />
        </div>
      </header>

      <main className="studio-layout" data-tab={studioTab}>
        <div
          className="studio-tabs"
          role={compact ? "tablist" : undefined}
          aria-label="Studio sections"
        >
          {STUDIO_TABS.map(([id, label]) => (
            <button
              key={id}
              id={`studio-tab-${id}`}
              type="button"
              role={compact ? "tab" : undefined}
              className={studioTab === id ? "studio-tab active" : "studio-tab"}
              aria-selected={compact ? studioTab === id : undefined}
              aria-controls={compact ? `studio-pane-${id}` : undefined}
              tabIndex={compact && studioTab !== id ? -1 : undefined}
              onKeyDown={onTabKeyDown}
              onClick={() => setStudioTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <section
          className="panel studio-pane"
          data-pane="framing"
          {...paneProps("framing", "Image controls")}
        >
          <h2>Framing</h2>
          <ImageControls
            draft={draft}
            framingCrop={framingCrop}
            imageWidth={oriented.width}
            imageHeight={oriented.height}
            previewUrl={previewUrl}
            error={error}
            onFileChange={(files) => void handleFileChange(files)}
            onRotate={() => void handleRotate()}
            onFramingCropChange={handleFramingCropChange}
            onApplyFraming={() => void applyFraming()}
            onDetailChange={(value) => void handleDetailChange(value)}
            onDimensionChange={(field, value) =>
              void handleDimensionChange(field, value)
            }
            onAspectLockChange={(checked) =>
              void handleAspectLockChange(checked)
            }
            onMaxColorsChange={(value) => {
              setHoldGeneration(false);
              void persist((current) => ({
                ...current,
                maxColors: value,
              }));
            }}
          />
        </section>

        <section
          className="chart-stage studio-pane"
          data-pane="chart"
          {...paneProps("chart", "Colorwork Chart")}
        >
          <h2 className="visually-hidden">Colorwork Chart</h2>
          {draft.chart ? (
            <ChartView
              chart={draft.chart}
              isGenerating={isGenerating}
              showSymbols={draft.showChartSymbols}
              onShowSymbolsChange={(show) => {
                void persist((current) => ({
                  ...current,
                  showChartSymbols: show,
                }));
              }}
            />
          ) : (
            <p className="chart-stage-empty" role="status">
              {isGenerating
                ? "Generating Colorwork Chart…"
                : "Chart preview will appear here after you choose a photo."}
            </p>
          )}
        </section>

        <section
          className="panel studio-pane"
          data-pane="colors"
          {...paneProps("colors", "Color key")}
        >
          <h2>Color key</h2>
          {draft.chart ? (
            <ColorKeyPanel
              chart={draft.chart}
              inventory={inventory}
              onChartChange={(chart) => {
                void applyPaletteChart(chart);
              }}
              onInventoryChange={(next) => {
                void onInventoryChange(next);
              }}
            />
          ) : (
            <p className="muted">
              Chart colors and Yarn Inventory matches appear here after the
              Colorwork Chart is ready.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
