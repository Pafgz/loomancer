# 02 — Implement Palette inline add / edit

Type: task  
Status: resolved  
Blocked by: 01

**What to build:** Refactor `ColorKeyPanel` so Palette owns add (`+` header), row select, trailing color Edit, merge, and yarn matches — removing the standalone Add color and Edit cards. Follow [spec.md](../spec.md) decisions D1–D10.

## Acceptance criteria

- [x] Palette header has a top-right `+` that opens a color picker; confirm appends a color, selects it for paint, and does not change existing cells
- [x] `+` is disabled with a full-palette hint at `MAX_CHART_COLORS`
- [x] Row click/tap selects for painting; does not by itself open the color picker
- [x] Trailing per-row Edit opens a color picker; commit globally replaces that palette index
- [x] Picker override sets yarn label to “Custom color” (or clears a prior yarn name claim)
- [x] No separate “Add color” or “Edit {symbol}” cards remain
- [x] Merge remains available when palette length > 1 (quiet control; see spec defaults if chrome unspecified)
- [x] Yarn match suggestions appear for the selected row and apply only on confirm
- [x] Yarn Inventory form/list still work below Palette
- [x] Existing undo/redo and regenerate-confirmation behavior still cover palette edits
- [x] Keyboard / `aria-label` / symbol+label+count a11y bar from PRODUCT/DESIGN preserved
- [x] Tests updated for ColorKeyPanel / Studio flows covering add and replace via the new controls

## Notes

- Primary file: `src/ui/ColorKeyPanel.tsx`
- Ops: `src/chart/palette-edits.ts` (`addChartColor` via Studio `onAddPaletteColor`, `replaceChartColor`, `mergeChartColors`, `rankYarnMatches`)
- Do not change engine semantics unless a test forces a wiring fix

## Answer

Shipped on `cursor/palette-inline-edit-d663`:

- One Palette card: header `+` → hidden color input (picker-first add); row select; trailing color input Edit (apply on `change` → “Custom color”).
- Merge-into select + yarn matches only when a row is selected; similar-pair warning stays as sibling; Yarn Inventory unchanged below.
- Chrome defaults from spec: native color input as Edit affordance; merge select for selected row only.
- Tests: `src/ui/ColorKeyPanel.test.tsx` + updated `Studio.test.tsx`.
