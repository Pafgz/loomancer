import { useEffect, useState } from "react";
import type { ColorworkChart } from "../domain/models";
import { ChartViewport } from "./ChartViewport";

type ChartViewProps = {
  chart: ColorworkChart;
  isGenerating?: boolean;
};

export function ChartView({ chart, isGenerating = false }: ChartViewProps) {
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
        fullscreen={fullscreen}
        onToggleFullscreen={() => setFullscreen((value) => !value)}
      />
    </div>
  );
}
