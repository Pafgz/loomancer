import type { ColorworkChart, GenerateChartInput } from "./chart-types";
import { generateColorworkChart } from "./generate-chart";

export type ChartWorkerRequest = {
  id: string;
  input: GenerateChartInput;
};

export type ChartWorkerResponse =
  | { id: string; ok: true; chart: ColorworkChart }
  | { id: string; ok: false; message: string };

self.onmessage = (event: MessageEvent<ChartWorkerRequest>) => {
  try {
    const chart = generateColorworkChart(event.data.input);
    const response: ChartWorkerResponse = {
      id: event.data.id,
      ok: true,
      chart,
    };
    self.postMessage(response);
  } catch (error) {
    const response: ChartWorkerResponse = {
      id: event.data.id,
      ok: false,
      message:
        error instanceof Error ? error.message : "Chart generation failed",
    };
    self.postMessage(response);
  }
};

export {};
