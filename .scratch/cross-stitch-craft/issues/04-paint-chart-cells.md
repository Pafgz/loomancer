# 04 — Paint individual chart cells

**What to build:** A Knitter or Stitcher can select a palette color and paint Chart Cells by clicking or dragging, with correct stitch counts and working undo/redo.

**Blocked by:** 02

**Status:** resolved

- [x] A palette color can be selected as the active paint color
- [x] Clicking a cell sets it to the active color
- [x] Dragging paints a stroke of cells
- [x] Palette stitch counts stay accurate and still sum to width × height
- [x] One click or one drag is a single undo entry
- [x] Painting does not fire when the pointer was panning the chart
- [x] Painting marks the project as manually edited so regeneration still asks for confirmation
- [x] Chart painting is reachable by keyboard or has an equivalent accessible path

## Notes

- Add the cell operation beside the existing palette operations in `src/chart/palette-edits.ts` and reuse the `recountPalette` pattern so counts stay correct.
- Studio already snapshots whole charts for undo (`applyPaletteChart`, 30-entry cap). Reuse it; push one snapshot per stroke, not per cell.
- Pointer-to-cell mapping does not exist. It needs an inverse of the viewport transform in `src/ui/chart-viewport-math.ts`, accounting for stage centering, `translate(tx, ty) scale(s)`, `CHART_CELL_PX`, and `CHART_GAP_PX`.
- The canvas in `src/ui/ChartViewport.tsx` currently has no event handlers; pan, pinch, and wheel live on the stage.
- `role="img"` on the canvas will need revisiting once it becomes interactive.

## Answer

Cell painting is complete and covered by unit plus Studio journey tests.

- `paintChartCells` / `paintChartCell` in `src/chart/palette-edits.ts` — one stroke, one recount, identity return on no-op.
- Inverse viewport math in `src/ui/chart-viewport-math.ts` (`stagePointToChartPoint`, `chartCellAtStagePoint`, `chartCellLine`) with round-trip tests.
- `ChartViewport` paint bar selects the active color; primary-button drag paints while Pan / other buttons / two-finger gestures still pan. A second finger abandons an in-progress stroke. Preview draws on the canvas during the drag; the real edit lands on release via `applyPaletteChart`.
- Keyboard path: arrows move a stitch cursor while painting, Enter paints, Escape clears the brush; Shift+arrow still pans.
- Studio journey: blank project → add color → paint → undo restores counts and cells.

Browser verification confirmed click accuracy (cell under the pointer, no offset), pan-vs-paint mode separation, stitch counts summing to width × height, and keyboard cursor movement. Continuous drag stroke and single-undo-per-stroke are covered by unit tests (`ChartViewport.test.tsx`); programmatic browser drag simulation was unreliable in automation.
