# Chart performance — investigation and fixes

**Type:** task
**Status:** in progress

## Why

A structural review of the chart pipeline (rendering, generation, persistence)
raised performance as a follow-up. Before touching anything, a dev-only perf
harness was built to get real numbers instead of guessing from code shape —
the first guess (persistence dominates) turned out to be wrong once measured.

## How to reproduce the measurements

- `perf.html` (repo root) + `src/dev/perf-harness.ts` — dev-only, not imported
  by the app. Served at `/perf.html` by `npm run dev`. One "Run" button, one
  `<pre>` output. Uses a throwaway IndexedDB database `loomancer-perf`
  (never `loomancer`, the real app DB) and deletes it when done.
- Fixture: 300×300 chart (`MAX_CHART_DIMENSION`), 12 colors (`MAX_CHART_COLORS`)
  — the worst case the UI allows.
- Delete both files once the remaining issues below are closed; they're
  scaffolding, not product code.

## Findings, in the order they turned out to matter (not the order guessed)

| # | area | measured (median, this machine) | status |
|---|---|---|---|
| 1 | `generateColorworkChart` (600×600 → 300×300) | 11,144.8 ms → **130.9 ms** (85×) | **fixed**, see issue 01 |
| 2 | screen redraw, symbols on, DPR 2 | 1,039.0 ms | open, issue 02 |
| 3 | one brush stroke (save + list refresh) | 193.8 ms (→ 22.7 ms if fixed) | open, issue 03 |
| 4 | undo stack, 30 snapshots | 26.7 ms push, ~64 MB retained | open, issue 04 |
| 5 | canvas backing store at 300×300, DPR 2 | ~397 MB, survives on desktop Chrome/Electron | open, issue 05 — **unverified on iOS**, see caveat |

Machine: desktop Electron/Chrome (`Claude/1.24012.9 Chrome/148.0.7778.280
Electron/42.7.0`), not a phone. Everything here is a lower bound for the
actual mobile/PWA target in `PRODUCT.md`.

### 1. Generation was the real bottleneck, not persistence

Original structural review (before measuring) guessed persistence — the
per-stroke IndexedDB write — was the top cost, because it visibly rewrites
the whole photo Blob on every save. Measured: 194 ms. Generation was
**11.1 seconds**. That guess was corrected in the same conversation once the
harness ran; don't re-derive it, the numbers above are the record.

Root cause, confirmed by isolating each sub-step in the browser console
(not by reading the code and assuming):

- `nearestPaletteIndex` (`src/chart/generate-chart.ts`) built a fresh
  `colorjs.io` `Color` object per sample and ran real CIEDE2000
  (`deltaE(..., "2000")`) against every one of ≤12 palette colors. 90,000
  samples × up to 12 colors × per-call Lab conversion.
- `medianCut`'s uniqueing step (`pixels.map(p => [p.join(","), p])`) built a
  string key for every one of 90,000 samples. Once the CIEDE2000 cost was
  gone this became the next largest cost (~107 ms on its own).

Both fixed — see issue 01. `colorjs.io` is **not** removed from the repo:
`src/chart/palette-edits.ts` still uses real ΔE2000 for Color Match, where
the number shown to the Knitter is the product's accuracy promise, not a
"which of 12 buckets" bucketing decision. Do not swap that one to Oklab
without checking with the user first — it changes a user-facing claim, not
just an internal fast path.

### 2. Screen redraw pays for symbols no one can see

`drawColorworkChart` (`src/ui/draw-colorwork-chart.ts`) draws a `fillText`
per cell whenever `showSymbols` is true, gated only on the *natural* cell
size (`cellPx >= 8`, always 16 — see `CHART_CELL_PX` in
`src/ui/chart-viewport-math.ts`), never on the *on-screen* size
(`cellPx * scale`). A 300-wide chart at fit-to-viewport sits around
scale ≈0.25, so ~90,000 glyphs are rendered at ~4px — illegible — every time
the chart changes. Measured: symbols ON 1,039.0 ms vs OFF 164.0/249.5 ms
(DPR 2 / DPR 1). This redraw runs inside `useLayoutEffect`
(`src/ui/ChartViewport.tsx`), so it blocks paint.

Not yet fixed. See issue 02 — the fix is gating the symbol draw on
`cellPx * scale >= 8`, computed from the live transform already available in
`ChartViewport`.

