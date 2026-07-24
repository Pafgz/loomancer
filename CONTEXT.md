# Knit Pattern Creation

This context describes the language used to turn a knitter's image and available yarn into an editable knitting pattern.

## Language

**Knitter**:
The person designing and making a sweater with the product.
_Avoid_: User, customer, maker

**Pattern Project**:
The editable design that combines a source image, image-processing choices, a Colorwork Chart, and selected yarn colors.
_Avoid_: Design, document, file

**Colorwork Chart**:
A stitch-grid representation in which each cell identifies the yarn color to knit at that position.
_Avoid_: Pixel art, image, graph

**Yarn Inventory**:
The yarn colors and optional quantities a knitter records as already owned and available for Pattern Projects.
_Avoid_: Stash, palette, stock

**Yarn Color**:
A named color entry in Yarn Inventory, with a required display color and optional manufacturer and quantity details.
_Avoid_: Swatch, palette color, SKU

**Color Match**:
A suggested relationship between a Colorwork Chart color and a perceptually similar Yarn Color that the Knitter may accept or reject.
_Avoid_: Automatic replacement, exact match

**Knit-ready Pattern**:
The exported Colorwork Chart and color key sufficient for the target Knitter to use the motif in their own knitting project.
_Avoid_: Export, PDF, recipe
