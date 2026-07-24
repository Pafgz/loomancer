# Choose the MVP Architecture

Type: grilling
Status: resolved
Blocked by: 08

## Question

What are the minimum application seams and durable data boundaries needed to implement the responsive, local-first Pattern Project workflow without prematurely adding a backend?

## Answer

Lock a local-first TypeScript web app with four seams:

1. **Pattern Project model** — one serializable project containing the source image Blob, crop/rotation, generation settings, palette, chart cell indexes, accepted Color Matches, undo history, and schema version.
2. **Image-to-chart engine** — a worker that crops/rotates, resamples with Pica, quantizes with Wu (2–12 colors), assigns stitches with CIEDE2000, and ranks Yarn Inventory suggestions. The UI never mutates stitch data during zoom or export.
3. **Local repository** — IndexedDB stores Pattern Projects and Yarn Inventory transactionally. Cache Storage holds only the versioned PWA shell. No backend is required for create, edit, save, reopen, or export.
4. **Studio UI** — the three-column editor from the prototype: image controls left, Colorwork Chart center, color key and inventory matches right, with persistent undo/redo/export.

Export renders independently from the canonical chart: vector-first PDF via pdf-lib, PNG via Canvas `toBlob` with a 4,096-pixel side cap, Share/Save as capability-detected enhancements, and Blob download as the portable fallback.

Out of architecture for this MVP: accounts, sync, server-side image processing, native apps, WebGL/WebGPU requirements, and OPFS as the primary store.
