# Knit-ready Colorwork Chart style

## Objective

Exported PDF and PNG Colorwork Charts follow standard knitting-chart conventions so a confident beginner can count stitches and rows while knitting.

Success: a download looks like a published colorwork chart — major grid every 5, coordinates from the traditional bottom-right start — without changing generation or Studio editing.

## Commands

```
npm test -- src/export/chart-export.test.ts
npm test -- src/export
```

## Boundaries

**Always do**
- Major grid every 5 stitches and every 5 rows on both PDF and PNG
- Traditional coordinates: stitch 1 at the right edge, row 1 at the bottom
- Keep color + symbol + color key
- Shared helpers so PDF and PNG cannot drift

**Ask first**
- Changing Studio on-screen preview to match export style
- Flat RS/WS alternating number sides
- Proportional (non-square) stitch cells

**Never do**
- Screenshot-based export
- Removing symbols or the color key
- Configurable “every N” in this pass (hardcode 5)

## Acceptance

1. Vertical and horizontal major lines appear every 5 cells, measured from the knitting origin (right edge for stitches, bottom edge for rows); outer border is at least as strong as a major line.
2. Top stitch labels: rightmost cell is `1`, increasing leftward; labels at 1, every 5, and last.
3. Side row labels: bottom cell is `1`, increasing upward; labels at 1, every 5, and last.
4. Export includes a short reading hint: start bottom-right; in the round read right to left, bottom to top.
5. Cell colors, symbols, and color key still match canonical chart data.
