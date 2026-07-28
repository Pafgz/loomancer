# 04 — Undo stack: patches instead of full chart snapshots, `Uint8Array` cells

**What to build:** `Studio.pushChartSnapshot`/`handleUndo`/`handleRedo`
(`src/ui/Studio.tsx`) keep up to 30 full `ColorworkChart` snapshots — each a
spread of `cells` (a plain `number[]`, up to 90,000 entries) and `palette`.
A single stroke usually touches a few hundred cells at most
(`ChartViewport`'s stroke path, `chart-viewport-math.ts` `chartCellLine`),
so a full snapshot is far more than the edit that produced it.

**Blocked by:** none, but touches the same `ColorworkChart.cells` type as
issue 03's storage layer — coordinate if both are in flight, since changing
`cells` from `number[]` to `Uint8Array` affects IndexedDB serialization too
(IndexedDB stores typed arrays fine, so this shouldn't conflict, but the
`toStored`/`fromStored` round-trip in `local-repository.ts` should be
checked either way).

**Status:** open

- [ ] Change `ColorworkChart.cells` (`src/domain/models.ts`, and the
      duplicate declaration in `src/chart/chart-types.ts` — see the earlier
      structural note about that duplication, out of scope for this issue
      but relevant context) from `number[]` to `Uint8Array`. Every value is
      a palette index, capped at `MAX_CHART_COLORS = 12` — one byte is
      always enough. This affects every place that constructs or spreads a
      chart: `generate-chart.ts`, `blank-chart.ts`, `palette-edits.ts`,
      `chart.worker.ts` (structured-clone across the worker boundary is
      cheaper for typed arrays), and the export renderers.
- [ ] Replace full-chart undo/redo entries with inverse patches:
      `{ index: number; previousValue: number }[]` per stroke, captured
      before applying the paint (`paintChartCells` in
      `src/chart/palette-edits.ts` already knows exactly which cells
      changed — it currently discards that information by returning a
      whole new chart). Undo applies the patch in reverse; redo re-applies
      it forward.
      - Palette-size changes (add color, merge/replace, regenerate) are not
        a per-cell patch — those still need a coarser undo entry (or their
        own limited history). Don't force every history entry into the
        cell-patch shape if it doesn't fit; a small tagged union
        (`{ type: "cells"; patch: ... } | { type: "chart"; chart: ... }`)
        is likely the right shape.
- [ ] Re-run `perf.html`'s undo-stack bench after the change. Baseline
      below; target is retained heap in the KB range for 30 stroke-sized
      patches instead of ~64 MB for 30 full snapshots.
- [ ] `src/chart/palette-edits.test.ts` and `src/ui/Studio.test.tsx` cover
      undo/redo behavior today — check both still pass, and add a test that
      undo after a large-chart stroke doesn't retain a second full copy of
      `cells`.

## Measured baseline (this machine, via `perf.html` — see `../spec.md`)

300×300/12-color chart, 30 snapshots pushed:

| | value |
|---|---|
| push 30 full snapshots | 26.7 ms (cheap — not the problem) |
| heap holding 30 snapshots | ~64 MB (10.5 MB → 75.0 MB) |

The push itself isn't slow; the problem is what it retains. This is a memory
issue on long editing sessions, not a latency issue on any single action.
