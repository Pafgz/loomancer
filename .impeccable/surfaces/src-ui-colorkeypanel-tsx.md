---
version: 1
slug: "src-ui-colorkeypanel-tsx"
primary_target: "src/ui/ColorKeyPanel.tsx"
related_targets: []
---

# Color Key / Palette panel — surface brief

Mode: **Operate**

Strategy for this surface only. Durable visuals stay in `DESIGN.md`; product truth in `PRODUCT.md`. Interaction decisions for the in-progress Palette refactor live in `.scratch/palette-inline-edit/spec.md` — that scratch is authoritative until implemented and this brief is updated.

## Job

Let the Knitter/Stitcher select a chart color to paint, change a palette entry’s color, add a new key entry, merge colors, and confirm yarn matches — without leaving the Studio color-key column.

## Interaction thesis

One Palette card: header `+` (picker-first add), row = select for paint, trailing Edit = color picker (apply on commit). No separate Add/Edit cards. Merge quiet; yarn matches under selection; Yarn Inventory remains below.

## Pointers

- Spec / locked decisions: `.scratch/palette-inline-edit/spec.md`
- Implement ticket: `.scratch/palette-inline-edit/issues/02-implement-palette-inline-controls.md`
- Component: `src/ui/ColorKeyPanel.tsx`
