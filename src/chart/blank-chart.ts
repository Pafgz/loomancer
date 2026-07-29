import type { ColorworkChart } from "../domain/models";
import { chartSymbolForIndex, clampChartDimension } from "./chart-types";
import { recountPalette } from "./palette-edits";

/**
 * The starting color of a blank grid. Undyed wool and unstitched Aida are both
 * near-white, and the grid's own hairlines keep the cells legible against it.
 */
export const DEFAULT_BLANK_CHART_COLOR = "#ffffff";

/**
 * Build a chart of one solid color, ready to be painted cell by cell. The
 * single palette entry carries the full stitch count so the color key is
 * accurate before the first edit.
 */
export function createBlankChart(
  width: number,
  height: number,
  hex: string = DEFAULT_BLANK_CHART_COLOR,
): ColorworkChart {
  const safeWidth = clampChartDimension(width);
  const safeHeight = clampChartDimension(height);
  const stitchCount = safeWidth * safeHeight;

  return {
    width: safeWidth,
    height: safeHeight,
    cells: new Array<number>(stitchCount).fill(0),
    palette: [
      {
        index: 0,
        hex,
        symbol: chartSymbolForIndex(0),
        stitchCount,
      },
    ],
  };
}

/**
 * Resize a hand-drawn chart, anchored at the top-left. Growing fills the new
 * ground with `fillIndex`; shrinking crops. Used for charts with no source
 * image, where nothing would otherwise regenerate the grid at its new size.
 */
export function resizeChart(
  chart: ColorworkChart,
  width: number,
  height: number,
  fillIndex = 0,
): ColorworkChart {
  const safeWidth = clampChartDimension(width);
  const safeHeight = clampChartDimension(height);
  if (safeWidth === chart.width && safeHeight === chart.height) {
    return chart;
  }

  const fill =
    fillIndex >= 0 && fillIndex < chart.palette.length ? fillIndex : 0;
  const cells = new Array<number>(safeWidth * safeHeight).fill(fill);
  const copyWidth = Math.min(safeWidth, chart.width);
  const copyHeight = Math.min(safeHeight, chart.height);

  for (let y = 0; y < copyHeight; y += 1) {
    for (let x = 0; x < copyWidth; x += 1) {
      cells[y * safeWidth + x] = chart.cells[y * chart.width + x] ?? fill;
    }
  }

  return recountPalette({
    ...chart,
    width: safeWidth,
    height: safeHeight,
    cells,
  });
}
