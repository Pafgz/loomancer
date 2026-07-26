# 02 — Add craft type to a Pattern Project

**What to build:** A Pattern Project records whether it is Knitting or Cross-stitch, chosen when the project is created and preserved across save, reopen, and duplicate.

**Blocked by:** 01

**Status:** done

- [x] `craftType: "knitting" | "cross-stitch"` on `PatternProject`, defaulting to `"knitting"`
- [x] `PATTERN_PROJECT_SCHEMA_VERSION` bumped; `fromStored` defaults the field for existing records
- [x] Project creation lets the Knitter or Stitcher pick the craft
- [x] Duplicating a project carries the craft over
- [x] Existing projects with no craft field reopen as Knitting with no visible change

## Notes

- Model: `src/domain/models.ts` (`PatternProject`, `createEmptyPatternProject`, `duplicatePatternProject`)
- Persistence defaults: `src/repository/local-repository.ts` (`fromStored`)
- Creation entry point: `handleCreateProject` in `src/App.tsx`
- IndexedDB `DATABASE_VERSION` only needs a bump if store structure changes; adding a record field does not require one.
- Craft is fixed after creation in this pass. Switching it would reinterpret an existing chart's coordinates without changing the chart.

## How it landed

`PATTERN_PROJECT_SCHEMA_VERSION` went 4 → 5. `fromStored` now also normalizes `schemaVersion` to the current constant, which it did not do before — without that, a migrated record kept claiming version 4 while being typed as the current version.

Creation is no longer one click. `New Pattern Project` opens `src/ui/NewProjectDialog.tsx`, a modal carrying name, craft, photo-vs-blank-grid, and (for a blank grid) prefilled 48 × 36 dimensions. `duplicatePatternProject` spreads the whole project, so craft carried over with no change needed.

The dialog placement was the user's decision, taken through the impeccable `shape` playbook. `DESIGN.md` had no dialog or modal vocabulary, so `.dialog-scrim` / `.dialog-panel` / `.choice` are new to the design system and are not yet recorded in `DESIGN.md`.
