import { describe, expect, it } from "vitest";
import {
  clampCrop,
  cropsEqual,
  fitCropToAspect,
  frameDeltaToCropDelta,
  maxCropForAspect,
  orientedDimensions,
  panCrop,
  zoomCrop,
} from "./framing";

describe("orientedDimensions", () => {
  it("swaps sides for 90° and 270°", () => {
    expect(orientedDimensions(200, 100, 0)).toEqual({ width: 200, height: 100 });
    expect(orientedDimensions(200, 100, 90)).toEqual({ width: 100, height: 200 });
    expect(orientedDimensions(200, 100, 180)).toEqual({ width: 200, height: 100 });
    expect(orientedDimensions(200, 100, 270)).toEqual({ width: 100, height: 200 });
  });
});

describe("clampCrop", () => {
  it("keeps the crop inside the image", () => {
    expect(clampCrop({ x: -10, y: 90, width: 80, height: 80 }, 100, 100)).toEqual({
      x: 0,
      y: 20,
      width: 80,
      height: 80,
    });
  });
});

describe("maxCropForAspect", () => {
  it("fits a wide aspect inside a square image", () => {
    const crop = maxCropForAspect(2, 100, 100);
    expect(crop.width / crop.height).toBeCloseTo(2, 1);
    expect(crop.width).toBeLessThanOrEqual(100);
    expect(crop.height).toBeLessThanOrEqual(100);
  });
});

describe("fitCropToAspect", () => {
  it("preserves center while matching a new aspect", () => {
    const crop = fitCropToAspect(
      { x: 25, y: 25, width: 50, height: 50 },
      2,
      100,
      100,
    );
    expect(crop.width / crop.height).toBeCloseTo(2, 1);
    expect(Math.abs(crop.x + crop.width / 2 - 50)).toBeLessThanOrEqual(1);
    expect(Math.abs(crop.y + crop.height / 2 - 50)).toBeLessThanOrEqual(1);
  });
});

describe("panCrop", () => {
  it("moves within bounds", () => {
    const crop = panCrop({ x: 10, y: 10, width: 40, height: 40 }, 100, 0, 100, 100);
    expect(crop.x).toBe(60);
    expect(crop.y).toBe(10);
  });
});

describe("zoomCrop", () => {
  it("zooms in by shrinking the crop around its center", () => {
    const crop = zoomCrop({ x: 0, y: 0, width: 100, height: 100 }, 2, 100, 100);
    expect(crop.width).toBe(50);
    expect(crop.height).toBe(50);
    expect(crop.x).toBe(25);
    expect(crop.y).toBe(25);
  });

  it("cannot zoom out past the image", () => {
    const crop = zoomCrop({ x: 25, y: 25, width: 50, height: 50 }, 0.1, 100, 100);
    expect(crop.width).toBeLessThanOrEqual(100);
    expect(crop.height).toBeLessThanOrEqual(100);
  });
});

describe("frameDeltaToCropDelta", () => {
  it("maps frame pixels to image pixels and inverts drag direction", () => {
    expect(
      frameDeltaToCropDelta({ x: 0, y: 0, width: 100, height: 50 }, 200, 20, 10),
    ).toEqual({ dx: -10, dy: -5 });
  });
});

describe("cropsEqual", () => {
  it("compares all fields", () => {
    expect(
      cropsEqual(
        { x: 1, y: 2, width: 3, height: 4 },
        { x: 1, y: 2, width: 3, height: 4 },
      ),
    ).toBe(true);
    expect(
      cropsEqual(
        { x: 1, y: 2, width: 3, height: 4 },
        { x: 1, y: 2, width: 3, height: 5 },
      ),
    ).toBe(false);
  });
});
