import { describe, expect, it } from "vitest";
import {
  chartCellAtStagePoint,
  chartCellLine,
  chartCellRect,
  chartContentSize,
  chartPointToStagePoint,
  clampChartScale,
  computeFitScale,
  stagePointToChartPoint,
  type ChartViewTransform,
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

function view(overrides: Partial<ChartViewTransform> = {}): ChartViewTransform {
  return {
    viewportWidth: 400,
    viewportHeight: 300,
    chartWidth: 10,
    chartHeight: 8,
    scale: 1,
    translateX: 0,
    translateY: 0,
    ...overrides,
  };
}

describe("stagePointToChartPoint", () => {
  it("round-trips the forward mapping at several scales and pans", () => {
    const cases: Partial<ChartViewTransform>[] = [
      {},
      { scale: 0.37 },
      { scale: 3.5, translateX: -120, translateY: 64 },
      { scale: 1.25, translateX: 45.5, translateY: -12.25 },
      { viewportWidth: 133, viewportHeight: 517, scale: 2, translateX: 9 },
    ];

    for (const overrides of cases) {
      const transform = view(overrides);
      for (const point of [
        { x: 0, y: 0 },
        { x: 17.5, y: 3 },
        { x: 140, y: 111 },
      ]) {
        const stage = chartPointToStagePoint(point.x, point.y, transform);
        const back = stagePointToChartPoint(stage.x, stage.y, transform);
        expect(back.x).toBeCloseTo(point.x);
        expect(back.y).toBeCloseTo(point.y);
      }
    }
  });
});

describe("chartCellAtStagePoint", () => {
  it("finds the stitch the pointer is over, pan and zoom included", () => {
    for (const overrides of [
      {},
      { scale: 4, translateX: -80, translateY: 30 },
      { scale: 0.5, translateX: 12, translateY: -7 },
    ]) {
      const transform = view(overrides);
      for (const cell of [
        { x: 0, y: 0 },
        { x: 4, y: 3 },
        { x: 9, y: 7 },
      ]) {
        const rect = chartCellRect(cell.x, cell.y);
        // Aim at the middle of the stitch, the way a finger or cursor would.
        const stage = chartPointToStagePoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
          transform,
        );
        expect(chartCellAtStagePoint(stage.x, stage.y, transform)).toEqual(cell);
      }
    }
  });

  it("counts the gutter as part of the stitch before it", () => {
    const transform = view();
    const rect = chartCellRect(2, 2);
    const stage = chartPointToStagePoint(
      rect.left + rect.width + 0.5,
      rect.top + rect.height + 0.5,
      transform,
    );
    expect(chartCellAtStagePoint(stage.x, stage.y, transform)).toEqual({
      x: 2,
      y: 2,
    });
  });

  it("returns null outside the grid on every side", () => {
    const transform = view();
    const inside = chartPointToStagePoint(8, 8, transform);
    const past = chartPointToStagePoint(10 * 17 + 20, 8, transform);
    const above = chartPointToStagePoint(8, -20, transform);

    expect(chartCellAtStagePoint(inside.x, inside.y, transform)).toEqual({
      x: 0,
      y: 0,
    });
    expect(chartCellAtStagePoint(past.x, past.y, transform)).toBeNull();
    expect(chartCellAtStagePoint(above.x, above.y, transform)).toBeNull();
  });
});

describe("chartCellLine", () => {
  it("returns the single cell when a drag has not moved", () => {
    expect(chartCellLine({ x: 3, y: 4 }, { x: 3, y: 4 })).toEqual([
      { x: 3, y: 4 },
    ]);
  });

  it("joins far-apart samples into a gap-free run", () => {
    const cells = chartCellLine({ x: 0, y: 0 }, { x: 4, y: 2 });
    expect(cells[0]).toEqual({ x: 0, y: 0 });
    expect(cells.at(-1)).toEqual({ x: 4, y: 2 });
    for (let i = 1; i < cells.length; i += 1) {
      const previous = cells[i - 1]!;
      const current = cells[i]!;
      expect(
        Math.max(
          Math.abs(current.x - previous.x),
          Math.abs(current.y - previous.y),
        ),
      ).toBe(1);
    }
  });

  it("walks backwards and diagonally too", () => {
    expect(chartCellLine({ x: 3, y: 3 }, { x: 0, y: 0 })).toEqual([
      { x: 3, y: 3 },
      { x: 2, y: 2 },
      { x: 1, y: 1 },
      { x: 0, y: 0 },
    ]);
  });
});
