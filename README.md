# Yarnlane

Local-first browser Studio that turns a motif photo — or a blank grid — into an editable **Colorwork Chart** with a color key, matched against your **Yarn Inventory**, then exported for knitting or cross-stitch.

Photos, charts, and inventory stay on the device. No account required for this product era.

> Engineering labels: repo folder `Knit-Pro`, package name `loomancer`. The product name in the UI is **Yarnlane**.

## Requirements

- Node.js 20+ (or current LTS)
- npm

## Setup

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Serve the production build |
| `npm test` | Run Vitest once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run typecheck` | TypeScript check only |

## What it does

- Create a **Pattern Project** and choose craft (knitting or cross-stitch)
- Frame a device photo or start from a blank grid
- Generate and hand-edit the Colorwork Chart (palette + cell paint, undo/redo)
- Confirm Yarn Inventory color matches
- Export PDF / PNG (Share/Save when the OS supports them)

Not in this era: accounts, cloud sync, garment construction, gauge/fit, or manufacturer yarn catalogs.

## Docs

- Product intent: [`PRODUCT.md`](PRODUCT.md)
- Visual system: [`DESIGN.md`](DESIGN.md)
- Domain language: [`CONTEXT.md`](CONTEXT.md)
- Local-first ADR: [`docs/adr/0001-local-first-pattern-projects.md`](docs/adr/0001-local-first-pattern-projects.md)
