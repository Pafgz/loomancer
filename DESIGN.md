---
name: Yarnlane
description: Local-first knitting companion — make a Colorwork Chart, then keep your place while knitting.
colors:
  accent-indigo: "#4f46e5"
  accent-indigo-dark: "#7c7bff"
  accent-ink: "#ffffff"
  accent-soft: "#eef0fe"
  paper: "#f1f3f7"
  surface: "#ffffff"
  surface-raised: "#f7f8fb"
  chart-canvas: "#e9ecf3"
  ink: "#1a1d23"
  ink-muted: "#656b78"
  hairline: "#e2e5ec"
  hairline-strong: "#cbd0da"
  clay-danger: "#b4472e"
  clay-danger-soft: "#fbe9e3"
  amber-warn: "#92400e"
  amber-warn-soft: "#fbf0dd"
  chart-symbol-ink: "rgb(0 0 0 / 0.78)"
  chart-symbol-ink-light: "#ffffff"
  swatch-hairline: "rgb(0 0 0 / 0.15)"
  symbol-shadow: "rgb(0 0 0 / 0.85)"
  symbol-shadow-soft: "rgb(0 0 0 / 0.55)"
  night-paper: "#0d1017"
  night-surface: "#161a22"
  night-surface-raised: "#1c212b"
  night-chart-canvas: "#10141c"
  night-ink: "#e7eaf0"
  night-ink-muted: "#98a0b0"
  night-hairline: "#262c38"
  night-hairline-strong: "#333b4a"
typography:
  root:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  title:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 650
    lineHeight: 1.5
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "normal"
  item-title:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 650
    lineHeight: 1.5
    letterSpacing: "normal"
  brand-tile:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "normal"
  small:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "normal"
  caption:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "0.7rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0.1em"
  mono:
    fontFamily: "ui-monospace, SF Mono, JetBrains Mono, Menlo, monospace"
    fontSize: "0.8rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "normal"
rounded:
  sm: "0.375rem"
  md: "0.625rem"
  lg: "1rem"
spacing:
  sp-1: "0.25rem"
  sp-2: "0.5rem"
  sp-3: "0.75rem"
  sp-4: "1rem"
  sp-5: "1.5rem"
  sp-6: "2rem"
components:
  button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 {spacing.sp-4}"
    height: "2.25rem"
    typography: "{typography.body}"
  button-primary:
    backgroundColor: "{colors.accent-indigo}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.sm}"
    padding: "0 {spacing.sp-4}"
    height: "2.25rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.sm}"
    padding: "0 {spacing.sp-4}"
    height: "2.25rem"
  button-touch:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    height: "2.75rem"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 0.65rem"
    height: "2.25rem"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "{spacing.sp-4}"
  panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    padding: "{spacing.sp-5}"
  chart-stage:
    backgroundColor: "{colors.chart-canvas}"
    textColor: "{colors.ink}"
    padding: "{spacing.sp-4}"
  color-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "{spacing.sp-2} {spacing.sp-3}"
    height: "2.75rem"
  color-row-selected:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
---

# Design System: Yarnlane

## Overview

**Creative North Star: "The Knitter's Workbench"**

Yarnlane is a workbench, not a showroom. The Colorwork Chart is the work; every
other surface is bench, jig, and tool rail around it. That single idea decides
almost everything: the app chrome is desaturated slate and paper, the panels sit
quietly on either side, and the only place saturated color is allowed to shout
is the chart itself and the yarn swatches that feed it. A knitter who looks up
mid-row should be able to find the chart instantly, because nothing else in the
frame is competing for that attention.

The density is a tool's density, not a marketing page's. Controls are 2.25rem
tall for a mouse and 2.75rem for a thumb, panels use a 0.25rem-based spacing
scale, and labels are small uppercase slugs rather than headings. This is a
surface people keep open for an hour while their hands are busy — it earns
attention by being legible and predictable, not by being expressive.

Light and dark are both composed, not inverted: the dark theme moves to a
blue-black paper (`night-paper`) with a lifted surface stack and a brighter
periwinkle accent so the accent still reads against the darker ground. Neither
theme tints its neutrals toward the accent; the chart supplies the color.

