# 03 — Generate an editable Colorwork Chart

**What to build:** A Knitter can tune detail with a live slider or exact stitch dimensions, choose 2–12 colors, and generate a Colorwork Chart that appears in the Studio with grid, coordinates, symbols, and stitch counts while regeneration is debounced and progress is shown.

**Blocked by:** 02 — Select, crop, and persist a source image

**Status:** ready-for-agent

- [ ] Detail slider and exact width/height drive worker generation from the crop
- [ ] Aspect ratio stays locked by default and can be unlocked
- [ ] Palette size is constrained to 2–12 colors with a default of 6
- [ ] Chart cells, symbols, coordinates, and stitch counts are shown
- [ ] Last valid chart remains visible during regeneration with progress feedback
- [ ] Deterministic engine fixtures cover crop/rotate/resample, palette bounds, and stitch-count integrity
