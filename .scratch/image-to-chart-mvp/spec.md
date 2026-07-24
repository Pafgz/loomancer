# Knit-Pro MVP Specification

Status: ready-for-agent

## Problem Statement

A confident beginner knitter wants to turn a photo into a knitting Colorwork Chart they can actually use with yarn they already own. Existing tools either generate garment patterns without photo-pixelization, or leave color matching and export as disconnected manual work. The knitter needs one local workflow that controls chart detail, edits colors against owned yarn, and exports a printable chart with a clear color key.

## Solution

Knit-Pro provides a responsive local-first web app (installable as a PWA) where a Knitter creates a Pattern Project, selects an image, controls pixelization and palette size, edits the Colorwork Chart and Yarn Inventory matches, saves drafts on the device, and exports a PDF or high-resolution image with symbols and color key. Photos and projects never leave the device for this release.

## User Stories

1. As a Knitter, I want to create a Pattern Project without an account, so that I can start designing immediately.
2. As a Knitter, I want to select a photo from my device or photo library, so that I can turn an existing image into a chart.
3. As a Knitter, I want unsupported or undecodable images rejected with a clear message, so that I know how to convert them.
4. As a Knitter, I want to rotate and crop my image freely, so that only the motif I care about becomes the chart.
5. As a Knitter, I want a live detail slider, so that I can trade stitch count against visual fidelity.
6. As a Knitter, I want optional exact stitch width and row height, so that I can target a known chart size.
7. As a Knitter, I want aspect ratio locked by default when changing one dimension, so that my crop stays coherent.
8. As a Knitter, I want to unlock aspect ratio, so that I can force arbitrary width and height when needed.
9. As a Knitter, I want to choose a maximum of 2–12 colors, so that the chart stays knit-able.
10. As a Knitter, I want generation to resample my crop into a Colorwork Chart, so that each cell represents one stitch color.
11. As a Knitter, I want the last valid chart to remain visible while regeneration runs, so that I do not lose context.
12. As a Knitter, I want progress feedback during regeneration, so that I know the app is working.
13. As a Knitter, I want a side color key with symbols, colors, yarn labels, and stitch counts, so that the chart stays usable when printed or viewed with reduced color fidelity.
14. As a Knitter, I want to replace a chart color globally, so that I can map it to a yarn I prefer.
15. As a Knitter, I want to merge one chart color into another, so that I can simplify the palette after generation.
16. As a Knitter, I want to add a custom replacement color, so that I am not limited to generated or inventory colors.
17. As a Knitter, I want undo and redo for palette edits, so that I can experiment safely.
18. As a Knitter, I want confirmation before regenerating over manual color edits, so that I do not lose work accidentally.
19. As a Knitter, I want to add Yarn Colors with a required name and display color, so that I can describe yarn I own.
20. As a Knitter, I want optional brand, line, color code, notes, and quantity fields, so that I can record useful details without blocking entry.
21. As a Knitter, I want suggested Color Matches ranked by perceptual similarity, so that I can quickly connect chart colors to owned yarn.
22. As a Knitter, I want to confirm or reject each suggestion, so that no automatic substitution happens.
23. As a Knitter, I want a warning when two palette colors become hard to distinguish, so that I can choose to merge them deliberately.
24. As a Knitter, I want quantity treated as informational only, so that the app does not claim I have enough yarn for an unknown garment.
25. As a Knitter, I want row and column coordinates on the chart, so that I can find my place while knitting.
26. As a Knitter, I want to export a printable PDF with chart and color key, so that I can knit from paper or a tablet.
27. As a Knitter, I want to export a high-resolution PNG with chart and color key, so that I can save it to my photo library or files.
28. As a Knitter, I want Share and Save actions when my browser supports them, so that I can send or store exports through the OS.
29. As a Knitter, I want a download fallback when Share or Save is unavailable, so that export always works.
30. As a Knitter, I want Pattern Projects autosaved locally, so that closing the tab does not erase my draft.
31. As a Knitter, I want to reopen, rename, duplicate, and delete local drafts, so that I can manage unfinished work.
32. As a Knitter, I want Yarn Inventory shared across Pattern Projects on the same device, so that I do not re-enter owned yarns.
33. As a Knitter, I want a clear warning that data is local-only and not backed up, so that I understand the risk.
34. As a Knitter, I want the Studio layout with controls left, chart center, and color key right, so that I can judge detail and color replacements together.
35. As a Knitter, I want the same workflow usable on phone, tablet, and desktop, so that I can design where I already keep photos.
36. As a Knitter, I want the app shell to work offline after install or caching, so that I can continue editing saved local projects without a network.
37. As a Knitter, I want keyboard-accessible controls and text alternatives for color-only information, so that I can use the Studio with assistive technology.
38. As a Knitter, I want oversized images and charts rejected or redirected with clear limits, so that the app remains responsive on modest devices.

