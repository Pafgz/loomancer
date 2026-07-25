import { useMemo, useState } from "react";
import type { ColorworkChart } from "../domain/models";
import {
  buildChartPdfBytes,
  MAX_PNG_SIDE,
  renderChartPngBlob,
} from "../export/chart-export";
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

  return (
    <div className="export-menu">
      <button
        type="button"
        className="primary"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={!chart}
        onClick={() => setOpen((value) => !value)}
      >
        Export
      </button>

      {open && chart ? (
        <div className="export-panel" role="menu">
          {(["pdf", "png"] as const).map((kind) => (
            <div className="export-group" key={kind}>
              <h3>{kind.toUpperCase()}</h3>
              <div className="export-actions">
                <button
                  type="button"
                  onClick={() => void run(kind, "download")}
                  disabled={busy !== null}
                >
                  {busy === `${kind}-download` ? "Working…" : "Download"}
                </button>
                {capabilities.canShare ? (
                  <button
                    type="button"
                    onClick={() => void run(kind, "share")}
                    disabled={busy !== null}
                  >
                    {busy === `${kind}-share` ? "Working…" : "Share"}
                  </button>
                ) : null}
                {capabilities.canSave ? (
                  <button
                    type="button"
                    onClick={() => void run(kind, "save")}
                    disabled={busy !== null}
                  >
                    {busy === `${kind}-save` ? "Working…" : "Save"}
                  </button>
                ) : null}
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
