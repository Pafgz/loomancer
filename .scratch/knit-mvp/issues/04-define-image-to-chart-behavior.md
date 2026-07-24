# Define Image-to-Chart Behavior

Type: grilling
Status: resolved
Blocked by: 02, 03

## Question

How should cropping, stitch-grid sizing, pixelization, palette reduction, preview, and regeneration behave from image upload to an editable color chart?

## Answer

1. The Knitter selects an image from device storage or a photo library.
2. They rotate and crop it to the region that should become the pattern. The crop's aspect ratio is free.
3. A live **detail slider** changes the target grid resolution. “Less detail” means fewer stitches and larger visual blocks; “more detail” means more stitches and finer blocks.
4. Exact stitch width and row height remain available as advanced inputs. Changing one preserves the crop aspect ratio by default; the Knitter can unlock it to set both.
5. The Knitter chooses a maximum palette size before generation. The default is six colors, with an MVP range of two to twelve.
6. Generation resamples the crop to the stitch grid, reduces it to no more than the chosen color count, and returns the Colorwork Chart plus side color key.
7. The preview updates after crop, resolution, or color-count changes. Expensive regeneration is debounced and displays progress without replacing the last valid chart.
8. In the side palette, the Knitter can replace a color globally, merge it into another chart color, or add a new replacement color. Every change updates all affected cells, symbols, and stitch counts immediately.
9. Regenerating after manual color edits requires confirmation because it replaces those edits; undo and redo cover palette edits.

The MVP does not require cell-by-cell drawing tools, background removal, AI semantic segmentation, or multiple images in one chart.
