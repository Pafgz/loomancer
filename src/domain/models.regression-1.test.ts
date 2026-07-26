import { describe, expect, it } from "vitest";
import { nextDuplicateName } from "./models";

// Regression: ISSUE-001 — duplicate projects collide on the same "(copy)" name
// Found by /qa on 2026-07-26
// Report: .gstack/qa-reports/qa-report-localhost-5173-2026-07-26.md

describe("nextDuplicateName", () => {
  it("uses (copy) when that name is free", () => {
    expect(nextDuplicateName("Autumn", ["Autumn"])).toBe("Autumn (copy)");
  });

  it("increments when (copy) is already taken", () => {
    expect(
      nextDuplicateName("Autumn", ["Autumn", "Autumn (copy)"]),
    ).toBe("Autumn (copy 2)");
  });

  it("strips an existing (copy) suffix before allocating", () => {
    expect(
      nextDuplicateName("Autumn (copy)", ["Autumn", "Autumn (copy)"]),
    ).toBe("Autumn (copy 2)");
  });

  it("skips gaps until the next free number", () => {
    expect(
      nextDuplicateName("Autumn", [
        "Autumn",
        "Autumn (copy)",
        "Autumn (copy 2)",
        "Autumn (copy 4)",
      ]),
    ).toBe("Autumn (copy 3)");
  });
});
