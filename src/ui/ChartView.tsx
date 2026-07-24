import type { ColorworkChart } from "../domain/models";

type ChartViewProps = {
  chart: ColorworkChart;
  isGenerating?: boolean;
};

export function ChartView({ chart, isGenerating = false }: ChartViewProps) {
  return (
    <div className="chart-view">
      {isGenerating ? (
        <p className="progress" role="status">
          Updating Colorwork Chart…
        </p>
      ) : null}
      <div
        className="chart-grid"
        role="table"
        aria-label={`${chart.width} by ${chart.height} Colorwork Chart`}
        style={{
          gridTemplateColumns: `repeat(${chart.width}, 1.1rem)`,
        }}
      >
        {chart.cells.map((cell, index) => {
          const entry = chart.palette[cell];
          const row = Math.floor(index / chart.width) + 1;
          const column = (index % chart.width) + 1;
          return (
            <span
              key={`${row}-${column}`}
              className="chart-cell"
              role="cell"
              aria-label={`Row ${row}, column ${column}, ${entry?.symbol ?? "?"} ${entry?.hex ?? ""}`}
              style={{ background: entry?.hex ?? "#ccc" }}
            >
              {entry?.symbol}
            </span>
          );
        })}
      </div>
      <ol className="chart-key" aria-label="Color key stitch counts">
        {chart.palette.map((entry) => (
          <li key={entry.index}>
            <span
              className="swatch"
              style={{ background: entry.hex }}
              aria-hidden="true"
            />
            <span>
              {entry.symbol} {entry.hex} · {entry.stitchCount} stitches
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
