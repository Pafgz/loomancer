import type { ColorworkChart } from "../domain/models";
import { CHART_CELL_PX, CHART_GAP_PX } from "./chart-viewport-math";

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(
    normalized.length === 3
      ? normalized
          .split("")
          .map((part) => part + part)
          .join("")
      : normalized,
    16,
  );
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function symbolInk(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.55 ? "#1a1a1a" : "#f5f5f5";
}

/**
 * Paint a Colorwork Chart onto a canvas at fixed cell size (pan/zoom via CSS
 * transform on a parent). One draw replaces tens of thousands of DOM cells.
 */
export function drawColorworkChart(
  context: CanvasRenderingContext2D,
  chart: ColorworkChart,
  options: { cellPx?: number; gapPx?: number; showSymbols?: boolean } = {},
): void {
  const cellPx = options.cellPx ?? CHART_CELL_PX;
  const gapPx = options.gapPx ?? CHART_GAP_PX;
  const showSymbols = options.showSymbols ?? true;
  const stride = cellPx + gapPx;
  const width = chart.width * cellPx + Math.max(0, chart.width - 1) * gapPx;
  const height = chart.height * cellPx + Math.max(0, chart.height - 1) * gapPx;

  context.clearRect(0, 0, width, height);
  context.fillStyle = "rgba(0,0,0,0.35)";
  context.fillRect(0, 0, width, height);

  const fontSize = Math.max(6, Math.round(cellPx * 0.42));
  if (showSymbols) {
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = `${fontSize}px system-ui, sans-serif`;
  }

  for (let row = 0; row < chart.height; row += 1) {
    for (let col = 0; col < chart.width; col += 1) {
      const index = row * chart.width + col;
      const entry = chart.palette[chart.cells[index] ?? 0];
      const x = col * stride;
      const y = row * stride;
      context.fillStyle = entry?.hex ?? "#cccccc";
      context.fillRect(x, y, cellPx, cellPx);
      if (showSymbols && entry?.symbol && cellPx >= 8) {
        context.fillStyle = symbolInk(entry.hex);
        context.fillText(entry.symbol, x + cellPx / 2, y + cellPx / 2 + 0.5);
      }
    }
  }
}
