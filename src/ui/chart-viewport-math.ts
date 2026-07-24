/** Natural stitch size in CSS pixels at scale = 1. */
export const CHART_CELL_PX = 16;
/** Hairline gutter between stitches (avoids scaled border bleed). */
export const CHART_GAP_PX = 1;

export function chartContentSize(
  stitchWidth: number,
  stitchHeight: number,
  cellPx: number = CHART_CELL_PX,
  gapPx: number = CHART_GAP_PX,
): { width: number; height: number } {
  const cols = Math.max(1, stitchWidth);
  const rows = Math.max(1, stitchHeight);
  return {
    width: cols * cellPx + Math.max(0, cols - 1) * gapPx,
    height: rows * cellPx + Math.max(0, rows - 1) * gapPx,
  };
}

/**
 * Scale that fits the chart content inside the viewport (both axes),
 * with a little padding so the edge isn't flush.
 */
export function computeFitScale(
  contentWidth: number,
  contentHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  padding = 0.92,
): number {
  if (
    contentWidth <= 0 ||
    contentHeight <= 0 ||
    viewportWidth <= 0 ||
    viewportHeight <= 0
  ) {
    return 1;
  }
  return (
    Math.min(viewportWidth / contentWidth, viewportHeight / contentHeight) *
    padding
  );
}

export function clampChartScale(
  scale: number,
  fitScale: number,
): number {
  const min = fitScale * 0.85;
  const max = Math.max(fitScale * 24, 4);
  return Math.min(max, Math.max(min, scale));
}
