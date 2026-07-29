# Palette inline add / edit — wayfinding map

## Destination

A confirmed UX brief for collapsing palette add/edit into the Palette panel (row select + trailing edit + header `+`), then an implementable ticket.

## Notes

- Product: [`PRODUCT.md`](../../PRODUCT.md)
- Design system: [`DESIGN.md`](../../DESIGN.md) (Color Key Row; Operate / Studio)
- Domain: [`CONTEXT.md`](../../CONTEXT.md)
- Related shipped work: [`.scratch/image-to-chart-mvp/issues/04-edit-colors-with-yarn-inventory.md`](../image-to-chart-mvp/issues/04-edit-colors-with-yarn-inventory.md)
- Spec: [spec.md](./spec.md)
- Impeccable surface brief: `.impeccable/surfaces/` → `src/ui/ColorKeyPanel.tsx`

## Decisions so far

- [Grill palette inline UX](issues/01-grill-palette-inline-ux.md) — Row selects for paint; trailing control opens color picker; `+` adds via picker-first; no separate Edit/Add cards; merge + yarn matches stay in Palette panel.

## Not yet specified

- Exact merge control chrome (quiet icon vs overflow menu vs select-on-row)
- Whether the indistinguishable-pair warning block stays visually as today (behavior stays)
- Microcopy for disabled `+` / custom-color label (defaults proposed in spec)

## Out of scope

- Changing `MAX_CHART_COLORS` (still 12)
- Changing merge/replace/add semantics in `src/chart/palette-edits.ts` beyond wiring
- Yarn Inventory CRUD redesign (form stays below Palette)
- Chart viewport paint toolbar redesign
