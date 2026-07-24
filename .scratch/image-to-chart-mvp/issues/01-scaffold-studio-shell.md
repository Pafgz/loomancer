# 01 — Scaffold the local-first Studio shell

**What to build:** A Knitter can open a responsive PWA shell, create an empty Pattern Project, and see the three-column Studio with persistent undo/redo/export placeholders and an empty local project list. Pattern Projects and Yarn Inventory round-trip through IndexedDB with a schema version.

**Blocked by:** None — can start immediately.

**Status:** claimed

- [ ] Creating a Pattern Project works without an account
- [ ] Studio shows left controls, central chart area, and right color-key area
- [ ] IndexedDB stores and reloads project and inventory schema versions
- [ ] Local-only storage warning is visible near project management
- [ ] App shell installs/caches as a progressive enhancement without blocking tab use
