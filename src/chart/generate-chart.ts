import {
  CHART_SYMBOLS,
  clampMaxColors,
  rgbToHex,
  type ColorworkChart,
  type GenerateChartInput,
  type RgbaImage,
} from "./chart-types";

type Rgb = [number, number, number];
type Oklab = [number, number, number];

function samplePixel(image: RgbaImage, x: number, y: number): Rgb {
  const offset = (y * image.width + x) * 4;
  return [
    image.data[offset] ?? 0,
    image.data[offset + 1] ?? 0,
    image.data[offset + 2] ?? 0,
  ];
}

export function downsampleToGrid(
  image: RgbaImage,
  width: number,
  height: number,
): Rgb[] {
  // Already at stitch resolution (e.g. after targeted rasterize) — sample 1:1.
  if (image.width === width && image.height === height) {
    const samples: Rgb[] = new Array(width * height);
    for (let i = 0; i < samples.length; i += 1) {
      const offset = i * 4;
      samples[i] = [
        image.data[offset] ?? 0,
        image.data[offset + 1] ?? 0,
        image.data[offset + 2] ?? 0,
      ];
    }
    return samples;
  }

  const samples: Rgb[] = [];
  for (let y = 0; y < height; y += 1) {
    const y0 = Math.floor((y * image.height) / height);
    const y1 = Math.floor(((y + 1) * image.height) / height);
    for (let x = 0; x < width; x += 1) {
      const x0 = Math.floor((x * image.width) / width);
      const x1 = Math.floor(((x + 1) * image.width) / width);
      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;
      for (let sy = y0; sy < Math.max(y1, y0 + 1); sy += 1) {
        for (let sx = x0; sx < Math.max(x1, x0 + 1); sx += 1) {
          const pixel = samplePixel(
            image,
            Math.min(image.width - 1, sx),
            Math.min(image.height - 1, sy),
          );
          r += pixel[0];
          g += pixel[1];
          b += pixel[2];
          count += 1;
        }
      }
      samples.push([
        Math.round(r / count),
        Math.round(g / count),
        Math.round(b / count),
      ]);
    }
  }
  return samples;
}

function channelRange(pixels: Rgb[], channel: 0 | 1 | 2): number {
  let min = 255;
  let max = 0;
  for (const pixel of pixels) {
    min = Math.min(min, pixel[channel]);
    max = Math.max(max, pixel[channel]);
  }
  return max - min;
}

function averageColor(pixels: Rgb[]): Rgb {
  if (pixels.length === 0) {
    return [0, 0, 0];
  }
  let r = 0;
  let g = 0;
  let b = 0;
  for (const pixel of pixels) {
    r += pixel[0];
    g += pixel[1];
    b += pixel[2];
  }
  return [
    Math.round(r / pixels.length),
    Math.round(g / pixels.length),
    Math.round(b / pixels.length),
  ];
}

function medianCut(pixels: Rgb[], maxColors: number): Rgb[] {
  if (pixels.length === 0) {
    return [[0, 0, 0]];
  }

  // Pack the triple into one int for the key: 90k string allocations here cost
  // more than the rest of the split put together.
  const unique: Rgb[] = [];
  const seen = new Set<number>();
  for (const pixel of pixels) {
    const key = (pixel[0] << 16) | (pixel[1] << 8) | pixel[2];
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(pixel);
    }
  }
  if (unique.length <= maxColors) {
    return unique;
  }

  const buckets: Rgb[][] = [unique];
  while (buckets.length < maxColors) {
    let splitIndex = 0;
    let bestRange = -1;
    for (let i = 0; i < buckets.length; i += 1) {
      const bucket = buckets[i] ?? [];
      if (bucket.length < 2) {
        continue;
      }
      const range = Math.max(
        channelRange(bucket, 0),
        channelRange(bucket, 1),
        channelRange(bucket, 2),
      );
      if (range > bestRange) {
        bestRange = range;
        splitIndex = i;
      }
    }

    const bucket = buckets[splitIndex] ?? [];
    if (bucket.length < 2 || bestRange <= 0) {
      break;
    }

    const ranges: Array<[0 | 1 | 2, number]> = [
      [0, channelRange(bucket, 0)],
      [1, channelRange(bucket, 1)],
      [2, channelRange(bucket, 2)],
    ];
    ranges.sort((a, b) => b[1] - a[1]);
    const channel = ranges[0]?.[0] ?? 0;
    const sorted = [...bucket].sort((a, b) => a[channel] - b[channel]);
    const mid = Math.floor(sorted.length / 2);
    buckets.splice(splitIndex, 1, sorted.slice(0, mid), sorted.slice(mid));
  }

  return buckets.map((bucket) => averageColor(bucket));
}

/** sRGB gamma decode for all 256 channel values, so the hot loop never calls `pow`. */
const LINEAR_CHANNEL = new Float64Array(256);
for (let value = 0; value < 256; value += 1) {
  const v = value / 255;
  LINEAR_CHANNEL[value] = v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/**
 * sRGB (0–255) to Oklab. Oklab is near-uniform perceptually, so plain squared
 * distance in it ranks candidates much like CIEDE2000 would — at a fraction of
 * the cost. Use it for bucketing a sample among a handful of palette colors, not
 * for reporting a difference to the Knitter: `colorDistance` in `palette-edits`
 * keeps true ΔE2000 for Color Match, where the number is the product promise.
 */
function srgbToOklab(r: number, g: number, b: number): Oklab {
  const lr = LINEAR_CHANNEL[r] ?? 0;
  const lg = LINEAR_CHANNEL[g] ?? 0;
  const lb = LINEAR_CHANNEL[b] ?? 0;

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/**
 * Index of the perceptually closest palette entry. Squared distance, because the
 * square root would not change which candidate wins.
 */
function nearestPaletteIndex(sample: Rgb, paletteLab: Oklab[]): number {
  const [sl, sa, sb] = srgbToOklab(sample[0], sample[1], sample[2]);
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < paletteLab.length; i += 1) {
    const candidate = paletteLab[i];
    if (!candidate) {
      continue;
    }
    const dl = sl - candidate[0];
    const da = sa - candidate[1];
    const db = sb - candidate[2];
    const distance = dl * dl + da * da + db * db;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }
  return bestIndex;
}

function paletteLabFromRgb(palette: Rgb[]): Oklab[] {
  return palette.map((rgb) => srgbToOklab(rgb[0], rgb[1], rgb[2]));
}

export function generateColorworkChart(
  input: GenerateChartInput,
): ColorworkChart {
  const width = Math.max(1, Math.round(input.width));
  const height = Math.max(1, Math.round(input.height));
  const maxColors = clampMaxColors(input.maxColors);
  const samples = downsampleToGrid(input.image, width, height);
  const paletteRgb = medianCut(samples, maxColors);
  const paletteLab = paletteLabFromRgb(paletteRgb);
  const cells = samples.map((sample) => nearestPaletteIndex(sample, paletteLab));
  const stitchCounts = new Array(paletteRgb.length).fill(0) as number[];
  for (const cell of cells) {
    stitchCounts[cell] = (stitchCounts[cell] ?? 0) + 1;
  }

  return {
    width,
    height,
    cells,
    palette: paletteRgb.map((rgb, index) => ({
      index,
      hex: rgbToHex(rgb[0], rgb[1], rgb[2]),
      symbol: CHART_SYMBOLS[index] ?? String(index + 1),
      stitchCount: stitchCounts[index] ?? 0,
    })),
  };
}
