export const MIN_CHART_COLORS = 2;
export const MAX_CHART_COLORS = 12;
export const DEFAULT_CHART_COLORS = 6;
export const MIN_DETAIL = 1;
export const MAX_DETAIL = 10;
export const DEFAULT_DETAIL = 6;
export const MIN_LONG_EDGE_STITCHES = 16;
export const MAX_LONG_EDGE_STITCHES = 150;
export const MAX_CHART_DIMENSION = 300;

export const CHART_SYMBOLS = [
  "▲",
  "●",
  "□",
  "◆",
  "×",
  "+",
  "○",
  "■",
  "△",
  "◇",
  "*",
  "✦",
] as const;

export type RgbaImage = {
  width: number;
  height: number;
  data: Uint8ClampedArray;
};

export type ChartPaletteEntry = {
  index: number;
  hex: string;
  symbol: string;
  stitchCount: number;
};

export type ColorworkChart = {
  width: number;
  height: number;
  cells: number[];
  palette: ChartPaletteEntry[];
};

export type GenerateChartInput = {
  image: RgbaImage;
  width: number;
  height: number;
  maxColors: number;
};

export function clampDetail(detail: number): number {
  return Math.min(MAX_DETAIL, Math.max(MIN_DETAIL, Math.round(detail)));
}

export function clampMaxColors(maxColors: number): number {
  return Math.min(
    MAX_CHART_COLORS,
    Math.max(MIN_CHART_COLORS, Math.round(maxColors)),
  );
}

export function longEdgeStitchesForDetail(detail: number): number {
  const t = (clampDetail(detail) - MIN_DETAIL) / (MAX_DETAIL - MIN_DETAIL);
  return Math.round(
    MIN_LONG_EDGE_STITCHES +
      t * (MAX_LONG_EDGE_STITCHES - MIN_LONG_EDGE_STITCHES),
  );
}

export function gridSizeFromDetail(
  detail: number,
  aspectWidthOverHeight: number,
): { width: number; height: number } {
  const longEdge = longEdgeStitchesForDetail(detail);
  if (aspectWidthOverHeight >= 1) {
    const width = Math.min(MAX_CHART_DIMENSION, longEdge);
    const height = Math.max(
      1,
      Math.min(MAX_CHART_DIMENSION, Math.round(width / aspectWidthOverHeight)),
    );
    return { width, height };
  }

  const height = Math.min(MAX_CHART_DIMENSION, longEdge);
  const width = Math.max(
    1,
    Math.min(MAX_CHART_DIMENSION, Math.round(height * aspectWidthOverHeight)),
  );
  return { width, height };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}
