import { describe, expect, it, vi } from "vitest";
import { drawColorworkChart } from "./draw-colorwork-chart";

describe("drawColorworkChart", () => {
  it("paints one rectangle per stitch", () => {
    const fillRect = vi.fn();
    const fillText = vi.fn();
    const context = {
      clearRect: vi.fn(),
      fillRect,
      fillText,
      set fillStyle(_value: string) {},
      set textAlign(_value: string) {},
      set textBaseline(_value: string) {},
      set font(_value: string) {},
    } as unknown as CanvasRenderingContext2D;

    drawColorworkChart(context, {
      width: 2,
      height: 2,
      cells: [0, 1, 1, 0],
      palette: [
        { index: 0, hex: "#112233", symbol: "A", stitchCount: 2 },
        { index: 1, hex: "#ddeeff", symbol: "B", stitchCount: 2 },
      ],
    });

    // Backdrop + 4 cells
    expect(fillRect).toHaveBeenCalledTimes(5);
    expect(fillText).toHaveBeenCalledTimes(4);
  });

  it("skips symbols when showSymbols is false", () => {
    const fillText = vi.fn();
    const context = {
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      fillText,
      set fillStyle(_value: string) {},
      set textAlign(_value: string) {},
      set textBaseline(_value: string) {},
      set font(_value: string) {},
    } as unknown as CanvasRenderingContext2D;

    drawColorworkChart(
      context,
      {
        width: 2,
        height: 1,
        cells: [0, 1],
        palette: [
          { index: 0, hex: "#112233", symbol: "A", stitchCount: 1 },
          { index: 1, hex: "#ddeeff", symbol: "B", stitchCount: 1 },
        ],
      },
      { showSymbols: false },
    );

    expect(fillText).not.toHaveBeenCalled();
  });
});
