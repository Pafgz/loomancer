# 05 — Export PDF and PNG chart packages

**What to build:** A Knitter can export a printable PDF and a high-resolution PNG containing the Colorwork Chart, symbols, coordinates, and color key, then Share/Save when the browser supports it or download as the portable fallback.

**Blocked by:** 04 — Edit colors with Yarn Inventory matches

**Status:** ready-for-agent

- [ ] PDF export is vector-first and includes chart plus color key
- [ ] PNG export is rendered from canonical chart data, not a UI screenshot
- [ ] PNG side length is capped at 4,096 px with clear handling when exceeded
- [ ] Share and Save appear only after capability detection
- [ ] Download always works as fallback
- [ ] Export tests verify chart correspondence, dimensions, and required key contents
