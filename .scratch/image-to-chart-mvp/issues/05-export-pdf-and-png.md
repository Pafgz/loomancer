# 05 — Export PDF and PNG chart packages

**What to build:** A Knitter can export a printable PDF and a high-resolution PNG containing the Colorwork Chart, symbols, coordinates, and color key, then Share/Save when the browser supports it or download as the portable fallback.

**Blocked by:** 04 — Edit colors with Yarn Inventory matches

**Status:** resolved

- [x] PDF export is vector-first and includes chart plus color key
- [x] PNG export is rendered from canonical chart data, not a UI screenshot
- [x] PNG side length is capped at 4,096 px with clear handling when exceeded
- [x] Share and Save appear only after capability detection
- [x] Download always works as fallback
- [x] Export tests verify chart correspondence, dimensions, and required key contents

## Implementation notes

- `src/export/chart-export.ts` — canonical, pure-first export core:
  - `buildColorKeyRows` / `chartCellHex` derive the key and per-cell colors straight
    from `ColorworkChart` data (no UI screenshot).
  - `computePngLayout` sizes the image (coordinate gutters + chart + color key) and
    shrinks the cell size until both sides ≤ `MAX_PNG_SIDE` (4096), flagging `clamped`.
  - `buildChartPdfBytes` renders a vector PDF with pdf-lib: filled cell rects, grid,
    edge coordinates (every 5th + edges), a color key, and symbols drawn as **vector
    primitives** (the Unicode chart glyphs can't be encoded by the standard WinAnsi
    font, so triangles/diamonds/etc. are drawn as shapes; label text is WinAnsi-sanitised).
  - `drawChartToCanvas` / `renderChartPngBlob` render the same canonical layout to a
    PNG via Canvas `toBlob`.
- `src/export/deliver-export.ts` — `getExportCapabilities` (Web Share files +
  `showSaveFilePicker`), with `shareBlob` / `saveBlob` / `downloadBlob`; Share/Save are
  shown only when detected, download is always available and is the fallback on
  unavailability or non-abort errors (user cancel → "cancelled", no forced download).
- `src/ui/ExportMenu.tsx` — header "Export" control (disabled until a chart exists);
  a popover offers Download always plus Share/Save when capable, per PDF and PNG, and
  surfaces the 4096px clamp notice.
- Tests: `src/export/chart-export.test.ts` (key contents, cell correspondence, layout
  dimensions + 4096 cap, valid single-page PDF) and a Studio journey assertion that
  Export enables once a chart exists and reveals PDF/PNG download actions.
- The placeholder "Save Knit-ready Pattern" button was replaced by the Export menu
  (App shell test updated accordingly).
