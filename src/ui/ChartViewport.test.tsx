import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { ColorworkChart } from "../domain/models";
import { ChartViewport } from "./ChartViewport";
import type { ChartCell } from "./chart-viewport-math";

const STAGE_RECT = { left: 20, top: 30, width: 400, height: 300 };

beforeAll(() => {
  // The stage measures itself and captures the pointer; jsdom does neither.
  if (!("ResizeObserver" in globalThis)) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
  Element.prototype.setPointerCapture = () => undefined;
  Element.prototype.releasePointerCapture = () => undefined;
  Element.prototype.getBoundingClientRect = function getRect(this: Element) {
    return {
      ...STAGE_RECT,
      right: STAGE_RECT.left + STAGE_RECT.width,
      bottom: STAGE_RECT.top + STAGE_RECT.height,
      x: STAGE_RECT.left,
      y: STAGE_RECT.top,
      toJSON: () => "",
    } as DOMRect;
  };
});

function chartOf(width: number, height: number): ColorworkChart {
  return {
    width,
    height,
    cells: new Array<number>(width * height).fill(0),
    palette: [
      { index: 0, hex: "#ffffff", symbol: "▲", stitchCount: width * height },
      { index: 1, hex: "#244b3c", symbol: "●", stitchCount: 0 },
    ],
  };
}

function stage() {
  return screen.getByRole("group", {
    name: /chart (paint area|pan and zoom area)/i,
  });
}

function drag(
  from: { x: number; y: number },
  to: { x: number; y: number },
  steps = 4,
) {
  const target = stage();
  fireEvent.pointerDown(target, {
    pointerId: 1,
    button: 0,
    clientX: STAGE_RECT.left + from.x,
    clientY: STAGE_RECT.top + from.y,
  });
  for (let step = 1; step <= steps; step += 1) {
    const t = step / steps;
    fireEvent.pointerMove(target, {
      pointerId: 1,
      clientX: STAGE_RECT.left + from.x + (to.x - from.x) * t,
      clientY: STAGE_RECT.top + from.y + (to.y - from.y) * t,
    });
  }
  fireEvent.pointerUp(target, { pointerId: 1 });
}

describe("ChartViewport painting", () => {
  it("paints one stitch per click as a single edit", () => {
    const onPaintCells = vi.fn<(cells: ChartCell[]) => void>();

    render(
      <ChartViewport
        chart={chartOf(20, 16)}
        activePaintIndex={1}
        onActivePaintIndexChange={() => undefined}
        onPaintCells={onPaintCells}
      />,
    );

    fireEvent.pointerDown(stage(), {
      pointerId: 1,
      button: 0,
      clientX: STAGE_RECT.left + 200,
      clientY: STAGE_RECT.top + 150,
    });
    fireEvent.pointerUp(stage(), { pointerId: 1 });

    expect(onPaintCells).toHaveBeenCalledTimes(1);
    expect(onPaintCells.mock.calls[0]![0]).toHaveLength(1);
  });

  it("reports a whole drag as one gap-free stroke", () => {
    const onPaintCells = vi.fn<(cells: ChartCell[]) => void>();

    render(
      <ChartViewport
        chart={chartOf(20, 16)}
        activePaintIndex={1}
        onActivePaintIndexChange={() => undefined}
        onPaintCells={onPaintCells}
      />,
    );

    drag({ x: 120, y: 120 }, { x: 280, y: 190 });

    expect(onPaintCells).toHaveBeenCalledTimes(1);
    const cells = onPaintCells.mock.calls[0]![0];
    expect(cells.length).toBeGreaterThan(2);

    // No stitch twice, and no jump between neighbours: a stroke, not dots.
    const keys = new Set(cells.map((cell) => `${cell.x},${cell.y}`));
    expect(keys.size).toBe(cells.length);
    for (let i = 1; i < cells.length; i += 1) {
      const previous = cells[i - 1]!;
      const current = cells[i]!;
      expect(
        Math.max(
          Math.abs(current.x - previous.x),
          Math.abs(current.y - previous.y),
        ),
      ).toBe(1);
    }
  });

  it("pans instead of painting when no color is active", () => {
    const onPaintCells = vi.fn<(cells: ChartCell[]) => void>();

    render(
      <ChartViewport
        chart={chartOf(20, 16)}
        activePaintIndex={null}
        onActivePaintIndexChange={() => undefined}
        onPaintCells={onPaintCells}
      />,
    );

    drag({ x: 120, y: 120 }, { x: 280, y: 190 });

    expect(onPaintCells).not.toHaveBeenCalled();
    expect(stage()).toHaveAccessibleName(/pan and zoom/i);
  });

  it("abandons a stroke that turns into a two-finger gesture", () => {
    const onPaintCells = vi.fn<(cells: ChartCell[]) => void>();

    render(
      <ChartViewport
        chart={chartOf(20, 16)}
        activePaintIndex={1}
        onActivePaintIndexChange={() => undefined}
        onPaintCells={onPaintCells}
      />,
    );

    const target = stage();
    fireEvent.pointerDown(target, {
      pointerId: 1,
      button: 0,
      clientX: STAGE_RECT.left + 200,
      clientY: STAGE_RECT.top + 150,
    });
    fireEvent.touchStart(target, {
      touches: [
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 160 },
      ],
    });
    fireEvent.pointerUp(target, { pointerId: 1 });

    expect(onPaintCells).not.toHaveBeenCalled();
  });

  it("paints from the keyboard with the arrows and Enter", async () => {
    const user = userEvent.setup();
    const onPaintCells = vi.fn<(cells: ChartCell[]) => void>();

    render(
      <ChartViewport
        chart={chartOf(20, 16)}
        activePaintIndex={1}
        onActivePaintIndexChange={() => undefined}
        onPaintCells={onPaintCells}
      />,
    );

    stage().focus();
    await user.keyboard("{ArrowRight}{ArrowRight}{ArrowDown}{Enter}");

    expect(onPaintCells).toHaveBeenCalledWith([{ x: 2, y: 1 }]);
    expect(screen.getByRole("status")).toHaveTextContent(
      /cursor at stitch 3, row 2/i,
    );
  });

  it("leaves Shift with an arrow key as a pan while painting", async () => {
    const user = userEvent.setup();
    const onPaintCells = vi.fn<(cells: ChartCell[]) => void>();

    render(
      <ChartViewport
        chart={chartOf(20, 16)}
        activePaintIndex={1}
        onActivePaintIndexChange={() => undefined}
        onPaintCells={onPaintCells}
      />,
    );

    stage().focus();
    await user.keyboard("{Shift>}{ArrowRight}{/Shift}{Enter}");

    expect(onPaintCells).toHaveBeenCalledWith([{ x: 0, y: 0 }]);
  });

  it("offers the palette as paint colors and can step back to panning", async () => {
    const user = userEvent.setup();
    const onActivePaintIndexChange = vi.fn();

    render(
      <ChartViewport
        chart={chartOf(20, 16)}
        activePaintIndex={1}
        onActivePaintIndexChange={onActivePaintIndexChange}
        onPaintCells={() => undefined}
      />,
    );

    const active = screen.getByRole("button", { name: /paint with ● #244b3c/i });
    expect(active).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: /^pan$/i }));
    expect(onActivePaintIndexChange).toHaveBeenCalledWith(null);

    // Pressing the active color again is how you put the brush down.
    await user.click(active);
    expect(onActivePaintIndexChange).toHaveBeenLastCalledWith(null);
  });
});
