# 02 — Select, crop, and persist a source image

**What to build:** A Knitter can choose a JPEG/PNG/WebP photo (with HEIC best-effort guidance), rotate and freely crop it, and have the source Blob plus crop/rotation parameters autosaved into the Pattern Project on the device.

**Blocked by:** 01 — Scaffold the local-first Studio shell

**Status:** resolved

- [x] File picker accepts images and rejects undecodable inputs with clear guidance
- [x] Rotate and free-aspect crop update a live preview without mutating the original Blob
- [x] Closing and reopening the project restores the image and crop/rotation parameters
- [x] Oversized inputs hit documented validation limits with actionable errors
- [x] Source bytes never leave the device

## Notes

- Validation seam: `src/image/validate-source-image.ts` (25 MB / 20 MP limits; HEIC guidance)
- Source bytes stored as ArrayBuffer in IndexedDB and rebuilt as Blob on load
- Crop/rotation are non-destructive parameters over the original photo
