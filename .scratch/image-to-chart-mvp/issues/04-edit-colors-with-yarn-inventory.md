# 04 — Edit colors with Yarn Inventory matches

**What to build:** A Knitter can replace, merge, or add chart colors with undo/redo; manage Yarn Inventory entries; and confirm CIEDE2000 Color Match suggestions so owned yarns map onto the chart without automatic substitution or yarn-quantity claims.

**Blocked by:** 03 — Generate an editable Colorwork Chart

**Status:** resolved

- [x] Global replace, merge, and add-color operations update cells, symbols, and stitch counts immediately
- [x] Undo/redo covers palette edits
- [x] Regenerating over manual edits requires confirmation
- [x] Yarn Inventory supports required name/display color and optional brand/line/code/notes/quantity
- [x] Color Match suggestions show ranked owned yarns and apply only after confirmation
- [x] Hard-to-distinguish palette pairs warn and offer merge without auto-merging
- [x] Quantity remains informational and never asserts sufficiency

## Notes

- Palette ops: `src/chart/palette-edits.ts`
- Color key + inventory UI: `src/ui/ColorKeyPanel.tsx`
- Undo/redo is local to the Studio session for palette chart snapshots
