# 05 — Cross-stitch export conventions (Stitch-ready Pattern)

**What to build:** Exports follow the conventions of the project's craft. A cross-stitch Pattern Project exports a **Stitch-ready Pattern**; knitting keeps today's **Knit-ready Pattern** behavior unchanged.

**Blocked by:** 02

**Status:** open

## Decisions (from grill)

- Chart **data** is unchanged: whole Chart Cells only. No backstitch, fractionals, DMC catalog, strands, or fabric-count sizes.
- FlossCross inspires **conventions + PDF packaging**, not its catalog or special stitches.
- **PDF** is the packaged document; **PNG** is the compact chart image (grid + color key, no document chrome).
- Studio on-screen preview stays as-is this pass.
- Knit-ready PDF/PNG behavior is frozen; all new branches are Craft-gated to `cross-stitch`.

## Checklist

- [ ] Cross-stitch numbers stitches and rows from the top-left (stitch 1 = left, row 1 = top)
- [ ] Cross-stitch bolds counting lines every 10 from the top-left origin (both edges major)
- [ ] Cross-stitch draws center row and center column guidelines at the geometric midpoint (on even counts the guide falls between stitches)
- [ ] PDF only: title = project name; subtitle = `Cross-stitch · W × H`; cross-stitch reading hint; fixed Yarnlane footer
- [ ] PDF only: dedicated floss-chart legend **block** under the chart (same columns: symbol, swatch, label, stitch count)
- [ ] PNG: same grid conventions + compact color key; **no** title/subtitle/footer/reading-hint chrome; omit knitting hint
- [ ] Knit-ready exports keep bottom-right numbering, every-5 majors, and the existing hint, byte-for-byte in behavior
- [ ] PDF and PNG stay consistent with each other on grid conventions for both crafts
- [ ] Single custom-sized PDF page (no A4/Letter tiling this pass)

## Notes

- `src/export/chart-export.ts` owns shared conventions: make `stitchNumberAtColumn`, `rowNumberAtRow`, `isMajorGridLine`, `shouldLabel`, major interval, and reading-hint selection craft-aware (default `"knitting"` so existing call sites stay Knit-ready).
- Both `drawChartToCanvas` (PNG) and `buildChartPdfBytes` (PDF) consume those helpers; keep the branch in one place.
- `ExportMenu` passes `craftType` from the open Pattern Project into PDF/PNG builders.
- Existing tests in `src/export/chart-export.test.ts` cover knitting conventions and must keep passing unchanged.
- Center guide helper: offset in cell units from the top-left grid corner is `total / 2` (e.g. 40 for width 80; 5.5 for width 11).
