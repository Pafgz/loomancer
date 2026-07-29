import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import type { ColorworkChart } from "../domain/models";
import {
  buildColorKeyRows,
  centerLineOffsetCells,
  chartCellHex,
  chartReadingHint,
  computePngLayout,
  isMajorGridLine,
  MAX_PNG_SIDE,
  pdfLegendTitle,
  pdfSubtitle,
  rowNumberAtRow,
  shouldLabel,
  stitchNumberAtColumn,
} from "./chart-export";
import { buildChartPdfBytes } from "./chart-pdf";

function sampleChart(): ColorworkChart {
  return {
    width: 3,
    height: 2,
    // row 0: A B A ; row 1: C A B
    cells: [0, 1, 0, 2, 0, 1],
    palette: [
      { index: 0, hex: "#203040", symbol: "▲", stitchCount: 3 },
      { index: 1, hex: "#d0a050", symbol: "●", stitchCount: 2, yarnLabel: "Gold" },
      { index: 2, hex: "#a0322d", symbol: "■", stitchCount: 1 },
    ],
  };
}

describe("buildColorKeyRows", () => {
  it("includes a row per palette entry with symbol, hex, label, and stitch count", () => {
    const rows = buildColorKeyRows(sampleChart());
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual({
      symbol: "▲",
      hex: "#203040",
      label: "#203040",
      stitchCount: 3,
    });
    // yarnLabel takes precedence over hex as the label
    expect(rows[1]).toEqual({
      symbol: "●",
      hex: "#d0a050",
      label: "Gold",
      stitchCount: 2,
    });
  });
});

describe("chartCellHex", () => {
  it("maps each cell to its palette color (canonical chart data)", () => {
    const chart = sampleChart();
    expect(chartCellHex(chart, 0, 0)).toBe("#203040");
    expect(chartCellHex(chart, 0, 1)).toBe("#d0a050");
    expect(chartCellHex(chart, 1, 0)).toBe("#a0322d");
    expect(chartCellHex(chart, 1, 2)).toBe("#d0a050");
  });
});

describe("traditional knitting coordinates", () => {
  it("numbers stitches from the right and rows from the bottom", () => {
    expect(stitchNumberAtColumn(0, 12)).toBe(12);
    expect(stitchNumberAtColumn(11, 12)).toBe(1);
    expect(rowNumberAtRow(0, 20)).toBe(20);
    expect(rowNumberAtRow(19, 20)).toBe(1);
  });

  it("marks major grid lines every 5 from the knitting origin, plus both edges", () => {
    expect(isMajorGridLine(0, 12)).toBe(true); // origin (right / bottom)
    expect(isMajorGridLine(5, 12)).toBe(true);
    expect(isMajorGridLine(10, 12)).toBe(true);
    expect(isMajorGridLine(12, 12)).toBe(true); // far edge
    expect(isMajorGridLine(1, 12)).toBe(false);
    expect(isMajorGridLine(4, 12)).toBe(false);
    expect(isMajorGridLine(7, 12)).toBe(false);
  });

  it("labels edges and every 5th stitch/row", () => {
    expect(shouldLabel(1, 48)).toBe(true);
    expect(shouldLabel(5, 48)).toBe(true);
    expect(shouldLabel(48, 48)).toBe(true);
    expect(shouldLabel(7, 48)).toBe(false);
  });
});

