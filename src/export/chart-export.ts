import type { ColorworkChart } from "../domain/models";

/** Hard cap for a single PNG side, per the MVP spec. */
export const MAX_PNG_SIDE = 4096;

/** Default on-screen cell size (px) used when the caller doesn't specify one. */
export const DEFAULT_CELL_PX = 28;

/** Bold counting lines every N stitches and rows (knitting-chart convention). */
export const MAJOR_GRID_EVERY = 5;

/** Short footer on exports so knitters know where to start. */
export const CHART_READING_HINT =
  "Start bottom-right. In the round: read right to left, bottom to top.";

export type ColorKeyRow = {
  symbol: string;
  hex: string;
  label: string;
  stitchCount: number;
};

/**
 * Canonical color key derived from the chart palette. Both PNG and PDF exports
 * render from this so the key always matches the chart's palette exactly.
 */
export function buildColorKeyRows(chart: ColorworkChart): ColorKeyRow[] {
  return chart.palette.map((entry) => ({
    symbol: entry.symbol,
    hex: entry.hex,
    label: entry.yarnLabel ?? entry.hex,
    stitchCount: entry.stitchCount,
  }));
}

/** Hex color of the stitch at 0-indexed (row, col), straight from chart data. */
export function chartCellHex(
  chart: ColorworkChart,
  row: number,
  col: number,
): string {
  const cell = chart.cells[row * chart.width + col];
  return chart.palette[cell]?.hex ?? "#cbd0da";
}

/**
 * Traditional knitting: stitch 1 is the rightmost column. `colZeroBased` is
 * left-to-right storage order (image / array index).
 */
export function stitchNumberAtColumn(colZeroBased: number, width: number): number {
  return width - colZeroBased;
}

/**
 * Traditional knitting: row 1 is the bottom row. `rowZeroBased` is top-to-bottom
 * storage order (image / array index).
 */
export function rowNumberAtRow(rowZeroBased: number, height: number): number {
  return height - rowZeroBased;
}

/**
 * Grid line major weight when measured from the knitting origin (right edge for
 * vertical lines, bottom edge for horizontal). `cellsFromOrigin` is 0 on that
 * origin edge and `total` on the far edge; both edges and every
 * {@link MAJOR_GRID_EVERY} cells are major.
 */
export function isMajorGridLine(cellsFromOrigin: number, total: number): boolean {
  if (cellsFromOrigin === 0 || cellsFromOrigin === total) return true;
  return cellsFromOrigin % MAJOR_GRID_EVERY === 0;
}

export type PngLayout = {
  requestedCellSize: number;
  cellSize: number;
  gutter: number;
  padding: number;
  hintHeight: number;
  keyTitleHeight: number;
  keyRowHeight: number;
  keyHeight: number;
  chartWidthPx: number;
  chartHeightPx: number;
  width: number;
  height: number;
  clamped: boolean;
};

function measure(
  chart: ColorworkChart,
  cellSize: number,
): Omit<PngLayout, "requestedCellSize" | "clamped"> {
  const gutter = Math.round(cellSize * 1.6);
  const padding = Math.round(cellSize * 0.6);
  const hintHeight = Math.round(cellSize * 1.15);
  const keyTitleHeight = Math.round(cellSize * 1.6);
  const keyRowHeight = Math.round(cellSize * 1.3);
  const keyHeight =
    keyTitleHeight + keyRowHeight * chart.palette.length + padding;
  const chartWidthPx = chart.width * cellSize;
  const chartHeightPx = chart.height * cellSize;
  const width = padding + gutter + chartWidthPx + padding;
  const height =
    padding + gutter + chartHeightPx + hintHeight + keyHeight + padding;
  return {
    cellSize,
    gutter,
    padding,
    hintHeight,
    keyTitleHeight,
    keyRowHeight,
    keyHeight,
    chartWidthPx,
    chartHeightPx,
    width,
    height,
  };
}

/**
 * Compute pixel dimensions for the PNG, shrinking the cell size as needed so
 * neither side exceeds {@link MAX_PNG_SIDE}. `clamped` signals the reduction so
 * the UI can tell the knitter their requested cell size was capped.
 */
