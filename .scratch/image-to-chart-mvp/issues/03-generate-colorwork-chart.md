# 03 — Generate an editable Colorwork Chart

**What to build:** A Knitter can tune detail with a live slider or exact stitch dimensions, choose 2–12 colors, and generate a Colorwork Chart that appears in the Studio with grid, coordinates, symbols, and stitch counts while regeneration is debounced and progress is shown.

**Blocked by:** 02 — Select, crop, and persist a source image

**Status:** resolved

- [x] Detail slider and exact width/height drive worker generation from the crop
- [x] Aspect ratio stays locked by default and can be unlocked
- [x] Palette size is constrained to 2–12 colors with a default of 6
- [x] Chart cells, symbols, coordinates, and stitch counts are shown
- [x] Last valid chart remains visible during regeneration with progress feedback
- [x] Deterministic engine fixtures cover crop/rotate/resample, palette bounds, and stitch-count integrity

## Notes

- Engine: `src/chart/generate-chart.ts` (downsample + median-cut + CIEDE2000 assignment)
- Worker: `src/chart/chart.worker.ts` used from the app shell; tests inject an inline generator
- Generation is debounced (300ms); previous chart stays visible while updating
