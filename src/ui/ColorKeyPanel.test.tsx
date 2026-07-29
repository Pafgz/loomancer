import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MAX_CHART_COLORS } from "../chart/chart-types";
import { createBlankChart } from "../chart/blank-chart";
import { addChartColor } from "../chart/palette-edits";
import type { ColorworkChart, YarnColor } from "../domain/models";
import { ColorKeyPanel } from "./ColorKeyPanel";

function twoColorChart(): ColorworkChart {
  return {
    width: 2,
    height: 2,
    cells: [0, 1, 0, 1],
    palette: [
      {
        index: 0,
        hex: "#203040",
        symbol: "▲",
        stitchCount: 2,
        yarnLabel: "Ink",
      },
      {
        index: 1,
        hex: "#d0a050",
        symbol: "●",
        stitchCount: 2,
        yarnLabel: "Gold",
      },
    ],
  };
}

const inventory: YarnColor[] = [
  {
    id: "yarn-1",
    name: "Forest green",
    displayColor: "#1f3d32",
    schemaVersion: 1,
  },
];

function renderPanel(
  overrides: Partial<{
    chart: ColorworkChart;
    inventory: YarnColor[];
    selectedIndex: number | null;
    onSelectedIndexChange: (index: number | null) => void;
    onChartChange: (chart: ColorworkChart) => void;
    onAddPaletteColor: (hex: string) => void;
    onInventoryChange: (inventory: YarnColor[]) => void;
  }> = {},
) {
  const props = {
    chart: overrides.chart ?? twoColorChart(),
    inventory: overrides.inventory ?? inventory,
    selectedIndex: overrides.selectedIndex ?? 0,
    onSelectedIndexChange: overrides.onSelectedIndexChange ?? vi.fn(),
    onChartChange: overrides.onChartChange ?? vi.fn(),
    onAddPaletteColor: overrides.onAddPaletteColor ?? vi.fn(),
    onInventoryChange: overrides.onInventoryChange ?? vi.fn(),
  };
  return { ...render(<ColorKeyPanel {...props} />), props };
}

describe("ColorKeyPanel inline palette controls", () => {
  it("puts add in the Palette header and removes the Add color card", () => {
    renderPanel();

    expect(
      screen.getByRole("button", { name: /add palette color/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /^add color$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /add color to key/i }),
    ).not.toBeInTheDocument();
  });

  it("appends a color only when the header picker commits, not while dragging", () => {
    const onAddPaletteColor = vi.fn();
    renderPanel({ onAddPaletteColor });

    const picker = screen.getByLabelText(/new palette color/i);
    fireEvent.input(picker, { target: { value: "#aabbcc" } });
    expect(onAddPaletteColor).not.toHaveBeenCalled();

    fireEvent.change(picker, { target: { value: "#abcdef" } });
    expect(onAddPaletteColor).toHaveBeenCalledTimes(1);
    expect(onAddPaletteColor).toHaveBeenCalledWith("#abcdef");
  });

  it("disables + and shows a full hint at MAX_CHART_COLORS", () => {
    let chart = createBlankChart(2, 2);
    while (chart.palette.length < MAX_CHART_COLORS) {
      chart = addChartColor(chart, `#${chart.palette.length.toString(16).padStart(6, "0")}`);
    }

    renderPanel({ chart, selectedIndex: 0 });

    expect(
      screen.getByRole("button", { name: /add palette color/i }),
    ).toBeDisabled();
    expect(screen.getByLabelText(/new palette color/i)).toBeDisabled();
    expect(
      screen.getByText(new RegExp(`palette is full \\(${MAX_CHART_COLORS} colors\\)`, "i")),
    ).toBeInTheDocument();
  });

  it("selects a row for paint without opening the edit picker as the only path", async () => {
    const user = userEvent.setup();
    const onSelectedIndexChange = vi.fn();
    const onChartChange = vi.fn();
    renderPanel({
      selectedIndex: 0,
      onSelectedIndexChange,
      onChartChange,
    });

    await user.click(screen.getByRole("button", { name: /select ● gold/i }));

    expect(onSelectedIndexChange).toHaveBeenCalledWith(1);
    expect(onChartChange).not.toHaveBeenCalled();
  });

  it("replaces a color only when the trailing Edit picker commits", () => {
    const onChartChange = vi.fn();
    renderPanel({ onChartChange, selectedIndex: null });

    const picker = screen.getByLabelText(/change color for ▲/i);
    fireEvent.input(picker, { target: { value: "#445566" } });
    expect(onChartChange).not.toHaveBeenCalled();

    fireEvent.change(picker, { target: { value: "#112233" } });

    expect(onChartChange).toHaveBeenCalledTimes(1);
    const next = onChartChange.mock.calls[0]![0] as ColorworkChart;
    expect(next.palette[0]?.hex).toBe("#112233");
    expect(next.palette[0]?.yarnLabel).toBe("Custom color");
    expect(next.cells).toEqual([0, 1, 0, 1]);
  });

  it("shows the hex code for every palette entry", () => {
    renderPanel();

    expect(screen.getByText("#203040")).toBeInTheDocument();
    expect(screen.getByText("#d0a050")).toBeInTheDocument();
    expect(screen.getByText("Ink")).toBeInTheDocument();
    expect(screen.getByText("Gold")).toBeInTheDocument();
  });

  it("does not keep a separate Edit card", () => {
    renderPanel();

    expect(
      screen.queryByRole("heading", { name: /^edit /i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /replace with custom color/i }),
    ).not.toBeInTheDocument();
  });

  it("shows Merge into only for the selected row when there is more than one color", () => {
    const { rerender } = render(
      <ColorKeyPanel
        chart={twoColorChart()}
        inventory={inventory}
        selectedIndex={1}
        onSelectedIndexChange={vi.fn()}
        onChartChange={vi.fn()}
        onAddPaletteColor={vi.fn()}
        onInventoryChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/merge into color/i)).toBeInTheDocument();

    rerender(
      <ColorKeyPanel
        chart={twoColorChart()}
        inventory={inventory}
        selectedIndex={null}
        onSelectedIndexChange={vi.fn()}
        onChartChange={vi.fn()}
        onAddPaletteColor={vi.fn()}
        onInventoryChange={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText(/merge into color/i)).not.toBeInTheDocument();
  });

  it("lists yarn matches for the selected row and applies only on confirm", async () => {
    const user = userEvent.setup();
    const onChartChange = vi.fn();
    renderPanel({ selectedIndex: 0, onChartChange });

    expect(
      screen.getByRole("button", { name: /use this yarn/i }),
    ).toBeInTheDocument();
    expect(onChartChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /use this yarn/i }));

    expect(onChartChange).toHaveBeenCalledTimes(1);
    const next = onChartChange.mock.calls[0]![0] as ColorworkChart;
    expect(next.palette[0]?.yarnLabel).toBe("Forest green");
    expect(next.palette[0]?.hex).toBe("#1f3d32");
  });

  it("keeps Yarn Inventory below the Palette", () => {
    renderPanel();

    const panel = screen.getByRole("heading", { name: /^palette$/i }).closest(
      ".color-key-panel",
    );
    expect(panel).toBeTruthy();
    expect(
      within(panel as HTMLElement).getByRole("heading", {
        name: /yarn inventory/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /^add color$/i }),
    ).not.toBeInTheDocument();
  });
});
