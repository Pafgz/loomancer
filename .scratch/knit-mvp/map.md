# Knit MVP Wayfinding Map

## Destination

Reached: a buildable specification and implementation tickets for the focused image-to-Colorwork-Chart MVP.

Next step: work [`.scratch/image-to-chart-mvp/`](../image-to-chart-mvp/) with fresh `/implement` sessions.

## Notes

- Domain: consumer knitting-pattern creation.
- Vocabulary: [`CONTEXT.md`](../../CONTEXT.md)
- Architecture: [`docs/adr/0001-local-first-pattern-projects.md`](../../docs/adr/0001-local-first-pattern-projects.md)
- Spec: [`.scratch/image-to-chart-mvp/spec.md`](../image-to-chart-mvp/spec.md)
- Dreamknit later backlog: [`docs/research/dreamknit-feature-list.md`](../../docs/research/dreamknit-feature-list.md)
- Browser research: [`docs/research/browser-pattern-generation.md`](../../docs/research/browser-pattern-generation.md)
- Prototype: [`prototype/chart-editor-prototype.html`](prototype/chart-editor-prototype.html)
- First release proves: upload image → choose chart resolution → generate constrained Colorwork Chart → replace colors using owned yarns → save/export the chart and color key.
- This map is closed for the current destination. Do not reopen for garment/parity features unless the destination is redrawn.

## Decisions so far

- [Audit Dreamknit's Public Product](issues/01-audit-dreamknit.md) — Dreamknit parity is deferred; owner feature list is the later backlog, and photo-pixelization remains Knit-Pro's differentiator.
- [Define the Target Knitter and MVP Journey](issues/02-define-target-knitter-and-journey.md) — Serve confident beginners with an image-to-Colorwork-Chart journey from upload through editable colors and export.
- [Define the Chart Output Contract](issues/03-define-knitting-output-contract.md) — Export a stitch-addressable, symbol-backed chart and color key as printable PDF or a high-resolution device/photo-library image.
- [Define Image-to-Chart Behavior](issues/04-define-image-to-chart-behavior.md) — Crop an image, tune live detail or exact grid dimensions, reduce to 2–12 colors, and globally edit colors with undoable palette operations.
- [Define Yarn Inventory and Substitution](issues/05-define-yarn-inventory-and-substitution.md) — Capture owned yarn manually, suggest perceptually close matches for confirmation, and apply global replacements without quantity claims.
- [Prototype the Chart Editor](issues/06-prototype-chart-editor.md) — Use a three-column Studio workspace with image controls left, the chart central, and the color key plus owned-yarn matches right.
- [Set MVP Product Boundaries](issues/07-set-mvp-product-boundaries.md) — Ship a responsive local-first PWA with on-device drafts and exports; defer accounts, cloud, payments, catalogs, and community.
- [Research Browser Pattern Generation](issues/08-research-browser-pattern-generation.md) — Local-first worker Canvas pipeline with Pica, Wu quantization, CIEDE2000 matching, IndexedDB, and capability-detected export/share.
- [Choose the MVP Architecture](issues/09-choose-mvp-architecture.md) — Four seams: Pattern Project model, worker image-to-chart engine, IndexedDB repository, and Studio UI; no backend for MVP.

## Not yet specified

These are later-product fog, not open blockers for the current destination:

- Deeper accessibility modes beyond WCAG-minded Studio defaults (voice-guided mode, left-handed chart mirroring, high-contrast crafting mode)
- Localization, moderation, and support expectations
- Cloud architecture and providers if accounts or sync are added later
- Which Dreamknit backlog items, if any, become a second destination after the MVP ships

## Out of scope

- Full Dreamknit feature parity for this effort; see [`docs/research/dreamknit-feature-list.md`](../../docs/research/dreamknit-feature-list.md)
- Garment construction, sizing, fit, gauge-aware instructions, and yarn-quantity claims
- Accounts, cloud sync, payments, catalogs, marketplace, community, and native apps
- AI text-to-pattern generation, 3D colorway visualization, stitch libraries, barcode scanning, and row-counter project management
- Further production implementation on this map — implement via [`.scratch/image-to-chart-mvp/`](../image-to-chart-mvp/)
