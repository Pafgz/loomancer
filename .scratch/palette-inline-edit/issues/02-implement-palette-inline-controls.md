# 02 — Implement Palette inline add / edit

Type: task  
Status: claimed  
Blocked by: 01

**What to build:** Refactor `ColorKeyPanel` so Palette owns add (`+` header), row select, trailing color Edit, merge, and yarn matches — removing the standalone Add color and Edit cards. Follow [spec.md](../spec.md) decisions D1–D10.

## Acceptance criteria

- [ ] Palette header has a top-right `+` that opens a color picker; confirm appends a color, selects it for paint, and does not change existing cells
- [ ] `+` is disabled with a full-palette hint at `MAX_CHART_COLORS`
- [ ] Row click/tap selects for painting; does not by itself open the color picker
- [ ] Trailing per-row Edit opens a color picker; commit globally replaces that palette index
- [ ] Picker override sets yarn label to “Custom color” (or clears a prior yarn name claim)
- [ ] No separate “Add color” or “Edit {symbol}” cards remain
- [ ] Merge remains available when palette length > 1 (quiet control; see spec defaults if chrome unspecified)
- [ ] Yarn match suggestions appear for the selected row and apply only on confirm
- [ ] Yarn Inventory form/list still work below Palette
- [ ] Existing undo/redo and regenerate-confirmation behavior still cover palette edits
- [ ] Keyboard / `aria-label` / symbol+label+count a11y bar from PRODUCT/DESIGN preserved
- [ ] Tests updated for ColorKeyPanel / Studio flows covering add and replace via the new controls

## Notes

- Primary file: `src/ui/ColorKeyPanel.tsx`
- Ops: `src/chart/palette-edits.ts` (`addChartColor` via Studio `onAddPaletteColor`, `replaceChartColor`, `mergeChartColors`, `rankYarnMatches`)
- Do not change engine semantics unless a test forces a wiring fix
