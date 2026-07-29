import { rgbToHex } from "../chart/chart-types";

export function clientPointToNaturalPixel(
  clientX: number,
  clientY: number,
  rect: Pick<DOMRect, "left" | "top" | "width" | "height">,
  naturalWidth: number,
  naturalHeight: number,
): { x: number; y: number } | null {
  if (
    !naturalWidth ||
    !naturalHeight ||
    rect.width <= 0 ||
    rect.height <= 0
  ) {
    return null;
  }

  return {
    x: Math.min(
      naturalWidth - 1,
      Math.max(
        0,
        Math.floor(((clientX - rect.left) / rect.width) * naturalWidth),
      ),
    ),
    y: Math.min(
      naturalHeight - 1,
      Math.max(
        0,
        Math.floor(((clientY - rect.top) / rect.height) * naturalHeight),
      ),
    ),
  };
}

/**
 * Sample the opaque pixel under a pointer on a displayed image element.
 * Maps from the element's laid-out box back to natural image coordinates.
 */
export function sampleHexFromImageElement(
  image: HTMLImageElement,
  clientX: number,
  clientY: number,
): string | null {
  const point = clientPointToNaturalPixel(
    clientX,
    clientY,
    image.getBoundingClientRect(),
    image.naturalWidth,
    image.naturalHeight,
  );
  if (!point) {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return null;
  }

  try {
    context.drawImage(image, 0, 0);
    const pixel = context.getImageData(point.x, point.y, 1, 1).data;
    if ((pixel[3] ?? 0) < 16) {
      return null;
    }
    return rgbToHex(pixel[0] ?? 0, pixel[1] ?? 0, pixel[2] ?? 0);
  } catch {
    return null;
  }
}

export function supportsSystemEyeDropper(): boolean {
  return typeof window !== "undefined" && "EyeDropper" in window;
}

type EyeDropperConstructor = new () => {
  open: () => Promise<{ sRGBHex: string }>;
};

/** Optional Chromium EyeDropper — samples any on-screen pixel, including the photo. */
export async function pickSystemEyeDropperHex(): Promise<string | null> {
  if (!supportsSystemEyeDropper()) {
    return null;
  }
  try {
    const EyeDropper = (
      window as unknown as Window & { EyeDropper: EyeDropperConstructor }
    ).EyeDropper;
    const result = await new EyeDropper().open();
    return result.sRGBHex.toLowerCase();
  } catch {
    // Knitter cancelled or the browser blocked the picker.
    return null;
  }
}
