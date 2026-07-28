# 02 — Gate symbol drawing on on-screen cell size, not natural cell size

**What to build:** `drawChartCell` / `drawColorworkChart`
(`src/ui/draw-colorwork-chart.ts`) currently gate the per-cell `fillText`
call on `cellPx >= 8`, but `cellPx` passed in from `ChartViewport.tsx` is
always the *natural* size (`CHART_CELL_PX = 16`, from
`src/ui/chart-viewport-math.ts`), never the *on-screen* size after the pan/
zoom transform (`cellPx * scale`). At fit-to-viewport zoom on a 300×300
chart, scale ≈ 0.25, so ~90,000 illegible ~4px glyphs get drawn on every
redraw for no visible benefit.

**Blocked by:** none

**Status:** open

- [ ] `ChartViewport.redrawChart` and the `useLayoutEffect` redraw
      (`src/ui/ChartViewport.tsx`) pass the *effective* cell size
      (`CHART_CELL_PX * scaleRef.current`, or equivalent) into
      `drawColorworkChart`'s `showSymbols` decision — not necessarily into
      `cellPx` itself, since `cellPx` also drives geometry (cell rects,
      pitch) which must stay in natural units for the CSS-transform-based
      pan/zoom to keep working. The cleanest seam is probably a separate
      `effectiveCellPx` (or a boolean the caller computes) threaded through
      to the `showSymbols >= 8` check in `drawChartCell`, rather than
      overloading `cellPx`.
- [ ] `previewCells` (same file, used for live stroke preview) needs the
      same gate — it calls `configureChartCellText`/`drawChartCell`
      directly and currently always draws symbols when `showSymbols` is on,
      regardless of zoom.
- [ ] Re-run `perf.html` after the change. Target: symbols-on redraw time
      at default fit zoom should land near the symbols-off number already
      measured (164.0 ms DPR 2 / 249.5 ms DPR 1 for a 300×300/12-color
      chart), not the 1,039.0 ms currently measured with symbols "on" at
      natural size.
- [ ] Manually verify in the browser that symbols still appear once zoomed
      in past the threshold — this is a UX-visible change, not just a perf
      one. `ChartViewport`'s zoom controls (`+`/`-`/wheel/pinch) are the way
      to test it.
- [ ] Check the PNG/PDF exporters (`src/export/chart-export.ts`,
      `src/export/chart-pdf.ts`) are unaffected — they run at a fixed,
      always-legible cell size (`DEFAULT_CELL_PX`, `PDF_CELL_PT`) and have
      no pan/zoom concept, so this issue should not touch them at all. If a
      change here accidentally shares code with those paths, stop and
      re-check scope.

## Measured baseline (this machine, via `perf.html` — see `../spec.md`)

300×300 chart, 12 colors:

| | DPR 2 | DPR 1 |
|---|---|---|
| symbols ON (current, natural-size gate) | 1,039.0 ms | 983.7 ms |
| symbols OFF | 164.0 ms | 249.5 ms |

DPR barely matters — the cost is `fillText` call count, not pixel count.
