# 05 — Cross-stitch export conventions

**What to build:** Exports follow the conventions of the project's craft, so a cross-stitch chart reads as a cross-stitch pattern and knitting output is unchanged.

**Blocked by:** 02

**Status:** open

- [ ] Cross-stitch numbers stitches and rows from the top-left
- [ ] Cross-stitch marks the center row and center column so stitching can start from the middle
- [ ] Cross-stitch bolds counting lines every 10 rather than every 5
- [ ] The knitting reading hint is replaced with a cross-stitch-appropriate note or omitted
- [ ] Knitting exports keep bottom-right numbering, every-5 majors, and the existing hint, byte-for-byte in behavior
- [ ] PDF and PNG stay consistent with each other for both crafts

## Notes

- `src/export/chart-export.ts` already owns the shared conventions: `stitchNumberAtColumn`, `rowNumberAtRow`, `isMajorGridLine`, `shouldLabel`, `MAJOR_GRID_EVERY`, `CHART_READING_HINT`. Make these craft-aware rather than forking the renderers.
- Both `drawChartToCanvas` (PNG) and `buildChartPdfBytes` (PDF) consume those helpers; keeping the branch in one place is what stops the two exports drifting.
- Existing tests in `src/export/chart-export.test.ts` cover knitting conventions and must keep passing unchanged.
