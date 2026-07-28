# 01 — Replace CIEDE2000 nearest-color and string-keyed uniqueing in generation

**What was built:** `generateColorworkChart` (`src/chart/generate-chart.ts`)
no longer builds a `colorjs.io` `Color` object or runs real CIEDE2000 per
sample, and `medianCut`'s uniqueing step no longer builds a string key per
sample.

**Blocked by:** none

**Status:** resolved

- [x] `nearestPaletteIndex` converts sRGB → Oklab (own implementation, sRGB
      gamma decode via a 256-entry `Float64Array` lookup table so the hot
      loop never calls `Math.pow`) and compares with squared Euclidean
      distance instead of `colorjs.io`'s `deltaE(..., "2000")`. No `sqrt` —
      it can't change which candidate wins, so it's skipped.
- [x] Palette colors are converted to Oklab once per generation
      (`paletteLabFromRgb`), not once per sample.
- [x] `medianCut`'s `unique` step replaced `pixel.join(",")` string keys
      (`Map<string, Rgb>`) with a packed 24-bit int key
      (`(r<<16)|(g<<8)|b`) in a `Set<number>`.
- [x] `colorjs.io` import removed from `generate-chart.ts` entirely — it is
      **not** removed from the repo. `src/chart/palette-edits.ts` keeps
      real ΔE2000 for Color Match (`colorDistance`), where the number is
      shown to the Knitter as an accuracy claim, not used to bucket a
      sample among ≤12 candidates. Do not touch that file to "finish the
      job" — it's a different use case with a different accuracy bar.
- [x] Added `src/chart/generate-chart.test.ts` test: "assigns every stitch
      to the nearest palette color, not a neighbouring one" — asserts a
      two-color split image produces two internally-uniform, mutually
      distinct regions. The existing tests only checked counts/bounds, not
      which index a sample lands on, so nothing would have caught a broken
      distance metric.
- [x] `npm run typecheck` clean; full `npx vitest run` 117/117 pass.

## Measured (this machine, via `perf.html` harness — see `../spec.md`)

600×600 image → 300×300 chart, 12 colors, median of repeated runs:

| step | before | after |
|---|---|---|
| full `generateColorworkChart` | 11,144.8 ms | 130.9 ms (85×) |
| — nearest-color assignment alone | ~8,300 ms (projected from isolated bench) | ~18 ms (projected) |
| — `medianCut` unique-keying alone | 106.8 ms | not separately re-measured after the int-key change; full-function delta accounts for it |

Sanity numbers used to decide the packed-int-key change was worth doing: on
this fixture there are only 121 unique colors among 90,000 samples after
downsampling, so `medianCut`'s bucket-splitting itself (channel-range scans,
sorts) is ~0 ms — all the remaining cost after the Oklab swap was in
building the 90,000 string keys to find those 121, not in processing them.

## Notes for whoever touches this next

- If you need to re-tune the distance metric (e.g. weight lightness
  differently for a specific craft), do it in `srgbToOklab` /
  `nearestPaletteIndex`, and re-run the new test plus the perf harness — a
  metric change here is invisible to every existing test except the one
  added in this issue.
- The LUT (`LINEAR_CHANNEL`) is module-scope, built once at import time. If
  this function ever needs to run in a context where 256 doubles of setup
  cost matters (it doesn't here — it runs once per module load, not per
  chart), that's the thing to revisit.
