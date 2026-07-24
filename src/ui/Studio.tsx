import { useEffect, useRef, useState } from "react";
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
  type PatternProject,
  type YarnColor,
} from "../domain/models";
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
  const generationIdRef = useRef(0);

  useEffect(() => {
    setDraft(project);
    draftRef.current = project;
  }, [project]);

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
    await persist((current) => ({
      ...current,
      sourceImage: file,
      sourceFileName: file.name,
      sourceMimeType: validation.mimeType,
      naturalWidth: validation.width,
      naturalHeight: validation.height,
      rotationDegrees: 0,
      crop: fullImageCrop(validation.width, validation.height),
      detailLevel: DEFAULT_DETAIL,
      chartWidth: grid.width,
      chartHeight: grid.height,
      aspectLocked: true,
      maxColors: current.maxColors || DEFAULT_CHART_COLORS,
      chart: current.chart,
    }));
  }

  async function handleRotate() {
    setHoldGeneration(false);
    await persist((current) => {
      if (!current.sourceImage) {
        return current;
      }
      return {
        ...current,
        rotationDegrees: rotateClockwise(current.rotationDegrees),
      };
    });
  }

  async function updateCrop(
    field: "x" | "y" | "width" | "height",
    rawValue: string,
  ) {
    const value = Number(rawValue);
    if (!Number.isFinite(value)) {
      return;
    }

    await persist((current) => {
      if (!current.naturalWidth || !current.naturalHeight || !current.crop) {
        return current;
      }

      const nextCrop = {
        ...current.crop,
        [field]: Math.max(0, Math.round(value)),
      };

      const maxWidth = current.naturalWidth - nextCrop.x;
      const maxHeight = current.naturalHeight - nextCrop.y;
      nextCrop.width = Math.min(Math.max(1, nextCrop.width), maxWidth);
      nextCrop.height = Math.min(Math.max(1, nextCrop.height), maxHeight);

      return {
        ...current,
        crop: nextCrop,
      };
    });
    setHoldGeneration(false);
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
    await persist((current) => {
      if (!current.aspectLocked || !current.crop) {
        return {
          ...current,
          [field]: clamped,
        };
      }

      const aspect = current.crop.width / Math.max(1, current.crop.height);
      if (field === "chartWidth") {
        return {
          ...current,
          chartWidth: clamped,
          chartHeight: Math.max(
            1,
            Math.min(MAX_CHART_DIMENSION, Math.round(clamped / aspect)),
          ),
        };
      }

      return {
        ...current,
        chartHeight: clamped,
        chartWidth: Math.max(
          1,
          Math.min(MAX_CHART_DIMENSION, Math.round(clamped * aspect)),
        ),
      };
    });
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
          <ExportMenu chart={draft.chart} projectName={draft.name} />
        </div>
      </header>

      <div className="studio-layout">
        <section className="panel" aria-label="Image controls">
          <h2>Image controls</h2>
          <ImageControls
            draft={draft}
            previewUrl={previewUrl}
            error={error}
            onFileChange={(files) => void handleFileChange(files)}
            onRotate={() => void handleRotate()}
            onCropChange={(field, value) => void updateCrop(field, value)}
            onDetailChange={(value) => void handleDetailChange(value)}
            onDimensionChange={(field, value) =>
              void handleDimensionChange(field, value)
            }
            onAspectLockChange={(checked) =>
              void persist((current) => ({
                ...current,
                aspectLocked: checked,
              }))
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

        <section className="chart-stage" aria-label="Colorwork Chart">
          <h2 className="visually-hidden">Colorwork Chart</h2>
          {draft.chart ? (
            <ChartView chart={draft.chart} isGenerating={isGenerating} />
          ) : (
            <p className="muted">
              {isGenerating
                ? "Generating Colorwork Chart…"
                : "Chart preview will appear here after generation."}
            </p>
          )}
        </section>

        <section className="panel" aria-label="Color key">
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
              Chart colors and Yarn Inventory matches will appear here.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