export function computePngLayout(
  chart: ColorworkChart,
  requestedCellSize: number = DEFAULT_CELL_PX,
): PngLayout {
  let cellSize = Math.max(1, Math.round(requestedCellSize));
  let dims = measure(chart, cellSize);
  let clamped = false;

  if (dims.width > MAX_PNG_SIDE || dims.height > MAX_PNG_SIDE) {
    clamped = true;
    const factor = Math.min(
      MAX_PNG_SIDE / dims.width,
      MAX_PNG_SIDE / dims.height,
    );
    cellSize = Math.max(1, Math.floor(cellSize * factor));
    dims = measure(chart, cellSize);
    while (
      (dims.width > MAX_PNG_SIDE || dims.height > MAX_PNG_SIDE) &&
      cellSize > 1
    ) {
      cellSize -= 1;
      dims = measure(chart, cellSize);
    }
  }

  return { requestedCellSize, clamped, ...dims };
}

export function hexToRgb01(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized.padEnd(6, "0").slice(0, 6);
  const int = Number.parseInt(value, 16);
  return {
    r: ((int >> 16) & 0xff) / 255,
    g: ((int >> 8) & 0xff) / 255,
    b: (int & 0xff) / 255,
  };
}

/** Label coordinates on the edges and every 5th line to stay readable. */
export function shouldLabel(oneBased: number, total: number): boolean {
  return oneBased === 1 || oneBased === total || oneBased % 5 === 0;
}

function symbolInkForCanvas(hex: string): string {
  const { r, g, b } = hexToRgb01(hex);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 0.6 ? "#1a1a1a" : "#f2f2f2";
}

function drawExportGrid(
  ctx: CanvasRenderingContext2D,
  gridLeft: number,
  gridTop: number,
  cellSize: number,
  cols: number,
  rows: number,
): void {
  const chartRight = gridLeft + cols * cellSize;
  const chartBottom = gridTop + rows * cellSize;
  const minor = "rgba(0,0,0,0.16)";
  const major = "rgba(0,0,0,0.55)";
  const minorWidth = Math.max(1, Math.round(cellSize * 0.04));
  const majorWidth = Math.max(2, Math.round(cellSize * 0.09));

  for (let i = 0; i <= cols; i += 1) {
    const fromRight = cols - i;
    const majorLine = isMajorGridLine(fromRight, cols);
    const x = gridLeft + i * cellSize + (majorLine ? 0 : 0.5);
    ctx.beginPath();
    ctx.moveTo(x, gridTop);
    ctx.lineTo(x, chartBottom);
    ctx.strokeStyle = majorLine ? major : minor;
    ctx.lineWidth = majorLine ? majorWidth : minorWidth;
    ctx.stroke();
  }

  for (let j = 0; j <= rows; j += 1) {
    const fromBottom = rows - j;
    const majorLine = isMajorGridLine(fromBottom, rows);
    const y = gridTop + j * cellSize + (majorLine ? 0 : 0.5);
    ctx.beginPath();
    ctx.moveTo(gridLeft, y);
    ctx.lineTo(chartRight, y);
    ctx.strokeStyle = majorLine ? major : minor;
    ctx.lineWidth = majorLine ? majorWidth : minorWidth;
    ctx.stroke();
  }
}

/**
 * Draw the chart onto a 2D canvas context from canonical chart data. Shared by
 * the browser PNG renderer; kept separate so layout stays testable.
 */
