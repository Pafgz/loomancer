import { describe, expect, it } from "vitest";
import type { ColorworkChart } from "../domain/models";
import { createYarnColor } from "../domain/models";
import {
  addChartColor,
  findIndistinguishablePairs,
  mergeChartColors,
  paintChartCell,
  paintChartCells,
  qualitativeDistance,
  rankYarnMatches,
  replaceChartColor,
} from "./palette-edits";

function sampleChart(): ColorworkChart {
  return {
    width: 4,
    height: 2,
    cells: [0, 0, 1, 1, 0, 1, 1, 1],
    palette: [
      { index: 0, hex: "#203040", symbol: "▲", stitchCount: 3 },
      { index: 1, hex: "#d0a050", symbol: "●", stitchCount: 5 },
    ],
  };
}

describe("palette edits", () => {
  it("replaces a chart color globally and updates stitch metadata", () => {
    const next = replaceChartColor(sampleChart(), 1, "#112233", "Forest green");
    expect(next.palette[1]?.hex).toBe("#112233");
    expect(next.palette[1]?.yarnLabel).toBe("Forest green");
    expect(next.palette[1]?.stitchCount).toBe(5);
    expect(next.cells.filter((cell) => cell === 1)).toHaveLength(5);
  });

  it("merges one chart color into another and reindexes cells", () => {
    const next = mergeChartColors(sampleChart(), 0, 1);
    expect(next.palette).toHaveLength(1);
    expect(next.palette[0]?.hex).toBe("#d0a050");
    expect(next.cells.every((cell) => cell === 0)).toBe(true);
    expect(next.palette[0]?.stitchCount).toBe(8);
  });

  it("adds a replacement color to the palette", () => {
    const next = addChartColor(sampleChart(), "#abcdef", "Custom blue");
    expect(next.palette).toHaveLength(3);
    expect(next.palette[2]).toMatchObject({
      hex: "#abcdef",
      yarnLabel: "Custom blue",
      stitchCount: 0,
    });
  });

  it("ranks Yarn Inventory matches without applying them", () => {
    const inventory = [
      createYarnColor("Far", "#ff0000"),
      createYarnColor("Near", "#203145"),
    ];
    const ranked = rankYarnMatches("#203040", inventory);
    expect(ranked[0]?.yarn.name).toBe("Near");
    expect(ranked[0]?.deltaE).toBeLessThan(ranked[1]?.deltaE ?? Number.MAX_VALUE);
    expect(qualitativeDistance(ranked[0]?.deltaE ?? 0)).toBeTruthy();
  });

  it("flags hard-to-distinguish palette pairs without merging them", () => {
    const chart: ColorworkChart = {
      width: 2,
      height: 1,
      cells: [0, 1],
      palette: [
        { index: 0, hex: "#203040", symbol: "▲", stitchCount: 1 },
        { index: 1, hex: "#213141", symbol: "●", stitchCount: 1 },
      ],
    };
    const pairs = findIndistinguishablePairs(chart);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toMatchObject({ leftIndex: 0, rightIndex: 1 });
    expect(chart.palette).toHaveLength(2);
  });
});

describe("paintChartCells", () => {
  it("sets a single cell to the chosen palette color", () => {
    const painted = paintChartCell(sampleChart(), 0, 0, 1);
    expect(painted.cells[0]).toBe(1);
  });

  it("keeps stitch counts summed to width times height", () => {
    const painted = paintChartCell(sampleChart(), 0, 0, 1);
    const total = painted.palette.reduce(
      (sum, entry) => sum + entry.stitchCount,
      0,
    );

    expect(total).toBe(painted.width * painted.height);
    expect(painted.palette[0]?.stitchCount).toBe(2);
    expect(painted.palette[1]?.stitchCount).toBe(6);
  });

  it("paints a whole stroke in one operation", () => {
    const painted = paintChartCells(
      sampleChart(),
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
      ],
      1,
    );

    expect(painted.cells).toEqual([1, 1, 1, 1, 1, 1, 1, 1]);
    expect(painted.palette[0]?.stitchCount).toBe(0);
  });

  it("ignores positions outside the grid", () => {
    const chart = sampleChart();
    expect(paintChartCell(chart, 4, 0, 1)).toBe(chart);
    expect(paintChartCell(chart, 0, 2, 1)).toBe(chart);
    expect(paintChartCell(chart, -1, 0, 1)).toBe(chart);
  });

  it("ignores a palette index that does not exist", () => {
    const chart = sampleChart();
    expect(paintChartCell(chart, 0, 0, 9)).toBe(chart);
    expect(paintChartCell(chart, 0, 0, -1)).toBe(chart);
  });

  it("returns the same chart when the cell already has that color", () => {
    const chart = sampleChart();
    expect(paintChartCell(chart, 0, 0, 0)).toBe(chart);
  });

  it("never mutates the chart it was given", () => {
    const chart = sampleChart();
    paintChartCell(chart, 0, 0, 1);
    expect(chart.cells[0]).toBe(0);
    expect(chart.palette[0]?.stitchCount).toBe(3);
  });
});
