# Cross-stitch as a second craft

Status: ready-for-review

## Problem Statement

Yarnlane's photo-to-chart engine solves a problem cross-stitchers also have, but the product is knitting-only: the audience is defined as a Knitter, a chart can only come from a photo, colors can only be edited palette-wide, and exports now speak knitting conventions ("start bottom-right, read right to left"). A cross-stitcher handed a Yarnlane chart would read it in the wrong direction and could not fix a single misconverted cell.

## Solution

A Pattern Project declares its **craft** — Knitting or Cross-stitch — at creation. Craft drives chart conventions in the export. Independently of craft, a project can start from a **blank canvas** instead of a photo, and any chart cell can be **painted** with a palette color, with undo/redo.

Cross-stitch reuses the existing palette, symbols, and color key. No thread catalogs.

## User Stories

1. As a Stitcher, I want to choose Cross-stitch when creating a Pattern Project, so that the chart follows my craft's conventions.
2. As a Stitcher, I want my exported chart numbered from the top-left with center markers, so that I can start stitching from the middle the way patterns expect.
3. As a Stitcher, I want bold counting lines every 10 squares, so that counting matches standard cross-stitch charts.
4. As a Stitcher, I want no knitting reading hint on my chart, so that I am not told to read right to left.
5. As a Knitter, I want my existing projects to keep knitting conventions, so that nothing I already made changes meaning.
6. As a Knitter or Stitcher, I want to start a Pattern Project from a blank grid with a chosen size and background color, so that I can design a motif without a photo.
7. As a Knitter or Stitcher, I want to paint an individual Chart Cell with a palette color, so that I can fix conversion artifacts and draw by hand.
8. As a Knitter or Stitcher, I want to drag to paint several cells, so that correcting an area is not one click at a time.
9. As a Knitter or Stitcher, I want painting covered by undo and redo, so that I can experiment safely.
10. As a Knitter or Stitcher, I want stitch counts in the color key to stay correct after painting, so that the key never lies about the chart.

## Implementation Decisions

- Add `craftType: "knitting" | "cross-stitch"` to `PatternProject`; default `"knitting"` so existing records are unchanged. Bump `PATTERN_PROJECT_SCHEMA_VERSION` and default the field in `fromStored`.
- Craft is chosen at project creation and is not switchable in this pass — switching would silently reinterpret an existing chart.
- Export conventions become craft-driven in `src/export/chart-export.ts`, which already owns the shared coordinate and grid helpers used by both PNG and PDF. Cross-stitch: origin top-left, major lines every 10, center markers, no reading hint. Knitting keeps today's behavior exactly.
- Blank canvas creates a `ColorworkChart` of the project's `chartWidth` × `chartHeight` filled with one palette entry. Projects already persist without `sourceImage`, so no schema work is needed beyond the chart itself.
- Cell painting adds a `paintChartCell` helper next to the existing palette operations in `src/chart/palette-edits.ts`, reusing the private `recountPalette` pattern so `stitchCount` stays accurate.
- Painting reuses Studio's existing whole-chart undo snapshots. A drag is **one** undo entry, not one per cell.
- Pointer-to-cell mapping needs a new inverse of the viewport transform in `src/ui/chart-viewport-math.ts`; painting must not fire when the pointer was dragging the canvas to pan.
- Regeneration from a photo still discards manual edits behind the existing confirmation.

## Testing Decisions

- Pure helpers get direct unit tests: `paintChartCell` (cell changes, stitch counts stay summed to width × height, out-of-range is a no-op) and the pointer-to-cell inverse (round-trips against the forward mapping at several scales and pan offsets).
- Export conventions are asserted per craft: cross-stitch numbers from the top-left, marks center row and column, bolds every 10, and omits the knitting hint; knitting output is unchanged.
- A Studio journey covers blank-canvas creation through painting a cell to undo.

## Out of Scope

- DMC, Anchor, or any manufacturer thread catalog and its color numbers
- Fabric count sizing, finished-dimension calculation, skein or floss estimation
- Fractional stitches, backstitch, French knots
- Switching craft on an existing project
- Rebranding, marketing, or onboarding for the new audience
- Accounts, sync, and everything already deferred in `PRODUCT.md`

## Open Questions

- **Yarn Inventory naming.** The term is fixed in `CONTEXT.md` and is knitting language. Options: leave it, rename to a craft-neutral term, or give cross-stitch a sibling concept. Undecided — do not invent a name during implementation.

## Further Notes

- `PRODUCT.md` currently lists cell-by-cell drawing as explicitly deferred and names the confident-beginner Knitter as the only audience. Both statements are contradicted by this spec and must be amended before the work lands (ticket 01).
- Chart style research and the knitting conventions already shipped: `.scratch/knit-ready-chart-style/spec.md`.
