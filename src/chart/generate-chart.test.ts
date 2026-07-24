import { describe, expect, it } from "vitest";
import {
  DEFAULT_CHART_COLORS,
  gridSizeFromDetail,
  longEdgeStitchesForDetail,
} from "./chart-types";
import { generateColorworkChart } from "./generate-chart";

function solidImage(
  width: number,
  height: number,
  rgb: [number, number, number],
) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    const offset = i * 4;
    data[offset] = rgb[0];
    data[offset + 1] = rgb[1];
    data[offset + 2] = rgb[2];
    data[offset + 3] = 255;
  }
  return { width, height, data };
}

function splitImage(width: number, height: number) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const left = x < width / 2;
      data[offset] = left ? 20 : 220;
      data[offset + 1] = left ? 40 : 30;
      data[offset + 2] = left ? 60 : 40;
      data[offset + 3] = 255;
    }
  }
  return { width, height, data };
}

describe("grid sizing", () => {
  it("maps detail to a larger long edge as detail increases", () => {
    expect(longEdgeStitchesForDetail(1)).toBeLessThan(longEdgeStitchesForDetail(10));
  });

  it("preserves aspect ratio when deriving width and height", () => {
    const grid = gridSizeFromDetail(6, 2);
    expect(grid.width / grid.height).toBeCloseTo(2, 1);
  });
});

describe("generateColorworkChart", () => {
  it("resamples to the requested stitch grid and keeps stitch counts consistent", () => {
    const chart = generateColorworkChart({
      image: solidImage(40, 20, [36, 75, 60]),
      width: 8,
      height: 4,
      maxColors: DEFAULT_CHART_COLORS,
    });

    expect(chart.width).toBe(8);
    expect(chart.height).toBe(4);
    expect(chart.cells).toHaveLength(32);
    expect(chart.palette.length).toBeGreaterThanOrEqual(1);
    expect(chart.palette.length).toBeLessThanOrEqual(DEFAULT_CHART_COLORS);
    expect(
      chart.palette.reduce((sum, entry) => sum + entry.stitchCount, 0),
    ).toBe(32);
    expect(chart.palette.every((entry) => entry.symbol.length > 0)).toBe(true);
  });

  it("respects the maximum palette size for multi-color images", () => {
    const chart = generateColorworkChart({
      image: splitImage(40, 20),
      width: 10,
      height: 5,
      maxColors: 2,
    });

    expect(chart.palette.length).toBeLessThanOrEqual(2);
    expect(chart.palette.length).toBe(2);
    expect(
      chart.palette.reduce((sum, entry) => sum + entry.stitchCount, 0),
    ).toBe(50);
  });

  it("clamps invalid palette bounds to the supported 2–12 range", () => {
    const tooLow = generateColorworkChart({
      image: splitImage(20, 20),
      width: 4,
      height: 4,
      maxColors: 1,
    });
    const tooHigh = generateColorworkChart({
      image: splitImage(20, 20),
      width: 4,
      height: 4,
      maxColors: 40,
    });

    expect(tooLow.palette.length).toBeLessThanOrEqual(2);
    expect(tooHigh.palette.length).toBeLessThanOrEqual(12);
  });
});
