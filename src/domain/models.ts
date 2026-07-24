export const PATTERN_PROJECT_SCHEMA_VERSION = 3;
export const YARN_INVENTORY_SCHEMA_VERSION = 1;

export type RotationDegrees = 0 | 90 | 180 | 270;

export type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ChartPaletteEntry = {
  index: number;
  hex: string;
  symbol: string;
  stitchCount: number;
  yarnLabel?: string;
};

export type ColorworkChart = {
  width: number;
  height: number;
  cells: number[];
  palette: ChartPaletteEntry[];
};

export type PatternProject = {
  id: string;
  name: string;
  schemaVersion: typeof PATTERN_PROJECT_SCHEMA_VERSION;
  createdAt: string;
  updatedAt: string;
  sourceImage?: Blob;
  sourceFileName?: string;
  sourceMimeType?: string;
  naturalWidth?: number;
  naturalHeight?: number;
  rotationDegrees: RotationDegrees;
  crop: CropRect | null;
  detailLevel: number;
  chartWidth: number;
  chartHeight: number;
  aspectLocked: boolean;
  maxColors: number;
  chart: ColorworkChart | null;
  paletteManuallyEdited: boolean;
};

export type YarnColor = {
  id: string;
  name: string;
  displayColor: string;
  brand?: string;
  line?: string;
  colorCode?: string;
  notes?: string;
  quantity?: string;
  schemaVersion: typeof YARN_INVENTORY_SCHEMA_VERSION;
};

export function createEmptyPatternProject(name: string): PatternProject {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    schemaVersion: PATTERN_PROJECT_SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    rotationDegrees: 0,
    crop: null,
    detailLevel: 6,
    chartWidth: 48,
    chartHeight: 36,
    aspectLocked: true,
    maxColors: 6,
    chart: null,
    paletteManuallyEdited: false,
  };
}

export function createYarnColor(
  name: string,
  displayColor: string,
): YarnColor {
  return {
    id: crypto.randomUUID(),
    name,
    displayColor,
    schemaVersion: YARN_INVENTORY_SCHEMA_VERSION,
  };
}

export function fullImageCrop(
  width: number,
  height: number,
): CropRect {
  return { x: 0, y: 0, width, height };
}

export function rotateClockwise(
  current: RotationDegrees,
): RotationDegrees {
  return ((current + 90) % 360) as RotationDegrees;
}
