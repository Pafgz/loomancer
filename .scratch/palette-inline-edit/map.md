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
- [Implement Palette inline add / edit](issues/02-implement-palette-inline-controls.md) — ColorKeyPanel collapsed to one Palette card; header `+`, trailing Edit, selected-row merge/matches; tests in `ColorKeyPanel.test.tsx` / `Studio.test.tsx`.

## Not yet specified

- Whether indistinguishable-pair warning block could be tucked into the Palette card (behavior stays)
- Microcopy polish beyond “Custom color” / full-palette hint

## Out of scope

- Changing `MAX_CHART_COLORS` (still 12)
- Changing merge/replace/add semantics in `src/chart/palette-edits.ts` beyond wiring
- Yarn Inventory CRUD redesign (form stays below Palette)
- Chart viewport paint toolbar redesign
