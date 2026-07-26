# 01 — Export knit-ready grid and traditional coordinates

**Type:** task  
**Status:** resolved  
**Blocked by:** none

**What to build:** PDF and PNG exports use major grid lines every 5 (from bottom-right origin), traditional stitch/row numbering, and a short reading hint.

## Acceptance

- [x] Shared helpers for stitch/row numbers and major-line detection
- [x] PNG and PDF use the same conventions
- [x] Tests cover numbering, major lines, and layout space for the hint

## Answer

Implemented in `src/export/chart-export.ts` and `src/export/chart-pdf.ts`:
- `stitchNumberAtColumn` / `rowNumberAtRow` / `isMajorGridLine` / `CHART_READING_HINT`
- PNG + PDF major/minor grid measured from right + bottom
- Traditional labels and reading hint above the color key
