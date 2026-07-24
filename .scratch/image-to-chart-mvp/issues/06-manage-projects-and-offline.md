# 06 — Manage local projects and offline resilience

**What to build:** A Knitter can rename, duplicate, and delete local Pattern Projects, understand storage/private-mode risks, recover from quota failures without losing the in-memory chart, and reopen projects after the cached app shell loads offline.

**Blocked by:** 05 — Export PDF and PNG chart packages

**Status:** resolved

- [x] Project library supports rename, duplicate, and delete
- [x] Yarn Inventory remains available across projects on the same device
- [x] QuotaExceededError and private-mode/storage-loss cases show actionable warnings
- [x] A failed save does not destroy the previous complete project or current in-memory chart
- [x] Offline reload of the app shell still opens previously saved local projects
- [x] Browser journey from create through export and reopen passes on phone, tablet, and desktop viewports

## Implementation notes

- Repository: added `deletePatternProject(id)` to `LocalRepository`
  (`src/repository/local-repository.ts`), covered by a delete test that confirms
  siblings are untouched. Yarn Inventory was already a shared store, so it stays
  available across projects on the device.
- `src/repository/storage-errors.ts`: `isQuotaExceeded` +
  `describeStorageError` map failures to actionable, reassuring copy (quota vs.
  generic, both stressing that current work is still open), plus
  `ensurePersistentStorage()` (best-effort `navigator.storage.persist()`), all
  unit-tested.
- `src/domain/models.ts`: `duplicatePatternProject` clones with a new id, fresh
  timestamps, `(copy)` name, and a deep-copied chart/crop (source Blob shared by
  reference), with unit tests asserting isolation.
- `src/App.tsx`: project library now supports inline **rename**, **duplicate**,
  and confirm-guarded **delete**; every mutation is wrapped so a failed save
  surfaces a `role="alert"` banner via `describeStorageError` **without** dropping
  the in-memory project or chart (`setActiveProject` happens before the await).
  Durable storage is requested after successful saves. App tests cover
  rename/duplicate/delete and the "not confirmed" case.
- Offline resilience: `vite.config.ts` workbox now sets
  `navigateFallback: "index.html"` and `cleanupOutdatedCaches: true` so an offline
  reload serves the cached app shell; saved projects continue to load from
  IndexedDB. Responsive layout (existing breakpoints) keeps the create→export→
  reopen journey usable on phone/tablet/desktop.
