# Palette inline add / edit

Status: decisions locked (grilling + impeccable shape); implementation not started.

Canonical decisions: [spec.md](./spec.md)  
Wayfinding: [map.md](./map.md)

## For agents

Read **spec.md** before changing `src/ui/ColorKeyPanel.tsx` or related palette UX. Do not revive the separate **Add color** or **Edit {symbol}** cards unless this spec is explicitly superseded.

Incumbent implementation today (pre-change): `src/ui/ColorKeyPanel.tsx` — list + separate Add/Edit cards.
