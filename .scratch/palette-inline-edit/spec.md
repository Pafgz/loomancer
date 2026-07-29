# Palette inline add / edit — design brief

Status: decisions locked pending one confirmation pass  
Mode: **Operate** (Studio color key)  
Visitor: Knitter / Stitcher editing a Colorwork Chart in the Studio Colors / color-key column  
Primary target: `src/ui/ColorKeyPanel.tsx`

## Job and audience

A confident beginner is matching and tuning chart colors against yarn they own. They need to **select a color to paint**, **change a color’s hex**, and **add a new key entry** without hunting through separate Add/Edit cards.

## Outcome and proof

Success: from the **Palette** panel alone they can add a color (`+`), select a row for paint, change a color via a trailing control, merge when needed, and confirm yarn matches — with symbols/labels/counts still never color-alone.

Product-specific truth: owned-yarn matches suggest; knitter confirms; quantity stays informational; palette stays 2–12 colors.

## Selected direction

**Visual authority:** preserve incumbent Yarnlane Studio (`DESIGN.md`) — paper/surface panels, Color Key Row geometry, indigo for selection/focus only, ghost/icon row actions.

**Interaction thesis:** one Palette composition. Selection and color-change are **separate affordances on the same row**. Add lives in the panel header, not a second card.

**Sequence / focal moment:** open Colors → see key → `+` or row Edit when needed → paint on chart.

**Implementation consequence:** remove the standalone **Add color** and **Edit {symbol}** cards; fold those controls into the Palette card. Keep calling existing `onAddPaletteColor` / `replaceChartColor` / `mergeChartColors` / yarn-match apply.

## Scope and boundaries

- **Fidelity:** production Studio UI refinement (not a new visual world).
- **Breadth:** Color Key / Palette panel interaction only.
- **Untouched:** chart generation, undo/redo stack semantics, Yarn Inventory form below, export key rendering, max color count.
- **Anti-goals:** no second Edit panel; no Edit-as-only-select; no auto-apply yarn matches; no decorative accent hues on chrome.

## States and ranges

- Palette size: up to `MAX_CHART_COLORS` (12). At full: `+` disabled + short full hint.
- Empty suggestions: keep muted “Add Yarn Colors…” under the selected row.
- Similar pairs: keep warn-and-offer-merge (placement may stay below Palette; do not auto-merge).
- Selection: `selectedIndex === null` means Pan — no row highlighted (current Studio contract).

## Locked decisions (grilling 2026-07-29)

| # | Decision | Detail |
|---|----------|--------|
| D1 | Split select vs edit | **Row tap/click** = select for painting (`aria-pressed`, paint arm). **Trailing control** = open color picker for that entry only. Edit must not be the only way to select. |
| D2 | Kill separate Edit card | The dedicated **Edit {symbol}** card goes away. Edit affordances live **inside the Palette panel**. |
| D3 | Kill separate Add card | The dedicated **Add color** card goes away. Add is a **`+` control at the top-right of the Palette** header. |
| D4 | `+` flow | `+` **opens a color picker first**. On confirm: append entry, select it for paint, **do not** rewrite existing cells (same as today’s add). |
| D5 | Full palette | When full, **disable `+`** and show the short “Palette is full (N colors)” hint. |
| D6 | Edit apply | Trailing picker: **apply on color commit** (native `change`) via global replace for that index. |
| D7 | Custom override label | If the knitter overrides via the picker, set label to **“Custom color”** (or clear yarn name) so a prior yarn match is not falsely claimed. |
| D8 | Merge stays | **Merge** remains available as a **quiet row action** when there is more than one palette color (exact chrome open — see below). |
| D9 | Yarn matches stay | Ranked matches appear **under the selected row** (or directly under the list, scoped to selection). Still **confirm-to-apply**; quantity informational only. |
| D10 | Yarn Inventory | Inventory **add form / list stay below** Palette as today — not redesigned in this effort. |

## Interaction and layout (intent)

1. **Palette header:** title “Palette” left; icon-button `+` right (`aria-label` e.g. “Add palette color”).
2. **Rows:** swatch + symbol + name + stitch count; trailing **Edit** control opens color input/picker for that row.
3. **Selected row:** indigo/selected treatment per DESIGN.md; yarn-match list for that entry.
4. **Merge:** quiet secondary control on the row or adjacent; must not compete with select or Edit.
5. **Feedback:** chart + key update immediately on add/replace/merge/match confirm; existing undo/redo continues to cover palette chart snapshots.

## Constraints

- Accessibility: keyboard operable; every color still has symbol + label + count; icon buttons need `aria-label`; touch targets follow `pointer: coarse` sizing in DESIGN.md.
- Platform: web / PWA Studio.
- Engine: reuse `src/chart/palette-edits.ts`; do not invent new merge/replace semantics.

## Open decisions (implementer must not invent silently)

1. Merge control pattern: overflow menu vs inline “merge into” select vs icon that reveals select.
2. Whether indistinguishable-pair warning UI moves or stays as a sibling block under Palette.
3. Whether the trailing Edit is a visible text “Edit” or an icon-only button (icon-only requires a clear label).

Defaults if unblocked without further grilling: icon-only Edit with `aria-label` “Change color for {symbol}…”; merge as a small “Merge into” select revealed for the selected row only; similar-pair warning stays as sibling block.

## Confirmation

Owner accepted D1–D10 in grilling. Spec is the source of truth for agents until superseded.
