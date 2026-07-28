---
target: Studio / color draw
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
timestamp: 2026-07-27T18-32-11Z
slug: src-ui-studio-tsx
---
# Critique: Yarnlane Studio (`src/ui/Studio.tsx`)

Method: dual-agent (A: 52d2ed49-622f-4b10-ae2c-712a85f54767 · B: 837effc1-e94c-45b9-95f5-06f891246fbf)
Mode: Operate · Product: Yarnlane

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Paint mode status is SR-only; craft never shown; dual selection silent |
| 2 | Match System / Real World | 3 | Strong domain terms; hex-as-yarn-name breaks the metaphor |
| 3 | User Control and Freedom | 3 | Undo/Redo + Escape exit paint; merge still feels one-way |
| 4 | Consistency and Standards | 2 | Home "Yarnlane" vs Studio "Local Pattern Project"; two independent selected colors |
| 5 | Error Prevention | 2 | Merge and Replace apply immediately without confirm |
| 6 | Recognition Rather Than Recall | 2 | Must recall paint bar ≠ Color Key selection |
| 7 | Flexibility and Efficiency | 3 | Keyboard paint/pan/zoom exist; no visible shortcuts |
| 8 | Aesthetic and Minimalist Design | 2 | Duplicated swatches + always-on edit/inventory dilute workbench focus |
| 9 | Error Recovery | 3 | Undo after paint works; merge recovery relies on undo literacy |
| 10 | Help and Documentation | 1 | Paint/keyboard coaching only visually-hidden; no first-paint tip |
| **Total** | | **23/40** | **Acceptable** |

## Design Specificity Verdict

**LLM assessment:** Mixed — Yarnlane skeleton (chart stage, symbols, craft create, yarn-match confirm copy) wrapped in interchangeable indigo/Inter SaaS chrome. Studio eyebrow says "Local Pattern Project" instead of Yarnlane; dual generic selected-swatch UIs; hex-as-name rows. Swap the chart for pixels and it reads like a mid-tier image editor.

**Deterministic scan:** CLI `detect.mjs --json src/ui` → clean (`[]`, exit 0). Browser runtime detector found: low-contrast white-on-yarn swatches (2.1–2.8:1), hairline+wide-shadow, cramped padding, overused Inter, repeating-gradient. Most flagged as likely false positives for intentional chart/swatch affordances; low-contrast on mid-tone yarn symbols is the one worth watching.

**Visual overlays:** Injected successfully on Studio ([Human] tab). Yellow overlays highlighted paint swatches, chart viewport, and color-key area.

## Overall Impression

The Studio correctly centers the Colorwork Chart and does craft creation well — then abandons the Stitcher at the exact moment they need to hand-edit. The single biggest opportunity is unifying paint and Color Key into one selection model so "pick a color, place a stitch" is one action, not a memory puzzle.

## What's Working

1. **Chart as workbench hero** — distinct chart-canvas stage, fit/pan/zoom, symbols companion matches DESIGN.md.
2. **Craft-aware creation** — New Project knitting vs cross-stitch cards with convention hints and permanence warning.
3. **Confirm-before-yarn-match copy** — aligns PRODUCT local-first / owned-yarn principles.

## Priority Issues

### [P0] Dual color selection (paint bar ≠ Color Key)
**What:** `Studio.paintIndex` and `ColorKeyPanel.selectedIndex` are independent — paint can show ● while Edit shows □.
**Why it matters:** Primary Operate action becomes a memory trap; stitchers paint the "wrong" color or edit the wrong key entry.
**Fix:** One selected palette index owned by Studio. Color Key row click arms paint and edit together, or explicit Paint vs Edit modes with one highlighted swatch set.
**Suggested command:** `/impeccable shape color draw`

### [P1] Paint mode undiscoverable
**What:** Defaults to Pan; paint tips only in visually-hidden; no on-canvas coach.
**Why it matters:** First-timers never find the primary hand-edit path; blank-grid projects are stranded.
**Fix:** Default to first palette color on blank charts; visible one-line hint under paint bar; first-paint callout.
**Suggested command:** `/impeccable onboard chart paint`

### [P1] Studio identity / craft amnesia
**What:** Header brand line is "Local Pattern Project"; no knitting/cross-stitch indicator after create.
**Why it matters:** Violates brand commitment and craft principle — stitchers lose numbering-direction reassurance mid-session.
**Fix:** Eyebrow Yarnlane + craft chip ("Cross-stitch · top-left numbering") beside project title.
**Suggested command:** `/impeccable clarify studio header`

### [P2] Color Key always-on wall of actions
**What:** Palette + Replace + Merge + Add + Yarn matches + Inventory always visible.
**Why it matters:** Extraneous load for "I just want to paint this stitch."
**Fix:** Progressive disclosure — collapse Edit key / Yarn Inventory; keep palette + paint-linked selection primary.
**Suggested command:** `/impeccable distill color key`

### [P2] Destructive palette ops under-protected
**What:** Merge and Replace apply on change/click with no confirm.
**Why it matters:** High-stakes palette surgery feels cheaper than craft choice — inverted risk UX.
**Fix:** Confirm merge; soft confirm or preview for replace.
**Suggested command:** `/impeccable harden palette edits`

## Persona Red Flags

**Alex (Power User):** Two selection models block flow; no digit/letter shortcuts for palette; will rage-click both swatch strips.

**Jordan (First-Timer):** Lands on Pan; clicks Color Key expecting to paint; nothing paints; may hit Replace thinking it's "pick color." Abandons at step 2.

**Sam (A11y):** Keyboard paint path and SR status are real strengths. Sighted users get no visible mode chrome; small swatch symbol contrast may fail on mid tones.

**Confident beginner Knitter:** Dual selection + hex labels feel like image-editor jargon, not yarn. Framing still shouting while they only want to fix a stitch.

**Cross-stitch Stitcher:** Craft chosen once then vanishes. "Yarn Inventory" is knitting-coded. Numbering conventions not reinforced beside the grid while painting.

## Cognitive Load

6/8 checklist failures → **high** (critical). Decision points >4: paint bar (Pan + N swatches), chart toolbar (5), Edit block (Replace/Merge/Add + matches).

## Minor Observations

- Two horizontal chrome rows above the grid (toolbar + paint bar).
- Hex + counts as Color Key labels; prefer yarn names.
- "Different" match quality opaque without gloss.
- Brand mark on home, absent in Studio header.
- Wide layout shows Framing/Chart/Colors tab buttons that aren't a real tab set.

## Questions to Consider

1. If there can be only one selected color in Studio, is it a paint brush or a key editor — and why are both full UIs open at once?
2. Would a blank-grid Stitcher succeed if Framing were hidden until a photo is added?
3. What if Yarnlane refused to show a hex unless the knitter asked for it?
4. Should Pan be a modifier (Space/hold) rather than the default tool?
5. If craft can't change after create, why is it the only permanent decision that disappears from the chrome?