export function drawChartToCanvas(
  ctx: CanvasRenderingContext2D,
  chart: ColorworkChart,
  layout: PngLayout,
  title: string,
  options: { showSymbols?: boolean } = {},
): void {
  const showSymbols = options.showSymbols ?? true;
  const { cellSize, gutter, padding } = layout;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, layout.width, layout.height);

  const gridLeft = padding + gutter;
  const gridTop = padding + gutter;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${Math.round(cellSize * 0.5)}px monospace`;

  // Coordinates — traditional: stitch 1 at right, row 1 at bottom.
  ctx.fillStyle = "#71767f";
  for (let col = 0; col < chart.width; col += 1) {
    const stitch = stitchNumberAtColumn(col, chart.width);
    if (!shouldLabel(stitch, chart.width)) continue;
    ctx.fillText(
      String(stitch),
      gridLeft + col * cellSize + cellSize / 2,
      gridTop - cellSize * 0.5,
    );
  }
  for (let row = 0; row < chart.height; row += 1) {
    const rowNo = rowNumberAtRow(row, chart.height);
    if (!shouldLabel(rowNo, chart.height)) continue;
    ctx.fillText(
      String(rowNo),
      gridLeft - cellSize * 0.8,
      gridTop + row * cellSize + cellSize / 2,
    );
  }

  // Cells + symbols (grid drawn once afterward for major/minor weights).
  for (let row = 0; row < chart.height; row += 1) {
    for (let col = 0; col < chart.width; col += 1) {
      const entry = chart.palette[chart.cells[row * chart.width + col]];
      const x = gridLeft + col * cellSize;
      const y = gridTop + row * cellSize;
      ctx.fillStyle = entry?.hex ?? "#cbd0da";
      ctx.fillRect(x, y, cellSize, cellSize);
      if (showSymbols && entry?.symbol) {
        ctx.fillStyle = symbolInkForCanvas(entry.hex);
        ctx.fillText(entry.symbol, x + cellSize / 2, y + cellSize / 2);
      }
    }
  }
  drawExportGrid(ctx, gridLeft, gridTop, cellSize, chart.width, chart.height);

  // Reading hint, then color key.
  let keyY = gridTop + chart.height * cellSize + Math.round(cellSize * 0.35);
  ctx.fillStyle = "#5c6370";
  ctx.textAlign = "left";
  ctx.font = `${Math.round(cellSize * 0.38)}px sans-serif`;
  ctx.fillText(CHART_READING_HINT, padding, keyY);
  keyY = gridTop + chart.height * cellSize + layout.hintHeight;

  ctx.fillStyle = "#1a1d23";
  ctx.font = `bold ${Math.round(cellSize * 0.6)}px sans-serif`;
  ctx.fillText(title, padding, keyY + cellSize * 0.5);
  keyY += layout.keyTitleHeight;
  ctx.font = `${Math.round(cellSize * 0.5)}px sans-serif`;
  buildColorKeyRows(chart).forEach((keyRow) => {
    ctx.fillStyle = keyRow.hex;
    ctx.fillRect(padding, keyY, cellSize, cellSize);
    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.lineWidth = 1;
    ctx.strokeRect(padding + 0.5, keyY + 0.5, cellSize, cellSize);
    if (showSymbols) {
      ctx.fillStyle = symbolInkForCanvas(keyRow.hex);
      ctx.textAlign = "center";
      ctx.fillText(keyRow.symbol, padding + cellSize / 2, keyY + cellSize / 2);
      ctx.textAlign = "left";
    }
    ctx.fillStyle = "#1a1d23";
    ctx.fillText(
      `${keyRow.label} · ${keyRow.stitchCount} stitches`,
      padding + cellSize + 8,
      keyY + cellSize / 2,
    );
    keyY += layout.keyRowHeight;
  });
}

export type PngExport = { blob: Blob; layout: PngLayout };

/** Render the chart to a PNG Blob from canonical data (not a UI screenshot). */
export async function renderChartPngBlob(
  chart: ColorworkChart,
  options: { cellSize?: number; title?: string; showSymbols?: boolean } = {},
): Promise<PngExport> {
  const layout = computePngLayout(chart, options.cellSize ?? DEFAULT_CELL_PX);
  const canvas = document.createElement("canvas");
  canvas.width = layout.width;
  canvas.height = layout.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context is unavailable for PNG export.");
  }
  drawChartToCanvas(ctx, chart, layout, options.title?.trim() || "Color key", {
    showSymbols: options.showSymbols,
  });

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) {
    throw new Error("Could not encode the chart as a PNG.");
  }
  return { blob, layout };
}
