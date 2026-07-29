# Palette inline add / edit

Status: implemented (grilling + impeccable shape + ColorKeyPanel refactor).

Canonical decisions: [spec.md](./spec.md)  
Wayfinding: [map.md](./map.md)

## For agents

Read **spec.md** before changing `src/ui/ColorKeyPanel.tsx` or related palette UX. Do not revive the separate **Add color** or **Edit {symbol}** cards unless this spec is explicitly superseded.

Implementation: `src/ui/ColorKeyPanel.tsx` — one Palette card with header `+`, row select, trailing Edit, selected-row merge/matches; Yarn Inventory below.
