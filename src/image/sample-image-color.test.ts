import { describe, expect, it } from "vitest";
import { clientPointToNaturalPixel } from "./sample-image-color";

describe("clientPointToNaturalPixel", () => {
  it("maps a laid-out click into natural image coordinates", () => {
    const point = clientPointToNaturalPixel(
      25,
      15,
      { left: 0, top: 0, width: 40, height: 40 },
      4,
      4,
    );
    expect(point).toEqual({ x: 2, y: 1 });
  });

  it("clamps to the image bounds", () => {
    expect(
      clientPointToNaturalPixel(
        -10,
        100,
        { left: 0, top: 0, width: 40, height: 40 },
        4,
        4,
      ),
    ).toEqual({ x: 0, y: 3 });
  });
});
