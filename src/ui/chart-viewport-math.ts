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

/**
 * Everything the two mappings below need to agree on: the visible stage, the
 * chart drawn centred inside it, and the live `translate(tx, ty) scale(s)`.
 */
export type ChartViewTransform = {
  /** Visible stage size in CSS pixels. */
  viewportWidth: number;
  viewportHeight: number;
  /** Chart size in stitches. */
  chartWidth: number;
  chartHeight: number;
  scale: number;
  translateX: number;
  translateY: number;
  cellPx?: number;
  gapPx?: number;
};

/**
 * Chart content pixels to stage pixels. The chart's untransformed box is
 * centred in the stage and scaled about its own centre, which is why both
 * halves appear: the stage's centre positions it, the content's centre is the
 * point the scale leaves alone.
 */
export function chartPointToStagePoint(
  contentX: number,
  contentY: number,
  view: ChartViewTransform,
): { x: number; y: number } {
  const content = chartContentSize(
    view.chartWidth,
    view.chartHeight,
    view.cellPx ?? CHART_CELL_PX,
    view.gapPx ?? CHART_GAP_PX,
  );
  return {
    x:
      view.viewportWidth / 2 +
      view.translateX +
      (contentX - content.width / 2) * view.scale,
    y:
      view.viewportHeight / 2 +
      view.translateY +
      (contentY - content.height / 2) * view.scale,
  };
}

/** Inverse of {@link chartPointToStagePoint}. */
export function stagePointToChartPoint(
  stageX: number,
  stageY: number,
  view: ChartViewTransform,
): { x: number; y: number } {
  const content = chartContentSize(
    view.chartWidth,
    view.chartHeight,
    view.cellPx ?? CHART_CELL_PX,
    view.gapPx ?? CHART_GAP_PX,
  );
  const scale = view.scale === 0 ? 1 : view.scale;
  return {
    x:
      (stageX - view.viewportWidth / 2 - view.translateX) / scale +
      content.width / 2,
    y:
      (stageY - view.viewportHeight / 2 - view.translateY) / scale +
      content.height / 2,
  };
}

export type ChartCell = { x: number; y: number };

/**
 * The stitch under a stage point, or null when the point misses the grid. The
 * hairline gutter counts as part of the stitch before it, so there is no dead
 * band between cells to click into.
 */
export function chartCellAtStagePoint(
  stageX: number,
  stageY: number,
  view: ChartViewTransform,
): ChartCell | null {
  const pitch = (view.cellPx ?? CHART_CELL_PX) + (view.gapPx ?? CHART_GAP_PX);
  const point = stagePointToChartPoint(stageX, stageY, view);
  if (point.x < 0 || point.y < 0) {
    return null;
  }

  const x = Math.floor(point.x / pitch);
  const y = Math.floor(point.y / pitch);
  if (x >= view.chartWidth || y >= view.chartHeight) {
    return null;
  }
  return { x, y };
}

/** Where one stitch sits within the chart content, for overlays. */
export function chartCellRect(
  x: number,
  y: number,
  cellPx: number = CHART_CELL_PX,
  gapPx: number = CHART_GAP_PX,
): { left: number; top: number; width: number; height: number } {
  const pitch = cellPx + gapPx;
  return { left: x * pitch, top: y * pitch, width: cellPx, height: cellPx };
}

/**
 * The stitches a drag passes through between two samples. Pointer events are
 * sparse, so a fast drag reports a handful of far-apart points; without the
 * line between them a stroke would come out as dots.
 */
export function chartCellLine(from: ChartCell, to: ChartCell): ChartCell[] {
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  const stepX = from.x < to.x ? 1 : -1;
  const stepY = from.y < to.y ? 1 : -1;

  let x = from.x;
  let y = from.y;
  let error = dx - dy;
  const cells: ChartCell[] = [{ x, y }];

  while (x !== to.x || y !== to.y) {
    const doubled = error * 2;
    if (doubled > -dy) {
      error -= dy;
      x += stepX;
    }
    if (doubled < dx) {
      error += dx;
      y += stepY;
    }
    cells.push({ x, y });
  }

  return cells;
}
