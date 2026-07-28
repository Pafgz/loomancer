/**
 * Dev-only perf harness. Not imported by the app; served at /perf.html in dev.
 * Measures the three hot paths on a worst-case 300 x 300 chart: persistence,
 * chart generation, and screen redraw. Delete this file and /perf.html when the
 * numbers have served their purpose.
 */
import { generateColorworkChart } from "../chart/generate-chart";
import type { RgbaImage } from "../chart/chart-types";
import { CHART_SYMBOLS, MAX_CHART_DIMENSION } from "../chart/chart-types";
import { createEmptyPatternProject, type ColorworkChart, type PatternProject } from "../domain/models";
import { createLocalRepository } from "../repository/local-repository";
import { drawColorworkChart } from "../ui/draw-colorwork-chart";
import { CHART_CELL_PX, CHART_GAP_PX, chartContentSize } from "../ui/chart-viewport-math";

/** Throwaway DB. Never the app's "loomancer" database. */
const PERF_DB = "loomancer-perf";

/** Worst case the UI allows. */
const SIDE = MAX_CHART_DIMENSION;
const COLORS = 12;
/** Typical phone photo. */
const PHOTO_BYTES = 4 * 1024 * 1024;
/** Projects already in the DB, so listPatternProjects() has real work. */
const SEEDED_PROJECTS = 5;

const out = document.getElementById("out") as HTMLPreElement;
const scratch = document.getElementById("scratch") as HTMLCanvasElement;
const lines: string[] = [];

function log(line: string) {
  lines.push(line);
  out.textContent = lines.join("\n");
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/** Median wall-clock ms over `runs`, after one warmup. */
async function timed(
  label: string,
  runs: number,
  fn: () => void | Promise<void>,
): Promise<number> {
  await fn();
  const samples: number[] = [];
  for (let i = 0; i < runs; i += 1) {
    const start = performance.now();
    await fn();
    samples.push(performance.now() - start);
  }
  const ms = median(samples);
  const spread = `${Math.min(...samples).toFixed(1)}–${Math.max(...samples).toFixed(1)}`;
  log(`  ${label.padEnd(46)} ${ms.toFixed(1).padStart(8)} ms   (n=${runs}, ${spread})`);
  return ms;
}

function makeChart(side: number, colors: number): ColorworkChart {
  const cells = new Array<number>(side * side);
  for (let i = 0; i < cells.length; i += 1) {
    // Deterministic spread so every palette entry is used and drawn.
    cells[i] = (i * 7 + Math.floor(i / side) * 3) % colors;
  }
  const counts = new Array<number>(colors).fill(0);
  for (const cell of cells) counts[cell] = (counts[cell] ?? 0) + 1;
  return {
    width: side,
    height: side,
    cells,
    palette: Array.from({ length: colors }, (_, index) => ({
      index,
      hex: `#${(((index * 1234567) % 0xffffff) | 0).toString(16).padStart(6, "0")}`,
      symbol: CHART_SYMBOLS[index] ?? String(index + 1),
      stitchCount: counts[index] ?? 0,
    })),
  };
}

function makePhoto(bytes: number): Blob {
  const buffer = new Uint8Array(bytes);
  for (let i = 0; i < bytes; i += 997) buffer[i] = i & 0xff;
  return new Blob([buffer], { type: "image/jpeg" });
}

function makeRgba(width: number, height: number): RgbaImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    const offset = i * 4;
    data[offset] = (i * 13) & 0xff;
    data[offset + 1] = (i * 7) & 0xff;
    data[offset + 2] = (i * 29) & 0xff;
    data[offset + 3] = 255;
  }
  return { width, height, data };
}

function heapMb(): string {
  const memory = (performance as unknown as {
    memory?: { usedJSHeapSize: number };
  }).memory;
  return memory ? `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(1)} MB` : "n/a";
}

async function deletePerfDb(): Promise<void> {
  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(PERF_DB);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
}