**Key Characteristics:**

- Slate-and-paper neutrals; one indigo accent, used sparingly
- Chart canvas is a distinct, slightly darker plane than the panels
- Small radii (0.375–1rem), 1px hairlines, no decorative flourish
- Input-aware sizing: denser for pointers, thumb-sized for touch
- Every chart signal carries a symbol as well as a color

## Colors

A cool slate-and-paper neutral field with a single indigo accent, held in
reserve so the chart's own palette is always the loudest thing on screen.

### Primary

- **Studio Indigo** (`accent-indigo`): The one action color. Primary buttons
  ("New Pattern Project", "Export"), focus rings, selected color rows, active
  tab, framing-dirty hints. In dark mode it lifts to **Periwinkle Signal**
  (`accent-indigo-dark`) so it stays legible on near-black paper.
- **Indigo Wash** (`accent-soft`): The quiet half of the accent — selected color
  rows, active tab background, file-picker hover. Never used for text.

### Neutral

- **Cool Paper** (`paper`): App background and the ground under Studio panels.
- **Card White** (`surface`): Raised surfaces — header, cards, project cards,
  the export panel, the chart viewport stage.
- **Bench Grey** (`surface-raised`): Recessed or secondary fills — hover states,
  the storage notice, the file picker.
- **Chart Canvas** (`chart-canvas`): Reserved for the chart stage only. It is
  deliberately a shade darker than the panels so the chart plane reads as a
  different material.
- **Graphite Ink** (`ink`): Primary text.
- **Slate Muted** (`ink-muted`): Secondary text, uppercase labels, ghost button
  rest state, stitch counts.
- **Hairline** / **Hairline Strong** (`hairline`, `hairline-strong`): Dividers
  and grid gutters / control borders and dashed drop zones.

### Chart ink (fixed, theme-independent)

These sit on knitter-chosen yarn colors, so they are pure black and white with
opacity rather than theme tokens — they must work on any hue in any theme.

- **Symbol Ink** (`chart-symbol-ink`): Stitch symbols drawn over a chart cell.
- **Symbol Ink Light** (`chart-symbol-ink-light`) with **Symbol Shadow**
  (`symbol-shadow`, `symbol-shadow-soft`): The color-key swatch symbol — white
  glyph with a double dark shadow so it survives a pale yarn as well as a dark
  one.
- **Swatch Hairline** (`swatch-hairline`): The 1px edge on a color swatch, so a
  near-white yarn still reads as a swatch on a white card.

### Tertiary (semantic)

- **Kiln Clay** (`clay-danger`) on **Clay Wash** (`clay-danger-soft`): Validation
  and storage failures.
- **Burnt Amber** (`amber-warn`) on **Amber Wash** (`amber-warn-soft`): The
  similar-colors warning in the color key. Darkened from the original amber
  specifically so warning text clears 4.5:1 on its own wash, not just on white.

### Named Rules

**The Chart Owns the Color Rule.** UI chrome stays slate, paper, and one indigo.
Any additional hue on screen must come from the knitter's chart palette or their
Yarn Inventory — never from decoration.

**The Symbol Companion Rule.** No chart or key information is carried by color
alone. Every palette entry ships a symbol, and the chart canvas exposes a text
alternative naming symbol, label, and stitch count.

## Typography

**Body Font:** Inter (with the system sans stack as fallback)
**Label/Mono Font:** ui-monospace / SF Mono / JetBrains Mono for chart symbols

**Character:** One neutral grotesque doing all the work, differentiated by
weight and size rather than by family. The only second voice is the monospace
used for stitch symbols, where it earns its place as data, not as costume.

### Hierarchy

- **Title** (650 weight, 1.15rem, -0.01em): Project name in the header. The
  largest type in the app — there is no display tier, on purpose.
- **Item title** (650 weight, 1rem): Project name on a project card — the one
  step between title and body.
