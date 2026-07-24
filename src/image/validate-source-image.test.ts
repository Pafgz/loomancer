import { describe, expect, it } from "vitest";
import {
  MAX_SOURCE_BYTES,
  MAX_SOURCE_PIXELS,
  validateSourceImage,
} from "./validate-source-image";

function pngBlob(_width: number, _height: number, type = "image/png"): Blob {
  // Minimal valid 1x1 PNG; dimensions are supplied by the injected decoder in tests.
  const bytes = Uint8Array.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
    0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xff, 0xff, 0x3f,
    0x00, 0x05, 0xfe, 0x02, 0xfe, 0xa7, 0x35, 0x81, 0x84, 0x00, 0x00, 0x00,
    0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);
  return new Blob([bytes], { type });
}

describe("validateSourceImage", () => {
  it("accepts a JPEG/PNG/WebP image within size limits", async () => {
    const file = new File([pngBlob(1200, 800)], "fox.png", {
      type: "image/png",
    });

    const result = await validateSourceImage(file, async () => ({
      width: 1200,
      height: 800,
    }));

    expect(result).toEqual({
      ok: true,
      width: 1200,
      height: 800,
      mimeType: "image/png",
    });
  });

  it("rejects files larger than the documented byte limit", async () => {
    const oversized = new File([new Uint8Array(MAX_SOURCE_BYTES + 1)], "big.png", {
      type: "image/png",
    });

    const result = await validateSourceImage(oversized, async () => ({
      width: 100,
      height: 100,
    }));

    expect(result).toEqual({
      ok: false,
      message:
        "That photo is larger than 25 MB. Choose a smaller image or export it at a lower quality.",
    });
  });

  it("rejects images above the documented megapixel limit", async () => {
    const file = new File([pngBlob(1, 1)], "huge.png", { type: "image/png" });
    const width = 5000;
    const height = Math.ceil(MAX_SOURCE_PIXELS / width) + 1;

    const result = await validateSourceImage(file, async () => ({
      width,
      height,
    }));

    expect(result).toEqual({
      ok: false,
      message:
        "That photo is above 20 megapixels. Resize it before importing so Loomancer stays responsive.",
    });
  });

  it("guides the Knitter when HEIC cannot be decoded", async () => {
    const file = new File([pngBlob(1, 1)], "iphone.heic", {
      type: "image/heic",
    });

    const result = await validateSourceImage(file, async () => {
      throw new Error("decode failed");
    });

    expect(result).toEqual({
      ok: false,
      message:
        "This HEIC/HEIF photo could not be decoded. Convert it to JPEG or PNG and try again.",
    });
  });

  it("rejects unsupported image types with clear guidance", async () => {
    const file = new File([pngBlob(1, 1)], "drawing.gif", {
      type: "image/gif",
    });

    const result = await validateSourceImage(file, async () => ({
      width: 10,
      height: 10,
    }));

    expect(result).toEqual({
      ok: false,
      message:
        "Use a JPEG, PNG, or WebP photo. HEIC/HEIF may work on some devices; convert to JPEG/PNG if import fails.",
    });
  });
});
