# 03 — Stop rewriting the source photo on every chart edit

**What to build:** Every project save re-serializes the full source photo
Blob (`toStored` in `src/repository/local-repository.ts` calls
`sourceImage.arrayBuffer()` unconditionally), and every save also triggers a
full `listPatternProjects()` scan (`App.handleProjectChange` →
`refreshProjects()` in `src/App.tsx`) even though the home project list
isn't mounted while `Studio` is open. A single brush stroke
(`Studio.handlePaintCells` → `applyPaletteChart` → `persist` →
`onProjectChange`) pays for both on every stroke.

**Blocked by:** none

**Status:** open

- [ ] Split source-image bytes into their own IndexedDB object store, keyed
      by project id, separate from the `projects` store
      (`src/repository/local-repository.ts`). Chart-only edits (paint,
      palette, resize) should then touch only the small project record, not
      the photo. This requires a `DATABASE_VERSION` bump and an `upgrade()`
      migration path — follow the existing pattern in
      `openLoomancerDb`/`fromStored`, which already tolerates missing
      fields from older schema versions.
      - The `sourceImageBytes` field, `toStored`, and `fromStored` are the
        three places that currently do the Blob↔ArrayBuffer conversion;
        all three need to change together.
      - `PatternProject.sourceImage` stays a `Blob` in memory
        (`src/domain/models.ts`) — this is a storage-layer change only, not
        a domain-model change.
- [ ] Store the `Blob` directly in the new store rather than converting to
      `ArrayBuffer` and back — IndexedDB supports Blobs natively; the
      current round-trip is pure copy overhead with no benefit.
- [ ] Stop calling `refreshProjects()` from `handleProjectChange`
      (`src/App.tsx`). The home list only needs to be current when it's
      about to render — refresh it in `onBack` (returning from `Studio` to
      the home list) instead of after every project save.
- [ ] Separately (same root cause, smaller): `Studio`'s detail/max-colors
      sliders (`handleDetailChange`, `onMaxColorsChange` in
      `src/ui/Studio.tsx`) call `persist` on every `input` event during a
      drag, with no debounce — unlike chart generation, which is already
      debounced 300ms (`GENERATE_DEBOUNCE_MS`). Consider debouncing the
      slider's `persist` call the same way, independent of the store-split
      above.
- [ ] Re-run `perf.html` after the store split. Target: `savePatternProject`
      for a chart-only edit should land near the already-measured
      "chart only, no photo" number (22.7 ms), and the post-stroke save
      path overall should drop from ~194 ms (save-with-photo + list-refresh)
      to something close to that 22.7 ms.
- [ ] `App.test.tsx` and `src/repository/local-repository.test.ts` exercise
      save/load round-trips including images — both need to keep passing,
      and probably need a new test asserting a chart-only edit doesn't
      touch/rewrite the image store.

## Measured baseline (this machine, via `perf.html` — see `../spec.md`)

6 seeded projects (each with a 4 MB photo), 300×300/12-color chart:

| step | ms |
|---|---|
| `savePatternProject` (chart + 4 MB photo) | 35.9 |
| `savePatternProject` (chart only, no photo field) | 22.7 |
| `listPatternProjects` (6 projects) | 157.9 |
| **one stroke today** (save-with-photo + list-refresh) | **193.8** |
| **one stroke, store split + no refresh** (= save-without-photo alone) | **22.7** (≈8×) |
