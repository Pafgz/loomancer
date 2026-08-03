# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: a **confident beginner Knitter** — someone who knows basic knitting and can follow a Colorwork Chart, but should not need image-editing expertise.

Situation: they have a motif photo (or similar image) and yarn they already own; they want a chart they can actually knit from, not a garment pattern generator.

Second audience: a **Stitcher** doing cross-stitch. The chart job is the same — a motif photo or a hand-drawn grid becomes a countable chart with a color key — but the conventions are their own: numbering from the top-left, center markers, and counting lines every ten squares.

Further audiences are undecided and not required for this product era.

## Product Purpose

Yarnlane turns a photo into an editable, image-derived **Colorwork Chart** with a clear color key, matched against the Knitter's **Yarn Inventory**, then exported for knitting or cross-stitch (PDF or high-resolution image). A chart can also start from a blank grid, and any cell can be edited by hand.

Success for this era: the Knitter or Stitcher leaves with a ready-to-work Colorwork Chart and color key from a local **Pattern Project**, in the conventions of their craft, without creating an account.

Garment construction, sizing, gauge, and fit are not part of this product era.

## Positioning

One local Studio workflow that keeps framing, chart generation, hand editing, owned-yarn color matching, and export together — without sending photos or charts off the device, and in the chart conventions of the chosen craft.

Neighboring tools either generate garment patterns without this photo-to-stitch loop, or leave color matching and export as disconnected manual steps. Yarnlane's claim is the focused, private, on-device image-to-chart loop.

## Operating Context

- Used on desktop, tablet, or phone in a browser; installable as a PWA.
- Knitter or Stitcher starts a Pattern Project and picks its craft, then either selects a device photo — crop/rotate, set stitch grid and color count, generate — or starts from a blank grid; edits the Colorwork Chart by palette and by cell, confirms Yarn Inventory matches, and exports PDF/PNG (Share/Save when the OS supports them; download otherwise).
- Pattern Projects and Yarn Inventory live only on that device/browser; Yarn Inventory is shared across projects on the same device.
- Working from the chart — knitting or stitching — may happen on paper, tablet, or phone; the export is the handoff into that ritual.
- Domain language is fixed in `CONTEXT.md` (Knitter, Stitcher, Craft, Pattern Project, Colorwork Chart, Chart Cell, Yarn Inventory, Yarn Color, Color Match, Knit-ready Pattern, Stitch-ready Pattern).

## Capabilities and Constraints

Confirmed for this era:

- Create a Pattern Project without an account.
- Choose the craft — knitting or cross-stitch — when the Pattern Project is created; exports follow that craft's chart conventions.
- Start a chart from a blank grid instead of a photo.
- Edit individual chart cells by hand, with undo/redo.
- Local drafts: autosave, reopen, rename, duplicate, delete.
- Source images from the device; JPEG/PNG/WebP guaranteed; HEIC/HEIF best-effort.
- Framing (crop/rotate), detail and dimension controls, 2–50 color palettes, chart regeneration with progress and confirmation over manual palette edits.
- Sample colors from the original photo (tap the preview, or system eyedropper where supported) when adding or replacing palette entries.
- Color key with symbols, labels, stitch counts; global replace/merge; undo/redo for palette edits.
- Yarn Inventory entry and perceptual Color Match suggestions that require confirmation (quantity is informational only).
- Export PDF and PNG with chart and color key in the craft's conventions (Knit-ready Pattern or Stitch-ready Pattern); capability-detected Share/Save with download fallback.
- App shell usable offline after install/caching for saved local projects.
- Clear notice that local data is not synchronized or backed up.

Explicitly deferred:

- Accounts, cloud sync, collaboration, sharing links.
- Pricing, subscriptions, payments.
- Public catalogs, marketplaces, community.
- Manufacturer yarn catalogs and commerce.
- Native mobile applications.
- Analytics that upload source images or chart contents.
- Background removal, AI segmentation, multi-image charts.
- Manufacturer thread catalogs (DMC, Anchor) and their color numbers.
- Fabric-count sizing, finished-dimension calculation, and floss or skein estimation.
- Fractional stitches, backstitch, and French knots.
- Changing a Pattern Project's craft after it is created.
- Server-side image processing.

Undecided (do not invent): future sync/accounts migration path; broader audiences beyond the confident beginner and the cross-stitch Stitcher; whether **Yarn Inventory** keeps its knitting-specific name, gains a craft-neutral one, or gains a cross-stitch sibling.

## Brand Commitments

- Product name in the shipped UI and PWA: **Yarnlane**.
- Voice and terminology follow `CONTEXT.md` (prefer Knitter and Stitcher over user/customer/maker; Pattern Project, Colorwork Chart, Yarn Inventory as defined there).
- Repository folder name Knit-Pro and package name `loomancer` are engineering labels, not product brand.

## Evidence on Hand

- Domain vocabulary: `CONTEXT.md`
- MVP product decisions: `.scratch/knit-mvp/` (especially target knitter, boundaries) and `.scratch/image-to-chart-mvp/spec.md`
- Architecture: `docs/adr/0001-local-first-pattern-projects.md`
- Competitor research (Dreamknit): `docs/research/` — for positioning context only; not claims to copy into marketing without fresh evidence
- Incumbent UI and design system: running app under `src/`, `DESIGN.md`

Absences future work must not fabricate: testimonials, customer logos, benchmarks, pricing, licensing claims, or cloud/backup guarantees.

## Product Principles

1. **Local-first privacy is product truth** — photos, charts, and Yarn Inventory stay on the device for this era; say so plainly where it matters.
2. **Serve the confident beginner’s chart job** — image or blank grid to ready-to-work Colorwork Chart; do not expand into garment construction or gauge/fit.
3. **Owned yarn over generated fashion** — Color Matches suggest; the Knitter confirms; quantity never claims sufficiency for an unknown garment.
4. **One Studio loop, not a disconnected toolchain** — framing, generation, palette/yarn edits, cell edits, and export belong together.
5. **Use the product’s language** — Knitter, Stitcher, Pattern Project, Colorwork Chart, Yarn Inventory; avoid file/design/stash metaphors.
6. **A chart speaks its craft's conventions** — a chart read in the wrong direction is a wrong chart, so craft drives numbering, counting lines, and reading guidance.

## Accessibility & Inclusion

Product-required for this era: keyboard-accessible Studio controls, and text alternatives so chart/key information is never color-alone (symbols, labels, stitch counts, canvas text alternative).

A formal WCAG level (e.g. 2.2 AA) was not locked as a compliance target; treat the above as the minimum bar until a standard is explicitly adopted.
