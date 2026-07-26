import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { ColorworkChart } from "../domain/models";
import { buildColorKeyRows, hexToRgb01, shouldLabel } from "./chart-export";

/**
 * PDF export lives in its own module so `pdf-lib` stays out of the app's first
 * load: the Studio only pulls this chunk when a knitter actually exports a PDF.
 */

/** Points-per-cell used for the vector PDF. */
const PDF_CELL_PT = 16;

/**
 * Build a vector-first PDF: filled cell rectangles, grid, symbols, edge
 * coordinates, and a color key. Rendered from canonical chart data, never a
 * screenshot.
 */
export async function buildChartPdfBytes(
  chart: ColorworkChart,
  options: { title?: string; showSymbols?: boolean } = {},
): Promise<Uint8Array> {
  const showSymbols = options.showSymbols ?? true;
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
      if (showSymbols && entry?.symbol) {
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
    if (showSymbols) {
      drawPdfSymbol(
        page,
        keyRow.symbol,
        margin + cell / 2,
        swatchCenterY,
        cell * 0.55,
        symbolInkFor(keyRow.hex),
      );
    }
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