async function run() {
  lines.length = 0;
  log(`chart ${SIDE}x${SIDE} = ${SIDE * SIDE} cells, ${COLORS} colors`);
  log(`photo ${(PHOTO_BYTES / 1024 / 1024).toFixed(1)} MB, ${SEEDED_PROJECTS} projects seeded in DB`);
  log(`heap at start: ${heapMb()}`);
  log(`ua: ${navigator.userAgent}`);

  const chart = makeChart(SIDE, COLORS);
  const photo = makePhoto(PHOTO_BYTES);

  // ---- 1. persistence -----------------------------------------------------
  log("\n[1] persistence — what one brush stroke costs");
  await deletePerfDb();
  const repository = await createLocalRepository(PERF_DB);

  const withPhoto: PatternProject = {
    ...createEmptyPatternProject("perf"),
    chartWidth: SIDE,
    chartHeight: SIDE,
    chart,
    sourceImage: photo,
    sourceFileName: "perf.jpg",
    sourceMimeType: "image/jpeg",
    naturalWidth: 3000,
    naturalHeight: 3000,
    crop: { x: 0, y: 0, width: 3000, height: 3000 },
  };
  const { sourceImage: _drop, ...withoutPhotoRest } = withPhoto;
  const withoutPhoto: PatternProject = withoutPhotoRest;

  for (let i = 0; i < SEEDED_PROJECTS; i += 1) {
    await repository.savePatternProject({
      ...withPhoto,
      id: `seed-${i}`,
      name: `seed ${i}`,
    });
  }

  const saveWith = await timed("savePatternProject (chart + 4MB photo)", 7, () =>
    repository.savePatternProject(withPhoto),
  );
  const saveWithout = await timed("savePatternProject (chart only, no photo)", 7, () =>
    repository.savePatternProject(withoutPhoto),
  );
  const list = await timed(`listPatternProjects (${SEEDED_PROJECTS + 1} projects)`, 7, async () => {
    await repository.listPatternProjects();
  });
  log(`  ${"=> one stroke today (save + refresh)".padEnd(46)} ${(saveWith + list).toFixed(1).padStart(8)} ms`);
  log(`  ${"=> one stroke if image split out + no refresh".padEnd(46)} ${saveWithout.toFixed(1).padStart(8)} ms`);

  // ---- 2. generation ------------------------------------------------------
  log("\n[2] generation — worker, so latency not jank");
  // Real path: rasterize targets stitch grid x2 oversample, so 600x600 -> 300x300.
  const oversampled = makeRgba(SIDE * 2, SIDE * 2);
  await timed("generateColorworkChart (600x600 -> 300x300)", 3, () => {
    generateColorworkChart({ image: oversampled, width: SIDE, height: SIDE, maxColors: COLORS });
  });
  const exact = makeRgba(SIDE, SIDE);
  await timed("generateColorworkChart (300x300 1:1 fast path)", 3, () => {
    generateColorworkChart({ image: exact, width: SIDE, height: SIDE, maxColors: COLORS });
  });
  await timed("structuredClone(chart) — worker result crossing", 5, () => {
    structuredClone(chart);
  });

  // ---- 3. screen redraw ---------------------------------------------------
  log("\n[3] screen redraw — blocks paint (useLayoutEffect)");
  const content = chartContentSize(SIDE, SIDE, CHART_CELL_PX, CHART_GAP_PX);
  log(`  content ${content.width}x${content.height} css px`);

  for (const dpr of [2, 1]) {
    const w = Math.round(content.width * dpr);
    const h = Math.round(content.height * dpr);
    scratch.width = w;
    scratch.height = h;
    const context = scratch.getContext("2d");
    if (!context) {
      log(`  dpr ${dpr}: no 2d context at ${w}x${h}`);
      continue;
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    // A canvas past the browser's area cap silently yields blank pixels.
    context.fillStyle = "#ff0000";
    context.fillRect(0, 0, 2, 2);
    const probe = context.getImageData(0, 0, 1, 1).data;
    const alive = probe[0] === 255 && probe[3] === 255;
    log(`  dpr ${dpr}: backing store ${w}x${h} = ${((w * h) / 1e6).toFixed(1)} Mpx, ~${((w * h * 4) / 1024 / 1024).toFixed(0)} MB — ${alive ? "OK" : "BLANK (past area cap)"}`);
    if (!alive) continue;
    await timed(`drawColorworkChart dpr ${dpr}, symbols ON`, 5, () => {
      drawColorworkChart(context, chart, { showSymbols: true });
    });
    await timed(`drawColorworkChart dpr ${dpr}, symbols OFF`, 5, () => {
      drawColorworkChart(context, chart, { showSymbols: false });
    });
  }

  // ---- 4. undo stack ------------------------------------------------------
  log("\n[4] undo stack — 30 full chart snapshots");
  const stack: ColorworkChart[] = [];
  await timed("push 30 snapshots (spread cells + palette)", 3, () => {
    stack.length = 0;
    for (let i = 0; i < 30; i += 1) {
      stack.push({ ...chart, cells: [...chart.cells], palette: chart.palette.map((e) => ({ ...e })) });
    }
  });
  log(`  heap holding 30 snapshots: ${heapMb()}`);

  await deletePerfDb();
  log("\ndone. perf DB deleted.");
}

document.getElementById("run")?.addEventListener("click", () => {
  out.textContent = "running…";
  lines.length = 0;
  void run().catch((error) => {
    log(`\nFAILED: ${error instanceof Error ? error.stack : String(error)}`);
  });
});
