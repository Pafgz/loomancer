import { describe, expect, it } from "vitest";
import {
  MAX_RASTER_SIDE,
  workingRasterSize,
} from "./rasterize-source";

describe("workingRasterSize", () => {
  it("targets chart size × oversample when targets are provided", () => {
    expect(workingRasterSize(4000, 3000, 100, 80, 2)).toEqual({
      width: 200,
      height: 160,
    });
  });

  it("caps the longest side so huge crops stay bounded", () => {
    const size = workingRasterSize(8000, 6000);
    expect(Math.max(size.width, size.height)).toBeLessThanOrEqual(
      MAX_RASTER_SIDE,
    );
    expect(size.width / size.height).toBeCloseTo(8000 / 6000, 1);
  });
});