- **Body** (500 weight, 0.875rem): Buttons, inputs, controls, list rows. The
  root size is 16px; body steps down from it rather than the other way around.
- **Small** (400–500 weight, 0.8–0.85rem): Hints, export status, storage notice.
- **Caption** (500 weight, 0.75rem): Stitch counts under a color-key name.
  Tabular numerals wherever counts appear.
- **Label** (600 weight, 0.7rem, 0.1em tracking, uppercase): Section slugs —
  "FRAMING", "COLOR KEY", "PDF", and the "YARNLANE" brand line over the title.
- **Mono** (700 weight, 0.8rem): Chart symbols in cells and key swatches only.

### Named Rules

**The No Display Type Rule.** Nothing in the app is larger than 1.15rem. A
workbench does not need a hero headline; if something needs emphasis, it gets
weight or an uppercase label, not size.

## Layout

The Studio is a three-column grid — controls (15–20rem), chart (flexible,
18rem min), color key (16–21rem) — separated by 1px gutters created by a
grey grid background rather than borders. Between 64rem and 80rem the side
columns tighten (13–18rem) so the chart keeps room. The home screen is a
centered 64rem column of auto-filling project cards at `min(100%, 15rem)`.

The Studio shell fills `100dvh` and scrolls inside panes; home scrolls the
page. Safe-area insets pad the sticky header and the mobile tab bar.

Below 64rem the three columns become one full-height pane at a time behind a
fixed bottom tab bar (Framing / Chart / Colors), which is also where the layout
switches from three landmarks to a real ARIA tab set. Below 40rem the header
stacks, actions go full width, framing fields and palette tools stack, and
panel padding tightens. Below 30rem height (phone landscape / split view) the
chart stage min-height and chrome padding compress so the chart stays usable.

Spacing runs on a 0.25rem scale (`sp-1` … `sp-6`); panels use `sp-5` (or `sp-4`
when space is tight), cards and field groups use `sp-4`, control clusters use
`sp-2`.

Touch sizing is decided by `pointer: coarse`, not by width — a touchscreen
laptop gets 2.75rem controls at desktop widths, and a mouse keeps the dense
2.25rem rail on a small window.

### Named Rules

**The Chart Never Scrolls Away Rule.** The chart stage owns its own overflow and
fits to the viewport; panels scroll, the chart pans and zooms in place.

## Elevation & Depth

Structural, not ambient. Shadows exist to say "this is a separate layer you can
act on": raised cards, the chart viewport plane, and the export popover. Flat
regions — panels, the chart stage background, tab bars — get their depth from
tonal steps in the neutral ramp plus 1px hairlines instead.

### Shadow Vocabulary

- **Resting layer** (`0 1px 2px rgb(15 23 42 / 0.06), 0 1px 3px rgb(15 23 42 / 0.08)`):
  Cards, project cards, the chart viewport stage.
- **Lifted layer** (`0 4px 12px rgb(15 23 42 / 0.08), 0 2px 4px rgb(15 23 42 / 0.06)`):
  Popovers (export panel), the chart grid itself, card hover.
- **Focus ring** (`0 0 0 3px` accent at 40%): The only non-shadow use of
  `box-shadow`; it replaces the outline everywhere.

Dark mode uses the same two roles at higher opacity against near-black rather
than reusing the light values.

### Named Rules

**The Structural Shadow Rule.** If removing the shadow does not change what a
knitter believes they can click or drag, remove it.

## Shapes

Small, consistent radii: 0.375rem for controls and swatches, 0.625rem for cards,
panels, and popovers, 1rem for the empty state. Borders are 1px hairlines;
1.5px dashed hairline-strong marks drop zones and the empty state — the only
dashed edges in the system. The chart grid clips its canvas to a 0.625rem
rounded rectangle, which is the one place a shape reads as a physical object.

The brand mark is two interlocking stockinette "V" strokes in a rounded-square
indigo tile — the same geometry the chart draws, at logo scale.

## Components

### Buttons

- **Shape:** Slightly rounded (0.375rem), 1px `hairline-strong` border.
- **Default:** White surface, graphite ink, 2.25rem tall, 1rem side padding —
  2.75rem tall on coarse pointers.
