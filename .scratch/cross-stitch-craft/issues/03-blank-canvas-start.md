# 03 — Start a Pattern Project from a blank canvas

**What to build:** A Knitter or Stitcher can create a chart by choosing a grid size and a background color, with no photo involved.

**Blocked by:** 02

**Status:** resolved

- [x] A blank chart can be created at a chosen width and height within existing chart limits
- [x] The blank chart has a usable starting palette entry with a symbol and correct stitch count
- [x] The Studio shows chart and color key for a photo-less project instead of the "choose a photo" placeholder
- [x] Grid size controls are reachable without a source image
- [x] A blank-canvas project saves, reopens, and exports like a generated one
- [x] Choosing a photo later still works and goes through the existing regeneration confirmation

## Notes

- Projects already persist without `sourceImage`, so this is chart construction plus Studio gating, not schema work.
- Auto-generation is gated on `sourceImage`/`crop`/`naturalWidth`/`naturalHeight` in `src/ui/Studio.tsx`; a blank chart must not be overwritten by that effect.
- Chart size controls currently live inside the `draft.sourceImage` branch of `src/ui/ImageControls.tsx`.
- Limits to respect: `MAX_CHART_DIMENSION` and the color bounds in `src/chart/chart-types.ts`.

## Answer

Blank-canvas projects are complete and verified in the browser.

- `src/chart/blank-chart.ts` — `createBlankChart`, `resizeChart`, `DEFAULT_BLANK_CHART_COLOR` = `#ffffff`.
- `src/ui/ImageControls.tsx` — a photo-less project with a chart gets its own "Chart size" card with width and height only. Detail and Maximum colors stay hidden because they are photo-conversion settings. A photo-less project with **no** chart still shows nothing, so the fresh photo flow is unchanged.
- `src/ui/Studio.tsx` — `handleDimensionChange` routes photo-less changes through `resizeChart`, snapshots for undo, and persists chart and size fields together. An unchanged size returns early, so a no-op keystroke costs no undo entry.
- `src/App.tsx` — blank projects are created with `paletteManuallyEdited: true`, so adding a photo later asks before generating over hand-drawn work. The confirmation now says "chart edits" rather than "palette edits", which covers both cases.

Aspect lock is `false` on blank projects, since there is no image aspect to preserve.

**Bug found and fixed during verification.** Undo and redo restored `chart` but not `chartWidth` / `chartHeight`, so undoing a resize left the size fields describing a grid that no longer existed — and that wrong number persisted across a reload. Both handlers now carry the restored chart's dimensions via `chartDimensions`. This was the "numbers would lie" trap from the original handoff surfacing one step later than expected: the resize path was correct, history was not.

Covered by four Studio tests: photo-less render, resize with counts and single-step undo, save-and-reopen at the edited size, and the regeneration confirmation when a photo arrives.
