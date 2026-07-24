import type { ColorworkChart, GenerateChartInput } from "./chart-types";
import type { ChartWorkerRequest, ChartWorkerResponse } from "./chart.worker";
import { generateColorworkChart } from "./generate-chart";

export type ChartGenerator = (
  input: GenerateChartInput,
) => Promise<ColorworkChart>;

export function createInlineChartGenerator(): ChartGenerator {
  return async (input) => generateColorworkChart(input);
}

export function createWorkerChartGenerator(): ChartGenerator {
  if (typeof Worker === "undefined") {
    return createInlineChartGenerator();
  }

  const worker = new Worker(new URL("./chart.worker.ts", import.meta.url), {
    type: "module",
  });

  return (input) =>
    new Promise<ColorworkChart>((resolve, reject) => {
      const id = crypto.randomUUID();
      const handleMessage = (event: MessageEvent<ChartWorkerResponse>) => {
        if (event.data.id !== id) {
          return;
        }
        worker.removeEventListener("message", handleMessage);
        if (event.data.ok) {
          resolve(event.data.chart);
        } else {
          reject(new Error(event.data.message));
        }
      };
      worker.addEventListener("message", handleMessage);
      const request: ChartWorkerRequest = { id, input };
      worker.postMessage(request);
    });
}
