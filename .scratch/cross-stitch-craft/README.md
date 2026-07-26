# Cross-stitch as a second craft

Status: in progress — approved, building all five tickets in dependency order.

Canonical decisions live in [spec.md](./spec.md).

Branch: `cross-stitch-craft`, cut from `main` after PR #4 (`knit-ready-chart-style`) merged, so the craft-aware export helpers ticket 05 builds on are present.

## Tickets

- [x] 01 — Amend product boundaries and domain vocabulary
- [x] 02 — Add craft type to a Pattern Project
- [x] 03 — Start a Pattern Project from a blank canvas
- [x] 04 — Paint individual chart cells
- [ ] 05 — Cross-stitch export conventions (untouched)

## Dependency order

`01` unblocks everything. `02` unblocks the rest. `03`, `04`, and `05` are independent of each other.
