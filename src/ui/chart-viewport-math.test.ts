import { describe, expect, it } from "vitest";
import {
  chartContentSize,
  clampChartScale,
  computeFitScale,
} from "./chart-viewport-math";

describe("chartContentSize", () => {
  it("multiplies stitches by cell size and includes gutters", () => {
    expect(chartContentSize(40, 30, 10, 1)).toEqual({
      width: 40 * 10 + 39,
      height: 30 * 10 + 29,
    });
  });
});

describe("computeFitScale", () => {
  it("fits both axes inside the viewport", () => {
    // Content 400×300 into 200×200 → limited by width: 0.5 * padding
    expect(computeFitScale(400, 300, 200, 200, 1)).toBeCloseTo(0.5);
    // Content 100×400 into 200×200 → limited by height
    expect(computeFitScale(100, 400, 200, 200, 1)).toBeCloseTo(0.5);
  });

  it("applies padding", () => {
    expect(computeFitScale(100, 100, 100, 100, 0.9)).toBeCloseTo(0.9);
  });
});

describe("clampChartScale", () => {
  it("keeps scale between ~fit and a generous max", () => {
    expect(clampChartScale(0.01, 0.5)).toBeCloseTo(0.5 * 0.85);
    expect(clampChartScale(100, 0.5)).toBeCloseTo(Math.max(0.5 * 24, 4));
    expect(clampChartScale(1, 0.5)).toBe(1);
  });
});
