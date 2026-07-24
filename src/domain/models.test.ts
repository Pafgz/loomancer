import { describe, expect, it } from "vitest";
import {
  createEmptyPatternProject,
  duplicatePatternProject,
  type ColorworkChart,
} from "./models";

const chart: ColorworkChart = {
  width: 2,
  height: 1,
  cells: [0, 1],
  palette: [
    { index: 0, hex: "#111111", symbol: "A", stitchCount: 1 },
    { index: 1, hex: "#222222", symbol: "B", stitchCount: 1 },
  ],
};

describe("duplicatePatternProject", () => {
  it("copies with a new id, a (copy) name, and fresh timestamps", () => {
    const original = { ...createEmptyPatternProject("Autumn"), chart };
    const copy = duplicatePatternProject(original);

    expect(copy.id).not.toBe(original.id);
    expect(copy.name).toBe("Autumn (copy)");
    expect(copy.createdAt).not.toBe("");
    expect(copy.updatedAt).toBe(copy.createdAt);
  });

  it("deep-copies the chart so editing the copy never mutates the original", () => {
    const original = { ...createEmptyPatternProject("Autumn"), chart };
    const copy = duplicatePatternProject(original);

    copy.chart!.cells[0] = 9;
    copy.chart!.palette[0].hex = "#ffffff";

    expect(original.chart!.cells[0]).toBe(0);
    expect(original.chart!.palette[0].hex).toBe("#111111");
  });

  it("accepts an explicit name", () => {
    const original = createEmptyPatternProject("Autumn");
    expect(duplicatePatternProject(original, "Winter").name).toBe("Winter");
  });
});
