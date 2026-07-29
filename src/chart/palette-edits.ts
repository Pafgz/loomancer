import Color from "colorjs.io";
import { CHART_SYMBOLS } from "./chart-types";
import type { ColorworkChart, ChartPaletteEntry } from "../domain/models";
import type { YarnColor } from "../domain/models";

export const INDISTINGUISHABLE_DELTA_E = 6;

function parseHex(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((part) => part + part)
          .join("")
      : normalized;
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

export function colorDistance(hexA: string, hexB: string): number {
  const [ar, ag, ab] = parseHex(hexA);
  const [br, bg, bb] = parseHex(hexB);
  const a = new Color("srgb", [ar / 255, ag / 255, ab / 255]);
  const b = new Color("srgb", [br / 255, bg / 255, bb / 255]);
  return a.deltaE(b, "2000");
}

export function qualitativeDistance(deltaE: number): string {
  if (deltaE < 2) {
    return "Very close";
  }
  if (deltaE < 6) {
    return "Close";
  }
  if (deltaE < 12) {
    return "Noticeable difference";
  }
  return "Different";
}

export function recountPalette(chart: ColorworkChart): ColorworkChart {
  const stitchCounts = new Array(chart.palette.length).fill(0) as number[];
  for (const cell of chart.cells) {
    stitchCounts[cell] = (stitchCounts[cell] ?? 0) + 1;
  }
  return {
    ...chart,
    palette: chart.palette.map((entry, index) => ({
      ...entry,
      index,
      stitchCount: stitchCounts[index] ?? 0,
      symbol: entry.symbol || CHART_SYMBOLS[index] || String(index + 1),
    })),
  };
}

export function replaceChartColor(
  chart: ColorworkChart,
  paletteIndex: number,
  hex: string,
  yarnLabel?: string,
): ColorworkChart {
  return recountPalette({
    ...chart,
    palette: chart.palette.map((entry) =>
      entry.index === paletteIndex
        ? {
            ...entry,
            hex,
            yarnLabel,
          }
        : entry,
    ),
  });
}

/** Hex-only overlay for live chart preview — does not touch labels or counts. */
export function previewChartColor(
  chart: ColorworkChart,
  paletteIndex: number,
  hex: string,
): ColorworkChart {
  return {
    ...chart,
    palette: chart.palette.map((entry) =>
      entry.index === paletteIndex ? { ...entry, hex } : entry,
    ),
  };
}

export function mergeChartColors(
  chart: ColorworkChart,
  sourceIndex: number,
  targetIndex: number,
): ColorworkChart {
  if (sourceIndex === targetIndex) {
    return chart;
  }

  const cells = chart.cells.map((cell) =>
    cell === sourceIndex ? targetIndex : cell,
  );
  const remaining = chart.palette.filter((entry) => entry.index !== sourceIndex);
  const indexMap = new Map<number, number>();
  remaining.forEach((entry, nextIndex) => {
    indexMap.set(entry.index, nextIndex);
  });

  const remappedCells = cells.map((cell) => indexMap.get(cell) ?? 0);
  const palette: ChartPaletteEntry[] = remaining.map((entry, index) => ({
    ...entry,
    index,
    symbol: CHART_SYMBOLS[index] || String(index + 1),
  }));

  return recountPalette({
    width: chart.width,
    height: chart.height,
    cells: remappedCells,
    palette,
  });
}

export function addChartColor(
  chart: ColorworkChart,
  hex: string,
  yarnLabel?: string,
): ColorworkChart {
  const index = chart.palette.length;
  return recountPalette({
    ...chart,
    palette: [
      ...chart.palette,
      {
        index,
        hex,
        symbol: CHART_SYMBOLS[index] || String(index + 1),
        stitchCount: 0,
        yarnLabel,
      },
    ],
  });
}

export type ChartCellPosition = {
  x: number;
  y: number;
};

/**
 * Set every listed cell to one palette color. A whole drag is applied in a
 * single call so the stroke costs one recount and one undo entry rather than
 * one per cell. Positions outside the grid are ignored.
 */
export function paintChartCells(
  chart: ColorworkChart,
  positions: readonly ChartCellPosition[],
  paletteIndex: number,
): ColorworkChart {
  if (paletteIndex < 0 || paletteIndex >= chart.palette.length) {
    return chart;
  }

  let cells: number[] | null = null;
  for (const { x, y } of positions) {
    if (
      !Number.isInteger(x) ||
      !Number.isInteger(y) ||
      x < 0 ||
      y < 0 ||
      x >= chart.width ||
      y >= chart.height
    ) {
      continue;
    }
    const offset = y * chart.width + x;
    if (chart.cells[offset] === paletteIndex) {
      continue;
    }
    cells ??= [...chart.cells];
    cells[offset] = paletteIndex;
  }

  // Nothing actually changed, so hand back the same chart and let the caller
  // skip a no-op undo entry.
  if (!cells) {
    return chart;
  }

  return recountPalette({ ...chart, cells });
}

export function paintChartCell(
  chart: ColorworkChart,
  x: number,
  y: number,
  paletteIndex: number,
): ColorworkChart {
  return paintChartCells(chart, [{ x, y }], paletteIndex);
}

export type YarnMatchSuggestion = {
  yarn: YarnColor;
  deltaE: number;
  quality: string;
};

export function rankYarnMatches(
  chartHex: string,
  inventory: YarnColor[],
): YarnMatchSuggestion[] {
  return inventory
    .map((yarn) => {
      const deltaE = colorDistance(chartHex, yarn.displayColor);
      return {
        yarn,
        deltaE,
        quality: qualitativeDistance(deltaE),
      };
    })
    .sort((a, b) => a.deltaE - b.deltaE);
}

export type SimilarPair = {
  leftIndex: number;
  rightIndex: number;
  deltaE: number;
};

export function findIndistinguishablePairs(
  chart: ColorworkChart,
  threshold = INDISTINGUISHABLE_DELTA_E,
): SimilarPair[] {
  const pairs: SimilarPair[] = [];
  for (let i = 0; i < chart.palette.length; i += 1) {
    for (let j = i + 1; j < chart.palette.length; j += 1) {
      const left = chart.palette[i];
      const right = chart.palette[j];
      if (!left || !right) {
        continue;
      }
      const deltaE = colorDistance(left.hex, right.hex);
      if (deltaE < threshold) {
        pairs.push({ leftIndex: i, rightIndex: j, deltaE });
      }
    }
  }
  return pairs.sort((a, b) => a.deltaE - b.deltaE);
}
