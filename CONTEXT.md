# Pattern Creation

This context describes the language used to turn an image — or a blank grid — and a set of available colors into an editable chart for the Craft the person works in.

## Language

**Knitter**:
The person designing and making a knitted piece with the product.
_Avoid_: User, customer, maker

**Stitcher**:
The person designing and making a cross-stitch piece with the product. Distinct from Knitter because the two read charts by different conventions.
_Avoid_: User, customer, maker, crafter

**Craft**:
Whether a Pattern Project is knitting or cross-stitch. Chosen when the project is created, and what decides the chart conventions its export follows.
_Avoid_: Mode, type, discipline

**Pattern Project**:
The editable design that combines a Craft, an optional source image, image-processing choices, a Colorwork Chart, and selected yarn colors.
_Avoid_: Design, document, file

**Colorwork Chart**:
A grid representation in which each Chart Cell identifies the color to work at that position — a stitch for a Knitter, a cross for a Stitcher.
_Avoid_: Pixel art, image, graph

**Chart Cell**:
One square of a Colorwork Chart: a single position that carries exactly one color and can be edited on its own.
_Avoid_: Pixel, square, box, tile

**Yarn Inventory**:
The colors and optional quantities a Knitter or Stitcher records as already owned and available for Pattern Projects.
_Avoid_: Stash, palette, stock
_Note_: The name is knitting-specific and its future is undecided — see Undecided below. Keep using it verbatim until that is settled.

**Yarn Color**:
A named color entry in Yarn Inventory, with a required display color and optional manufacturer and quantity details.
_Avoid_: Swatch, palette color, SKU

**Color Match**:
A suggested relationship between a Colorwork Chart color and a perceptually similar Yarn Color that the Knitter or Stitcher may accept or reject.
_Avoid_: Automatic replacement, exact match

**Knit-ready Pattern**:
The exported Colorwork Chart and color key sufficient for the target Knitter to use the motif in their own knitting project.
_Avoid_: Export, PDF, recipe
_Note_: Names the knitting export only. Cross-stitch exports have no approved name yet — see Undecided below.

## Undecided

Do not invent answers to these; raise them instead.

- Whether **Yarn Inventory** keeps its knitting-specific name, gains a craft-neutral one, or gains a cross-stitch sibling concept.
- What the cross-stitch counterpart of **Knit-ready Pattern** is called.
- Whether an umbrella noun covering both Knitter and Stitcher should exist. There is none today, and _maker_ is explicitly avoided, so write "Knitter or Stitcher" rather than reaching for a collective term.