### 3. Persistence: real cost, much smaller than it looked

- `savePatternProject` with a 4 MB photo Blob: 35.9 ms. Without the photo:
  22.7 ms. `toStored` (`src/repository/local-repository.ts`) does
  `await sourceImage.arrayBuffer()` on every save — a full Blob→ArrayBuffer
  copy of a Blob that hasn't changed since the last stroke.
- `listPatternProjects` over 6 seeded projects: 157.9 ms — the expensive
  part. `App.handleProjectChange` (`src/App.tsx`) calls
  `refreshProjects()` (→ `listPatternProjects`) after every single project
  save, including every brush stroke, even though the home list isn't
  mounted while `Studio` is open.
- Combined: ~194 ms per stroke today: `savePatternProject` (with photo) +
  `refreshProjects`. Splitting image bytes into their own IndexedDB object
  store and dropping the post-stroke refresh gets this to ~23 ms (measured
  directly: `savePatternProject` without the photo field).

Not yet fixed. See issue 03.

### 4. Undo stack

`Studio.pushChartSnapshot` (`src/ui/Studio.tsx`) keeps up to 30 full chart
snapshots (`{...chart, cells: [...chart.cells], palette: chart.palette.map(...)}`)
in `undoStack` state. Push cost is small (26.7 ms for all 30 in the harness),
but retained heap is ~64 MB for a 300×300/12-color chart. `chart.cells` is
also a plain `number[]`, not a `Uint8Array`, despite every value fitting in
one byte (max palette index 11) — this inflates both the per-snapshot size
and every other place a chart gets spread/cloned
(`duplicatePatternProject`, IndexedDB write, worker structured-clone).

Not yet fixed. See issue 04.

### 5. Canvas backing store size, and an unverified mobile risk

At 300×300 stitches, `CHART_CELL_PX = 16` (`src/ui/chart-viewport-math.ts`),
DPR 2: the canvas backing store is 10,198×10,198 ≈ 104 Mpx, ~397 MB of pixel
memory. It rendered correctly on this desktop machine — verified by drawing
a probe pixel and reading it back with `getImageData`, not assumed. **This
has not been tested on an actual iOS/mobile browser**, which is the
project's stated primary target (`PRODUCT.md`: "desktop, tablet, or phone
... installable as a PWA"). iOS Safari has a known canvas-area ceiling
(historically ~16 million pixels on older versions; current limits are
larger but undocumented precisely) past which a canvas silently renders
blank instead of erroring. If this ceiling is below ~104 Mpx on the target
devices, the largest charts would render blank with no error — worth
confirming on a real device before treating this as low-priority.

Not yet fixed. See issue 05.

## What changed in this pass

- Added: `perf.html`, `src/dev/perf-harness.ts` (dev-only tooling, delete
  once the open issues below are closed).
- Added: `.claude/launch.json` (`yarnlane-dev`, `npm run dev` on 5173) so the
  harness can be driven from a browser tool without asking the user to start
  a server by hand.
- Changed: `src/chart/generate-chart.ts` — see issue 01 for the full diff
  description.
- Added test: `src/chart/generate-chart.test.ts` — "assigns every stitch to
  the nearest palette color, not a neighbouring one". The existing tests
  were all behavioural (counts, bounds) with no assertion on *which* palette
  index a sample lands on, so nothing would have caught a broken distance
  function. Added because the Oklab swap changes the actual metric used.
- Verified: `npm run typecheck` clean; full `npx vitest run` — 18 files,
  117 tests, all pass. One transient failure seen on a single run in
  `App.test.tsx` (`userEvent` + `createLocalRepository`), not reproduced on
  two subsequent full runs, not touched by this change (that test doesn't
  import anything from `chart/`) — flagged as a pre-existing flake, not
  fixed here.

## For the next agent

- Read this file, then read the specific issue you're picking up — each one
  is self-contained with the file(s) to touch and the number to beat.
- Re-run the harness before and after any change here. Don't trust a
  structural read of the code over a measurement — that's exactly the
  mistake this effort corrected once already (see "Generation was the real
  bottleneck, not persistence" above).
- `git status` before starting: as of this doc, nothing in this effort is
  committed. `perf.html`, `src/dev/perf-harness.ts`, `.claude/launch.json`,
  and the `generate-chart.ts`/`generate-chart.test.ts` changes are all
  present but uncommitted.
