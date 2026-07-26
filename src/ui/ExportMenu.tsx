import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import type { ColorworkChart } from "../domain/models";
import { MAX_PNG_SIDE, renderChartPngBlob } from "../export/chart-export";
import {
  downloadBlob,
  getExportCapabilities,
  saveBlob,
  shareBlob,
  type DeliveryResult,
} from "../export/deliver-export";

type ExportMenuProps = {
  chart: ColorworkChart | null;
  projectName: string;
  showSymbols?: boolean;
};

type Method = "download" | "share" | "save";

function safeFileName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "colorwork-chart";
}

const METHOD_LABEL: Record<Method, string> = {
  download: "Download",
  share: "Share",
  save: "Save",
};

const RESULT_MESSAGE: Record<DeliveryResult, string> = {
  shared: "Shared.",
  saved: "Saved.",
  downloaded: "Downloaded.",
  cancelled: "Cancelled.",
};

export function ExportMenu({
  chart,
  projectName,
  showSymbols = true,
}: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const capabilities = useMemo(() => getExportCapabilities(), []);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const labelId = useId();

  const closeMenu = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) {
      triggerRef.current?.focus();
    }
  }, []);

  // Move focus into the menu on open so keyboard users are not stranded on the
  // trigger with an invisible panel below them.
  useEffect(() => {
    if (!open) {
      return;
    }
    menuItems(panelRef.current)[0]?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target;
      if (
        target instanceof Node &&
        !containerRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open]);

  function onPanelKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu(true);
      return;
    }
    if (event.key === "Tab") {
      // A menu is not a focus trap; leaving it closes it.
      setOpen(false);
      return;
    }

    const items = menuItems(panelRef.current);
    if (items.length === 0) {
      return;
    }
    const current = items.indexOf(document.activeElement as HTMLButtonElement);

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        items[(current + 1) % items.length]?.focus();
        return;
      case "ArrowUp":
        event.preventDefault();
        items[(current - 1 + items.length) % items.length]?.focus();
        return;
      case "Home":
        event.preventDefault();
        items[0]?.focus();
        return;
      case "End":
        event.preventDefault();
        items[items.length - 1]?.focus();
        return;
      default:
    }
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" && chart) {
      event.preventDefault();
      setOpen(true);
    }
  }

  async function run(kind: "pdf" | "png", method: Method) {
    if (!chart) {
      return;
    }
    setBusy(`${kind}-${method}`);
    setStatus(null);
    try {
      const base = safeFileName(projectName);
      let blob: Blob;
      let filename: string;
      let accept: Record<string, string[]>;
      let notice: string | null = null;

      if (kind === "pdf") {
        // pdf-lib is heavy and only PDF export needs it, so it loads on demand
        // rather than in the Studio's first paint.
        const { buildChartPdfBytes } = await import("../export/chart-pdf");
        const bytes = await buildChartPdfBytes(chart, {
          title: projectName,
          showSymbols,
        });
        blob = new Blob([bytes], { type: "application/pdf" });
        filename = `${base}.pdf`;
        accept = { "application/pdf": [".pdf"] };
      } else {
        const png = await renderChartPngBlob(chart, {
          title: projectName,
          showSymbols,
        });
        blob = png.blob;
        filename = `${base}.png`;
        accept = { "image/png": [".png"] };
        if (png.layout.clamped) {
          notice = `Capped at ${MAX_PNG_SIDE}px per side (reduced cell size to fit).`;
        }
      }

      let result: DeliveryResult;
      if (method === "share") {
        result = await shareBlob(blob, filename, projectName);
      } else if (method === "save") {
        result = await saveBlob(blob, filename, accept);
      } else {
        result = downloadBlob(blob, filename);
      }

      setStatus(
        notice ? `${notice} ${RESULT_MESSAGE[result]}` : RESULT_MESSAGE[result],
      );
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Export failed. Try again.",
      );
    } finally {
      setBusy(null);
    }
  }

  const methods: Method[] = [
    "download",
    ...(capabilities.canShare ? (["share"] as const) : []),
    ...(capabilities.canSave ? (["save"] as const) : []),
  ];

  return (
    <div className="export-menu" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className="primary"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={!chart}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={onTriggerKeyDown}
      >
        Export
      </button>

      {open && chart ? (
        <div
          ref={panelRef}
          className="export-panel"
          role="menu"
          aria-label="Export Colorwork Chart"
          onKeyDown={onPanelKeyDown}
        >
          {(["pdf", "png"] as const).map((kind) => (
            <div
              className="export-group"
              key={kind}
              role="group"
              aria-labelledby={`${labelId}-${kind}`}
            >
              <h3 id={`${labelId}-${kind}`}>{kind.toUpperCase()}</h3>
              <div className="export-actions">
                {methods.map((method) => (
                  <button
                    key={method}
                    type="button"
                    role="menuitem"
                    aria-label={`${METHOD_LABEL[method]} as ${kind.toUpperCase()}`}
                    onClick={() => void run(kind, method)}
                    disabled={busy !== null}
                  >
                    {busy === `${kind}-${method}`
                      ? "Working…"
                      : METHOD_LABEL[method]}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {status ? (
            <p className="export-status" role="status">
              {status}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function menuItems(panel: HTMLElement | null): HTMLButtonElement[] {
  if (!panel) {
    return [];
  }
  return Array.from(
    panel.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)'),
  );
}