- **Primary:** Indigo fill, white ink, same geometry. One primary per view.
- **Ghost:** Transparent with no border, muted ink; fills with `surface-raised`
  and darkens to full ink on hover. Used for destructive and secondary row
  actions so they stay quiet until sought.
- **Icon:** Square 2.25rem (2.75rem on touch), always with an `aria-label`.
- **States:** 0.12s background/border/shadow transition, 1px press translate,
  0.5 opacity when disabled, accent focus ring on `:focus-visible`.

### Cards / Containers

- **Corner Style:** 0.625rem.
- **Background:** `surface` on the `paper` field.
- **Shadow Strategy:** Resting layer at rest, lifted layer plus an indigo border
  on hover (project cards only).
- **Border:** 1px `hairline`.
- **Internal Padding:** `sp-4`, with `sp-3`/`sp-4` asymmetry on project cards.

Cards are containers for interaction (a project you open, a panel you edit).
Static content uses a plain panel with an uppercase label instead.

### Inputs / Fields

- **Style:** Full-width, 1px `hairline-strong`, 0.375rem radius, white fill,
  tabular numerals, 2.25rem tall (2.75rem on coarse pointers).
- **Focus:** Border shifts to indigo plus the 3px accent ring.
- **Error:** Message block in `clay-danger` on `clay-danger-soft` with a 1px
  mixed-clay border and a `⚠` glyph, rendered as `role="alert"`.
- **Field labels:** 0.8rem, 600 weight, muted — above the control, `sp-2` gap.

### Navigation

The Studio tab bar only exists below 64rem: fixed to the bottom, blurred
translucent surface, 1px top hairline, safe-area padding, 2.75rem targets. The
active tab is `accent-soft` fill with indigo text; inactive tabs are muted with
no border. Above 64rem the same three regions are simultaneous landmarks and the
bar is removed entirely.

### Chart Viewport (signature)

The defining component. A canvas-rendered chart inside a bordered, shadowed
stage on the `chart-canvas` plane, with a toolbar of Fit / zoom / symbols /
fullscreen above it. Pan and zoom mutate a CSS transform through refs so
dragging never re-renders React. It is keyboard-operable as a focusable group:
arrows pan, Shift+arrow pans faster, `+`/`-` zoom, `0` refits, and the canvas
carries a text alternative describing size, symbols, and stitch counts.

### Color Key Panel

A compact auto-fill swatch grid (2.5rem cells, 2.75rem on coarse pointers) with
the symbol overprinted on each fill. The palette header puts a **+** control at
the top right that opens the native color picker and adds the chosen color. The
selected color is summarized under the grid; Edit covers replace, merge, yarn
matches, and (when a photo exists) pick-from-photo. The chart paint bar scrolls
horizontally when the palette is long.

## Do's and Don'ts

### Do:

- **Do** keep the accent for action, focus, and selection only; the chart and
  the Yarn Inventory supply every other color on screen.
- **Do** pair every color signal with a symbol, label, or count.
- **Do** size controls by input method (`pointer: coarse` → 2.75rem), not by
  viewport width.
- **Do** use the uppercase 0.7rem label for section slugs and keep real headings
  at 1.15rem or below.
- **Do** give panels tonal separation and hairlines; reserve shadows for layers
  a knitter can act on.
- **Do** state local-storage truth plainly where it matters (the storage notice
  is part of the product, not chrome).

### Don't:

- **Don't** tint the neutrals toward indigo, or introduce a second accent hue.
- **Don't** put a card inside a card, or use a card where a labelled panel does
  the job.
- **Don't** add display-scale type, gradient text, or decorative glass; the only
  gradient in the system is the 2rem brand tile.
- **Don't** invert the light theme to produce dark mode — dark has its own
  surface stack and a brighter accent.
- **Don't** disable all motion for reduced-motion users by blanket-killing
  transitions; keep state changes legible and drop only movement.
- **Don't** let anything but the chart occupy the chart stage plane.
