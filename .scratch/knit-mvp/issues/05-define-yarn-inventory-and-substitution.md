# Define Yarn Inventory and Substitution

Type: grilling
Status: resolved
Blocked by: 02, 03

## Question

How should knitters describe yarn they own, match it to chart colors, replace colors, and handle unknown brands, quantities, or insufficient yarn?

## Answer

Each Yarn Inventory entry requires:

- a knitter-defined name;
- a display color chosen with a color picker or hex value.

Brand, yarn line, manufacturer color code, notes, and quantity are optional. Manual entry is authoritative; the MVP does not depend on a maintained manufacturer catalog.

For each generated chart color, the editor suggests the closest available Yarn Inventory colors using a perceptual color-distance calculation. Suggestions show both swatches and a qualitative difference indicator; no substitution occurs without the Knitter's confirmation. The Knitter may instead pick any inventory color or choose a custom replacement color that is not in inventory.

Applying a replacement is global: every chart cell using the source color changes, and the color key, symbol assignment, and stitch counts update. The editor warns when two replacements become difficult to distinguish and offers to merge them, but never merges automatically.

Quantity is informational only in this MVP. Because the product does not know garment size or gauge, it does not claim that the Knitter owns enough yarn.
