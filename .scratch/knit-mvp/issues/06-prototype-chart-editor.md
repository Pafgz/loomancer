# Prototype the Chart Editor

Type: prototype
Status: resolved
Blocked by: 04, 05

## Question

Does a single-screen workspace with image controls, editable stitch chart, palette, owned-yarn matches, and export action make the core workflow understandable and efficient?

## Answer

Yes. The throwaway [chart editor prototype](../prototype/chart-editor-prototype.html) compares three structures via `?variant=A`, `?variant=B`, and `?variant=C`.

Use **Variant A — Studio** as the MVP's information architecture:

- image and pixelization controls remain in a left rail;
- the Colorwork Chart receives the largest central area;
- the color key and Yarn Inventory matches remain visible in a right rail;
- undo, redo, and export are persistent header actions.

This structure most directly satisfies the requirement to keep the color chart at the side while the Knitter judges image detail and replacements. On narrower screens, the rails stack into a single-column sequence without removing controls.

Variant B adds unnecessary step navigation for an iterative workflow. Variant C over-prioritizes Yarn Inventory before the image-derived chart exists.

The prototype is deliberately throwaway and must not be promoted directly into production.
