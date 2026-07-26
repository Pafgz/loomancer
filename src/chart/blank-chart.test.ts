import { describe, expect, it } from "vitest";
import {
  createBlankChart,
  DEFAULT_BLANK_CHART_COLOR,
  resizeChart,
} from "./blank-chart";
import { MAX_CHART_DIMENSION } from "./chart-types";
import { paintChartCell } from "./palette-edits";

describe("createBlankChart", () => {
  it("fills every cell with the single palette entry", () => {
    const chart = createBlankChart(4, 3);

    expect(chart.width).toBe(4);
    expect(chart.height).toBe(3);
    expect(chart.cells).toHaveLength(12);
    expect(chart.cells.every((cell) => cell === 0)).toBe(true);
  });

  it("gives the starting entry a symbol and the full stitch count", () => {
    const [entry, ...rest] = createBlankChart(4, 3).palette;

    expect(rest).toHaveLength(0);
    expect(entry.index).toBe(0);
    expect(entry.hex).toBe(DEFAULT_BLANK_CHART_COLOR);
    expect(entry.symbol).not.toBe("");
    expect(entry.stitchCount).toBe(12);
  });

  it("accepts an explicit background color", () => {
    expect(createBlankChart(2, 2, "#123456").palette[0].hex).toBe("#123456");
  });

  it("clamps dimensions into the supported chart range", () => {
    expect(createBlankChart(0, 0).width).toBe(1);
    expect(createBlankChart(9_999, 9_999).width).toBe(MAX_CHART_DIMENSION);
    expect(createBlankChart(4.6, 3.2).width).toBe(5);
  });

  it("keeps the stitch count summed to width times height", () => {
    const chart = createBlankChart(7, 5);
    const total = chart.palette.reduce(
      (sum, entry) => sum + entry.stitchCount,
      0,
    );

    expect(total).toBe(chart.width * chart.height);
  });
});

describe("resizeChart", () => {
  it("returns the same chart when the size is unchanged", () => {
    const chart = createBlankChart(4, 3);
    expect(resizeChart(chart, 4, 3)).toBe(chart);
  });

  it("keeps painted cells in place when growing, anchored top-left", () => {
    const painted = paintChartCell(
      addSecondColor(createBlankChart(3, 3)),
      1,
      1,
      1,
    );

    const grown = resizeChart(painted, 5, 5);

    expect(grown.width).toBe(5);
    expect(grown.height).toBe(5);
    expect(grown.cells[1 * 5 + 1]).toBe(1);
    expect(grown.cells[0]).toBe(0);
  });

  it("crops cells that fall outside a smaller grid", () => {
    const painted = paintChartCell(
      addSecondColor(createBlankChart(4, 4)),
      3,
      3,
      1,
    );

    const shrunk = resizeChart(painted, 2, 2);

    expect(shrunk.cells).toHaveLength(4);
    expect(shrunk.cells.every((cell) => cell === 0)).toBe(true);
  });

  it("keeps stitch counts summed to the new width times height", () => {
    const resized = resizeChart(createBlankChart(4, 4), 6, 3);
    const total = resized.palette.reduce(
      (sum, entry) => sum + entry.stitchCount,
      0,
    );

    expect(total).toBe(18);
  });
});

function addSecondColor(chart: ReturnType<typeof createBlankChart>) {
  return {
    ...chart,
    palette: [
      ...chart.palette,
      { index: 1, hex: "#222222", symbol: "●", stitchCount: 0 },
    ],
  };
}
