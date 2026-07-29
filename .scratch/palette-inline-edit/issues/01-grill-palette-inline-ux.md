# 01 — Grill palette inline UX

Type: grilling  
Status: resolved  
Blocked by: —

**What to decide:** How the Studio color key should add and change colors after collapsing the separate Add/Edit cards into the Palette panel.

## Prompt

Change the colour update system: a `+` button top-right of the colour palette to add a new color, and an edit control at the end of each color row for changing that color.

## Process

Impeccable `shape` (Operate) + grilling — one decision at a time with recommended answers. Facts taken from `src/ui/ColorKeyPanel.tsx` and PRODUCT/DESIGN.

## Answer

Locked decisions (also in [spec.md](../spec.md)):

1. **Row click** selects for paint; **trailing Edit** opens the color picker only — split affordances.
2. **No separate Edit card** and **no separate Add card** — everything for add/edit/merge/matches lives in the **Palette** panel.
3. **`+` top-right** opens a picker first; on confirm, append + select for paint; does not rewrite existing cells; disabled at max colors with full hint.
4. **Edit picker** applies on commit (global replace); overrides set label to **Custom color** (or clear yarn claim).
5. **Merge** = quiet row action when >1 color; **yarn matches** under the selected row, confirm-to-apply.
6. **Yarn Inventory** form/list remain below Palette.

Open (non-blocking chrome): merge control pattern; similar-pair warning placement; Edit icon vs text.

## Comments

- 2026-07-29 — Owner accepted recommendations on Q1–Q4 and asked decisions written for future agents.
