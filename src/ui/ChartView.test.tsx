import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ChartView } from "./ChartView";

const chart = {
  width: 4,
  height: 3,
  cells: [0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1],
  palette: [
    { index: 0, hex: "#203040", symbol: "▲", stitchCount: 6 },
    { index: 1, hex: "#d0a050", symbol: "●", stitchCount: 6 },
  ],
};

describe("ChartView", () => {
  it("shows fit, zoom, symbols, and full screen controls around the chart", async () => {
    const user = userEvent.setup();
    let showSymbols = true;
    const { rerender } = render(
      <ChartView
        chart={chart}
        showSymbols={showSymbols}
        onShowSymbolsChange={(next) => {
          showSymbols = next;
        }}
      />,
    );

    expect(
      screen.getByRole("table", { name: /4 by 3 colorwork chart/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^fit$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /zoom in/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /hide chart symbols/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /full screen/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /hide chart symbols/i }));
    rerender(
      <ChartView
        chart={chart}
        showSymbols={showSymbols}
        onShowSymbolsChange={(next) => {
          showSymbols = next;
        }}
      />,
    );
    expect(
      screen.getByRole("button", { name: /show chart symbols/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /full screen/i }));
    expect(
      screen.getByRole("button", { name: /exit full screen/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /exit full screen/i }));
    expect(screen.getByRole("button", { name: /^full screen$/i })).toBeInTheDocument();
  });
});
