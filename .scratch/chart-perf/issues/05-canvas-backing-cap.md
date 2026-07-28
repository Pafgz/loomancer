# 05 — Verify and cap canvas backing-store size on real mobile devices

**What to build:** `ChartViewport`'s `useLayoutEffect`
(`src/ui/ChartViewport.tsx`) sizes the canvas backing store as
`content.width/height * min(2, devicePixelRatio)`. At the maximum chart size
(`MAX_CHART_DIMENSION = 300`, `src/chart/chart-types.ts`) and DPR 2, that's a
10,198×10,198 canvas — ~104 Mpx, ~397 MB of pixel memory. This was confirmed
to render correctly (not silently blank) on this desktop
Electron/Chrome machine by writing a probe pixel and reading it back with
`getImageData`. **It has not been tested on an actual iOS or Android
device.** `PRODUCT.md` states phone/tablet as primary targets and the app is
installable as a PWA, so this is a real gap, not a hypothetical one.

**Blocked by:** none

**Status:** open

- [ ] Test a 300×300, 12-color chart, symbols on, on at least one real iOS
      Safari device (not simulator-only — canvas area limits have
      historically been a real-hardware/OS behavior) and one Android Chrome
      device. Confirm the chart actually renders, not just that no error is
      thrown — a canvas past the area ceiling renders blank silently, so
      "no crash" is not sufficient evidence.
- [ ] If a device fails: cap the backing store at a known-safe pixel budget
      (research current per-platform ceilings — they've moved over browser
      versions and are not consistently documented; don't hardcode last
      year's number without checking) and downscale the DPR multiplier
      rather than the content size, so pan/zoom math
      (`src/ui/chart-viewport-math.ts`) doesn't need to change — only the
      backing-store resolution does.
  - Reminder: the CSS `transform: scale(...)` on `.chart-viewport-world`
    already handles on-screen magnification. The backing store only needs
    enough resolution for the *unzoomed* natural size at the device's pixel
    density — DPR 2 at 16px cells is arguably already more resolution than
    a 300-stitch chart needs to look sharp, so reducing it may cost nothing
    visually. Confirm this with a side-by-side screenshot before assuming.
- [ ] This is a *screen-only* concern. `MAX_PNG_SIDE = 4096`
      (`src/export/chart-export.ts`) already clamps the PNG exporter, and
      the PDF exporter (`src/export/chart-pdf.ts`) is vector, so exports are
      already safe. Don't scope this issue to touch either exporter.

## Measured baseline (this machine, via `perf.html` — see `../spec.md`)

| DPR | backing store | pixels | approx. memory | result here |
|---|---|---|---|---|
| 2 | 10,198×10,198 | 104.0 Mpx | ~397 MB | renders (probe pixel confirmed) |
| 1 | 5,099×5,099 | 26.0 Mpx | ~99 MB | renders (probe pixel confirmed) |

No comparable data exists yet for a real mobile browser — that's the
deliverable of this issue's first checkbox, not something to infer from the
desktop numbers above.
