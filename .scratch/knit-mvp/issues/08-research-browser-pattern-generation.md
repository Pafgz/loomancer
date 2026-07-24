# Research Browser Pattern Generation

Type: research
Status: resolved
Blocked by: 04, 05, 07

## Question

Which stable browser APIs and proven algorithms can support local image decoding, crop/resampling, perceptual palette reduction and matching, local project storage, PDF/image export, and photo-library sharing in a responsive PWA?

## Answer

The focused MVP is feasible as a local-first browser/PWA. Findings are in [browser-pattern-generation.md](../../../docs/research/browser-pattern-generation.md).

Lock these choices:

- decode and process photos on-device with `input[type=file]`, `createImageBitmap`, Canvas 2D, and a dedicated worker;
- downsample with Pica, reduce palettes with Wu quantization (2–12 colors), and rank Yarn Inventory suggestions with CIEDE2000;
- keep IndexedDB as the only authoritative store for Pattern Projects and Yarn Inventory; use Cache Storage only for the app shell;
- export vector-first PDF with pdf-lib and bounded PNG via Canvas `toBlob`;
- offer Share and Save only after capability detection, always retaining Blob download;
- treat HEIC/HEIF, OffscreenCanvas, Web Share files, and `showSaveFilePicker` as progressive enhancements;
- keep photos, charts, and inventory off any analytics or remote path.
