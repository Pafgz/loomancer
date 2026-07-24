import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { ColorworkChart } from "../domain/models";

/** Hard cap for a single PNG side, per the MVP spec. */
export const MAX_PNG_SIDE = 4096;

/** Default on-screen cell size (px) used when the caller doesn't specify one. */
export const DEFAULT_CELL_PX = 28;

/** Points-per-cell used for the vector PDF. */
const PDF_CELL_PT = 16;

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
  return chart.palette[cell]?.hex ?? "#cccccc";
}

export type PngLayout = {
  requestedCellSize: number;
  cellSize: number;
  gutter: number;
  padding: number;
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
  const keyTitleHeight = Math.round(cellSize * 1.6);
  const keyRowHeight = Math.round(cellSize * 1.3);
  const keyHeight =
    keyTitleHeight + keyRowHeight * chart.palette.length + padding;
  const chartWidthPx = chart.width * cellSize;
  const chartHeightPx = chart.height * cellSize;
  const width = padding + gutter + chartWidthPx + padding;
  const height = padding + gutter + chartHeightPx + keyHeight + padding;
  return {
    cellSize,
    gutter,
    padding,
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

function hexToRgb01(hex: string): { r: number; g: number; b: number } {
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
function shouldLabel(oneBased: number, total: number): boolean {
  return oneBased === 1 || oneBased === total || oneBased % 5 === 0;
}

/**
 * Build a vector-first PDF: filled cell rectangles, grid, symbols, edge
 * coordinates, and a color key. Rendered from canonical chart data, never a
 * screenshot.
 */
export async function buildChartPdfBytes(
  chart: ColorworkChart,
  options: { title?: string } = {},
): Promise<Uint8Array> {
  const cell = PDF_CELL_PT;
  const gutter = cell * 1.8;
  const margin = 36;
  const titleHeight = 28;
  const keyRowHeight = cell * 1.4;
  const keyHeight = cell * 1.6 + keyRowHeight * chart.palette.length;

  const chartW = chart.width * cell;
  const chartH = chart.height * cell;
  const pageWidth = margin * 2 + gutter + chartW;
  const pageHeight =
    margin * 2 + titleHeight + gutter + chartH + cell + keyHeight;

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([pageWidth, pageHeight]);

  const line = rgb(0.75, 0.77, 0.82);
  const ink = rgb(0.1, 0.11, 0.14);

  // pdf-lib uses a bottom-left origin; we lay the chart out from the top.
  const top = pageHeight - margin;

  page.drawText(sanitizeWinAnsi(options.title?.trim() || "Colorwork Chart"), {
    x: margin,
    y: top - 18,
    size: 18,
    font: bold,
    color: ink,
  });
  page.drawText(`${chart.width} × ${chart.height} stitches`, {
    x: margin,
    y: top - 18 - 16,
    size: 10,
    font,
    color: rgb(0.4, 0.42, 0.48),
  });

  const gridTop = top - titleHeight - 12;
  const gridLeft = margin + gutter;

  // Column coordinates (top).
  for (let col = 0; col < chart.width; col += 1) {
    if (!shouldLabel(col + 1, chart.width)) continue;
    page.drawText(String(col + 1), {
      x: gridLeft + col * cell + cell / 2 - 3,
      y: gridTop + 4,
      size: 6,
      font,
      color: rgb(0.45, 0.47, 0.53),
    });
  }

  for (let row = 0; row < chart.height; row += 1) {
    const cellTopY = gridTop - row * cell;
    // Row coordinates (left).
    if (shouldLabel(row + 1, chart.height)) {
      page.drawText(String(row + 1), {
        x: gridLeft - 16,
        y: cellTopY - cell / 2 - 3,
        size: 6,
        font,
        color: rgb(0.45, 0.47, 0.53),
      });
    }
    for (let col = 0; col < chart.width; col += 1) {
      const entry = chart.palette[chart.cells[row * chart.width + col]];
      const x = gridLeft + col * cell;
      const y = cellTopY - cell;
      page.drawRectangle({
        x,
        y,
        width: cell,
        height: cell,
        color: hexToRgb01Color(entry?.hex ?? "#cccccc"),
        borderColor: line,
        borderWidth: 0.5,
      });
      if (entry?.symbol) {
        drawPdfSymbol(
          page,
          entry.symbol,
          x + cell / 2,
          y + cell / 2,
          cell * 0.55,
          symbolInkFor(entry.hex),
        );
      }
    }
  }

  // Color key.
  const keyTop = gridTop - chartH - cell - 8;
  page.drawText("Color key", {
    x: margin,
    y: keyTop,
    size: 12,
    font: bold,
    color: ink,
  });
  buildColorKeyRows(chart).forEach((keyRow, index) => {
    const rowY = keyTop - 16 - index * keyRowHeight;
    const swatchCenterY = rowY - cell / 2 + 2;
    page.drawRectangle({
      x: margin,
      y: rowY - cell + 4,
      width: cell,
      height: cell,
      color: hexToRgb01Color(keyRow.hex),
      borderColor: line,
      borderWidth: 0.5,
    });
    drawPdfSymbol(
      page,
      keyRow.symbol,
      margin + cell / 2,
      swatchCenterY,
      cell * 0.55,
      symbolInkFor(keyRow.hex),
    );
    page.drawText(
      sanitizeWinAnsi(`${keyRow.label} · ${keyRow.stitchCount} stitches`),
      {
        x: margin + cell + 8,
        y: swatchCenterY - 3,
        size: 9,
        font,
        color: ink,
      },
    );
  });

  return doc.save();
}

/** Replace characters the standard PDF font can't encode. */
function sanitizeWinAnsi(text: string): string {
  return text.replace(/[^\u0000-\u00ff]/g, "?");
}

type PdfColor = ReturnType<typeof rgb>;
type PdfPage = ReturnType<PDFDocument["addPage"]>;

/**
 * Draw a chart symbol as vector primitives so it renders in the PDF without a
 * Unicode font. Filled shapes use `color`; outline shapes stroke with it.
 */
function drawPdfSymbol(
  page: PdfPage,
  symbol: string,
  cx: number,
  cy: number,
  size: number,
  color: PdfColor,
): void {
  const s = size;
  const anchorX = cx - s / 2;
  const anchorY = cy + s / 2; // svg y-down anchored at the top of the glyph box
  const triangle = `M ${s / 2} 0 L ${s} ${s} L 0 ${s} Z`;
  const diamond = `M ${s / 2} 0 L ${s} ${s / 2} L ${s / 2} ${s} L 0 ${s / 2} Z`;
  const r = s / 2;
  const thickness = Math.max(0.6, s * 0.14);

  switch (symbol) {
    case "▲":
      page.drawSvgPath(triangle, { x: anchorX, y: anchorY, color });
      return;
    case "△":
      page.drawSvgPath(triangle, {
        x: anchorX,
        y: anchorY,
        borderColor: color,
        borderWidth: thickness,
      });
      return;
    case "◆":
      page.drawSvgPath(diamond, { x: anchorX, y: anchorY, color });
      return;
    case "◇":
      page.drawSvgPath(diamond, {
        x: anchorX,
        y: anchorY,
        borderColor: color,
        borderWidth: thickness,
      });
      return;
    case "●":
      page.drawCircle({ x: cx, y: cy, size: r, color });
      return;
    case "○":
      page.drawCircle({
        x: cx,
        y: cy,
        size: r,
        borderColor: color,
        borderWidth: thickness,
      });
      return;
    case "■":
      page.drawRectangle({
        x: cx - r,
        y: cy - r,
        width: s,
        height: s,
        color,
      });
      return;
    case "□":
      page.drawRectangle({
        x: cx - r,
        y: cy - r,
        width: s,
        height: s,
        borderColor: color,
        borderWidth: thickness,
      });
      return;
    case "+":
      page.drawLine({
        start: { x: cx - r, y: cy },
        end: { x: cx + r, y: cy },
        thickness,
        color,
      });
      page.drawLine({
        start: { x: cx, y: cy - r },
        end: { x: cx, y: cy + r },
        thickness,
        color,
      });
      return;
    case "×":
      page.drawLine({
        start: { x: cx - r, y: cy - r },
        end: { x: cx + r, y: cy + r },
        thickness,
        color,
      });
      page.drawLine({
        start: { x: cx - r, y: cy + r },
        end: { x: cx + r, y: cy - r },
        thickness,
        color,
      });
      return;
    case "*":
    case "✦": {
      const d = r * 0.71;
      page.drawLine({
        start: { x: cx - r, y: cy },
        end: { x: cx + r, y: cy },
        thickness,
        color,
      });
      page.drawLine({
        start: { x: cx, y: cy - r },
        end: { x: cx, y: cy + r },
        thickness,
        color,
      });
      page.drawLine({
        start: { x: cx - d, y: cy - d },
        end: { x: cx + d, y: cy + d },
        thickness,
        color,
      });
      page.drawLine({
        start: { x: cx - d, y: cy + d },
        end: { x: cx + d, y: cy - d },
        thickness,
        color,
      });
      return;
    }
    default:
      page.drawCircle({ x: cx, y: cy, size: r, color });
  }
}

function hexToRgb01Color(hex: string) {
  const { r, g, b } = hexToRgb01(hex);
  return rgb(r, g, b);
}

/** Pick black or white symbol ink for contrast against the cell color. */
function symbolInkFor(hex: string) {
  const { r, g, b } = hexToRgb01(hex);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 0.6 ? rgb(0.1, 0.1, 0.1) : rgb(0.95, 0.95, 0.95);
}

function symbolInkForCanvas(hex: string): string {
  const { r, g, b } = hexToRgb01(hex);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 0.6 ? "#1a1a1a" : "#f2f2f2";
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
): void {
  const { cellSize, gutter, padding } = layout;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, layout.width, layout.height);

  const gridLeft = padding + gutter;
  const gridTop = padding + gutter;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${Math.round(cellSize * 0.5)}px monospace`;

  // Coordinates.
  ctx.fillStyle = "#71767f";
  for (let col = 0; col < chart.width; col += 1) {
    if (!shouldLabel(col + 1, chart.width)) continue;
    ctx.fillText(
      String(col + 1),
      gridLeft + col * cellSize + cellSize / 2,
      gridTop - cellSize * 0.5,
    );
  }
  for (let row = 0; row < chart.height; row += 1) {
    if (!shouldLabel(row + 1, chart.height)) continue;
    ctx.fillText(
      String(row + 1),
      gridLeft - cellSize * 0.8,
      gridTop + row * cellSize + cellSize / 2,
    );
  }

  // Cells + symbols.
  for (let row = 0; row < chart.height; row += 1) {
    for (let col = 0; col < chart.width; col += 1) {
      const entry = chart.palette[chart.cells[row * chart.width + col]];
      const x = gridLeft + col * cellSize;
      const y = gridTop + row * cellSize;
      ctx.fillStyle = entry?.hex ?? "#cccccc";
      ctx.fillRect(x, y, cellSize, cellSize);
      ctx.strokeStyle = "rgba(0,0,0,0.18)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, cellSize, cellSize);
      if (entry?.symbol) {
        ctx.fillStyle = symbolInkForCanvas(entry.hex);
        ctx.fillText(entry.symbol, x + cellSize / 2, y + cellSize / 2);
      }
    }
  }

  // Color key.
  let keyY = gridTop + chart.height * cellSize + layout.padding;
  ctx.fillStyle = "#1a1d23";
  ctx.textAlign = "left";
  ctx.font = `bold ${Math.round(cellSize * 0.6)}px sans-serif`;
  ctx.fillText(title, padding, keyY + cellSize * 0.5);
  keyY += layout.keyTitleHeight;
  ctx.font = `${Math.round(cellSize * 0.5)}px sans-serif`;
  buildColorKeyRows(chart).forEach((keyRow) => {
    ctx.fillStyle = keyRow.hex;
    ctx.fillRect(padding, keyY, cellSize, cellSize);
    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.strokeRect(padding + 0.5, keyY + 0.5, cellSize, cellSize);
    ctx.fillStyle = "#1a1d23";
    ctx.fillText(
      `${keyRow.symbol}  ${keyRow.label} · ${keyRow.stitchCount} stitches`,
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
  options: { cellSize?: number; title?: string } = {},
): Promise<PngExport> {
  const layout = computePngLayout(chart, options.cellSize ?? DEFAULT_CELL_PX);
  const canvas = document.createElement("canvas");
  canvas.width = layout.width;
  canvas.height = layout.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context is unavailable for PNG export.");
  }
  drawChartToCanvas(ctx, chart, layout, options.title?.trim() || "Color key");

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) {
    throw new Error("Could not encode the chart as a PNG.");
  }
  return { blob, layout };
}
