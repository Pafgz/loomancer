# 02 — Select, crop, and persist a source image

**What to build:** A Knitter can choose a JPEG/PNG/WebP photo (with HEIC best-effort guidance), rotate and freely crop it, and have the source Blob plus crop/rotation parameters autosaved into the Pattern Project on the device.

**Blocked by:** 01 — Scaffold the local-first Studio shell

**Status:** ready-for-agent

- [ ] File picker accepts images and rejects undecodable inputs with clear guidance
- [ ] Rotate and free-aspect crop update a live preview without mutating the original Blob
- [ ] Closing and reopening the project restores the image and crop/rotation parameters
- [ ] Oversized inputs hit documented validation limits with actionable errors
- [ ] Source bytes never leave the device