## Implementation Decisions

- Ship a TypeScript responsive web app / PWA with no required backend for create, edit, save, reopen, or export.
- Use four seams: Pattern Project model, image-to-chart engine, local repository, Studio UI.
- Keep one serializable Pattern Project containing source Blob, crop/rotation, generation settings, palette, chart indexes, accepted Color Matches, undo history, and schema version.
- Run decode, resample, quantization, and matching in a dedicated worker; keep the last valid chart visible and debounce regeneration.
- Use Pica for source-to-grid downsampling, Wu quantization for 2–12 color palettes, and CIEDE2000 for stitch assignment and Yarn Inventory ranking.
- Do not dither by default; each chart cell is a literal stitch.
- Store Pattern Projects and Yarn Inventory in IndexedDB; use Cache Storage only for the versioned app shell.
- Request durable storage after meaningful save; explain that browser storage is not a backup.
- Support JPEG/PNG/WebP as guaranteed inputs; treat HEIC/HEIF as best-effort decode with conversion guidance.
- Cap interactive preview longest edge at 2,048 px, chart generation at 300 × 300 stitches initially, inputs around 20 megapixels / 25 MB, and PNG export at 4,096 px per side.
- Export PDF vector-first with pdf-lib; export PNG from canonical chart data via Canvas `toBlob`, not UI screenshots.
- Capability-detect Web Share files and `showSaveFilePicker`; always retain Blob download.
- Studio information architecture follows Variant A from the throwaway prototype: left controls, central chart, right color key/inventory.
- Keep photos, charts, filenames, project names, and Yarn Inventory out of analytics and remote logging.
- Defer accounts, sync, garment construction, gauge/sizing, yarn catalogs/commerce, payments, and community features.

Prototype-derived layout decision: the Studio keeps image/pixelization controls and the color key visible while the chart updates, rather than a multi-step wizard or yarn-first drawer.

## Testing Decisions

A good test asserts externally visible behavior and durable contracts, not private helper structure.

Primary seams:

1. **Browser journey seam** — from image selection through crop, detail/palette controls, color replacement, local reopen, and PDF/PNG export.
2. **Deterministic engine contracts** — crop/rotate/resample, palette bounds, CIEDE2000 fixtures, Color Match ranking, stitch-count integrity, merge/replace semantics, and export rendering from canonical chart data.

Also cover IndexedDB round-trips, quota/private-mode warnings, regeneration confirmation over manual edits, capability-detected Share/Save fallbacks, and offline app-shell reopen of local projects.

There is no prior production codebase; these seams are the first test surface.

## Out of Scope

- Full Dreamknit garment-generator parity
- Sweater/garment construction, sizing, fit, and gauge-aware instructions
- Yarn quantity claims and manufacturer catalogs
- Accounts, cloud sync, collaboration, sharing links
- Payments, subscriptions, public catalogs, and community
- Native iOS/Android apps
- Cell-by-cell drawing tools, background removal, AI segmentation, multi-image charts
- Server-side image processing

## Further Notes

- Domain vocabulary lives in `CONTEXT.md`.
- Architecture rationale lives in `docs/adr/0001-local-first-pattern-projects.md`.
- Supporting research: `docs/research/dreamknit-feature-audit.md`, `docs/research/browser-pattern-generation.md`.
- Throwaway UI comparison: `.scratch/knit-mvp/prototype/chart-editor-prototype.html`.
- Wayfinding decisions: `.scratch/knit-mvp/map.md`.
