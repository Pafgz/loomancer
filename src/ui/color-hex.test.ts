import { describe, expect, it } from "vitest";
import { normalizeHex } from "./color-hex";

describe("normalizeHex", () => {
  it("accepts #rrggbb and bare rrggbb", () => {
    expect(normalizeHex("#ABcdEF")).toBe("#abcdef");
    expect(normalizeHex("112233")).toBe("#112233");
  });

  it("expands #rgb", () => {
    expect(normalizeHex("#f0a")).toBe("#ff00aa");
    expect(normalizeHex("f0a")).toBe("#ff00aa");
  });

  it("rejects incomplete or non-hex values", () => {
    expect(normalizeHex("")).toBeNull();
    expect(normalizeHex("#12")).toBeNull();
    expect(normalizeHex("#gg0000")).toBeNull();
    expect(normalizeHex("not-a-color")).toBeNull();
  });
});
