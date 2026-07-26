import { useEffect, useState } from "react";
import type { ColorworkChart } from "../domain/models";
import type { ChartCell } from "./chart-viewport-math";
import { ChartViewport } from "./ChartViewport";

type ChartViewProps = {
  chart: ColorworkChart;
  isGenerating?: boolean;
  showSymbols?: boolean;
  onShowSymbolsChange?: (show: boolean) => void;
  activePaintIndex?: number | null;
  onActivePaintIndexChange?: (index: number | null) => void;
  onPaintCells?: (cells: ChartCell[]) => void;
};

export function ChartView({
  chart,
  isGenerating = false,
  showSymbols = true,
  onShowSymbolsChange,
  activePaintIndex,
  onActivePaintIndexChange,
  onPaintCells,
}: ChartViewProps) {
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!fullscreen) {
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setFullscreen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [fullscreen]);

  return (
    <div className={fullscreen ? "chart-view is-fullscreen" : "chart-view"}>
      {isGenerating ? (
        <p className="progress" role="status">
          Updating Colorwork Chart…
        </p>
      ) : null}
      <ChartViewport
        chart={chart}
        showSymbols={showSymbols}
        onShowSymbolsChange={onShowSymbolsChange}
        activePaintIndex={activePaintIndex}
        onActivePaintIndexChange={onActivePaintIndexChange}
        onPaintCells={onPaintCells}
        fullscreen={fullscreen}
        onToggleFullscreen={() => setFullscreen((value) => !value)}
      />
    </div>
  );
}