describe("cross-stitch Stitch-ready coordinates", () => {
  it("numbers stitches from the left and rows from the top", () => {
    expect(stitchNumberAtColumn(0, 12, "cross-stitch")).toBe(1);
    expect(stitchNumberAtColumn(11, 12, "cross-stitch")).toBe(12);
    expect(rowNumberAtRow(0, 20, "cross-stitch")).toBe(1);
    expect(rowNumberAtRow(19, 20, "cross-stitch")).toBe(20);
  });

  it("marks major grid lines every 10 from the top-left origin, plus both edges", () => {
    expect(isMajorGridLine(0, 48, "cross-stitch")).toBe(true);
    expect(isMajorGridLine(10, 48, "cross-stitch")).toBe(true);
    expect(isMajorGridLine(20, 48, "cross-stitch")).toBe(true);
    expect(isMajorGridLine(48, 48, "cross-stitch")).toBe(true);
    expect(isMajorGridLine(5, 48, "cross-stitch")).toBe(false);
    expect(isMajorGridLine(15, 48, "cross-stitch")).toBe(false);
  });

  it("labels edges and every 10th stitch/row", () => {
    expect(shouldLabel(1, 48, "cross-stitch")).toBe(true);
    expect(shouldLabel(10, 48, "cross-stitch")).toBe(true);
    expect(shouldLabel(48, 48, "cross-stitch")).toBe(true);
    expect(shouldLabel(5, 48, "cross-stitch")).toBe(false);
  });

  it("places the center guideline at the geometric midpoint in cell units", () => {
    expect(centerLineOffsetCells(80)).toBe(40);
    expect(centerLineOffsetCells(11)).toBe(5.5);
  });

  it("uses a cross-stitch reading hint distinct from knitting", () => {
    expect(chartReadingHint("knitting")).toMatch(/bottom-right/i);
    expect(chartReadingHint("cross-stitch")).toMatch(/center/i);
    expect(chartReadingHint("cross-stitch")).not.toMatch(/bottom-right/i);
  });

  it("packages the PDF subtitle and floss-chart legend title for Stitchers", () => {
    expect(pdfSubtitle("cross-stitch", 80, 100)).toBe("Cross-stitch · 80 × 100");
    expect(pdfSubtitle("knitting", 80, 100)).toBe("80 × 100 stitches");
    expect(pdfLegendTitle("cross-stitch")).toBe("Floss chart");
    expect(pdfLegendTitle("knitting")).toBe("Color key");
  });
});

describe("computePngLayout", () => {
  it("sizes the image from the chart grid plus coordinate gutter, hint, and color key", () => {
    const layout = computePngLayout(sampleChart(), 20);
    expect(layout.cellSize).toBe(20);
    expect(layout.clamped).toBe(false);
    expect(layout.hintHeight).toBeGreaterThan(0);
    // chart occupies width*cell / height*cell within the image
    expect(layout.width).toBeGreaterThan(3 * 20);
    expect(layout.height).toBeGreaterThan(2 * 20);
    expect(layout.width).toBeLessThanOrEqual(MAX_PNG_SIDE);
    expect(layout.height).toBeLessThanOrEqual(MAX_PNG_SIDE);
  });

  it("omits reading-hint height for Stitch-ready PNG layout", () => {
    const knitting = computePngLayout(sampleChart(), 20, "knitting");
    const stitch = computePngLayout(sampleChart(), 20, "cross-stitch");
    expect(stitch.hintHeight).toBe(0);
    expect(stitch.height).toBeLessThan(knitting.height);
  });

  it("caps the image at 4096 px per side and reduces the cell size when exceeded", () => {
    const big: ColorworkChart = {
      width: 300,
      height: 300,
      cells: Array.from({ length: 300 * 300 }, () => 0),
      palette: [{ index: 0, hex: "#112233", symbol: "A", stitchCount: 90000 }],
    };
    const layout = computePngLayout(big, 64);
    expect(layout.clamped).toBe(true);
    expect(layout.cellSize).toBeLessThan(64);
    expect(layout.cellSize).toBeGreaterThanOrEqual(1);
    expect(layout.width).toBeLessThanOrEqual(MAX_PNG_SIDE);
    expect(layout.height).toBeLessThanOrEqual(MAX_PNG_SIDE);
  });
});

describe("buildChartPdfBytes", () => {
  it("produces a valid, single-page PDF with positive dimensions", async () => {
    const bytes = await buildChartPdfBytes(sampleChart());
    // %PDF- magic header
    expect(bytes[0]).toBe(0x25);
    expect(bytes[1]).toBe(0x50);
    expect(bytes[2]).toBe(0x44);
    expect(bytes[3]).toBe(0x46);

    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
    const page = doc.getPage(0);
    expect(page.getWidth()).toBeGreaterThan(0);
    expect(page.getHeight()).toBeGreaterThan(0);
  });

  it("builds a taller single-page Stitch-ready PDF (footer packaging)", async () => {
    const stitchBytes = await buildChartPdfBytes(sampleChart(), {
      title: "Sampler",
      craftType: "cross-stitch",
    });
    const knitBytes = await buildChartPdfBytes(sampleChart(), {
      title: "Sampler",
      craftType: "knitting",
    });
    const stitchDoc = await PDFDocument.load(stitchBytes);
    const knitDoc = await PDFDocument.load(knitBytes);
    expect(stitchDoc.getPageCount()).toBe(1);
    expect(stitchDoc.getPage(0).getHeight()).toBeGreaterThan(
      knitDoc.getPage(0).getHeight(),
    );
  });
});
