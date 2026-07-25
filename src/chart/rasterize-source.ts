import type { CropRect, RotationDegrees } from "../domain/models";
import type { RgbaImage } from "./chart-types";

export type RasterizeSourceInput = {
  sourceImage: Blob;
  naturalWidth: number;
  naturalHeight: number;
  rotationDegrees: RotationDegrees;
  crop: CropRect;
  /** When set, rasterize directly toward this stitch grid (× oversample). */
  targetWidth?: number;
  targetHeight?: number;
  /** Extra pixels per stitch for quality before chart downsample. Default 2. */
  oversample?: number;
};

/** Cap working bitmap so huge crops never allocate multi-megapixel buffers. */
export const MAX_RASTER_SIDE = 2048;

function rotatedSize(
  width: number,
  height: number,
  rotation: RotationDegrees,
): { width: number; height: number } {
  return rotation % 180 === 0
    ? { width, height }
    : { width: height, height: width };
}

export function workingRasterSize(
  cropWidth: number,
  cropHeight: number,
  targetWidth?: number,
  targetHeight?: number,
  oversample = 2,
): { width: number; height: number } {
  if (
    targetWidth != null &&
    targetHeight != null &&
    targetWidth > 0 &&
    targetHeight > 0
  ) {
    let width = Math.max(1, Math.round(targetWidth * oversample));
    let height = Math.max(1, Math.round(targetHeight * oversample));
    const longest = Math.max(width, height);
    if (longest > MAX_RASTER_SIDE) {
      const factor = MAX_RASTER_SIDE / longest;
      width = Math.max(1, Math.round(width * factor));
      height = Math.max(1, Math.round(height * factor));
    }
    return { width, height };
  }

  let width = Math.max(1, Math.round(cropWidth));
  let height = Math.max(1, Math.round(cropHeight));
  const longest = Math.max(width, height);
  if (longest > MAX_RASTER_SIDE) {
    const factor = MAX_RASTER_SIDE / longest;
    width = Math.max(1, Math.round(width * factor));
    height = Math.max(1, Math.round(height * factor));
  }
  return { width, height };
}

export async function rasterizeSourceToRgba(
  input: RasterizeSourceInput,
): Promise<RgbaImage> {
  const bitmap = await createImageBitmap(input.sourceImage, {
    imageOrientation: "from-image",
  });

  try {
    const size = workingRasterSize(
      input.crop.width,
      input.crop.height,
      input.targetWidth,
      input.targetHeight,
      input.oversample,
    );
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      throw new Error("Canvas is unavailable for chart generation");
    }

    if (input.rotationDegrees === 0) {
      // Browser-native crop + resize avoids a full-resolution intermediate buffer.
      const cropped = await createImageBitmap(
        bitmap,
        input.crop.x,
        input.crop.y,
        input.crop.width,
        input.crop.height,
        {
          resizeWidth: size.width,
          resizeHeight: size.height,
          resizeQuality: "medium",
        },
      );
      try {
        context.drawImage(cropped, 0, 0);
      } finally {
        cropped.close();
      }
    } else {
      const oriented = rotatedSize(
        input.naturalWidth,
        input.naturalHeight,
        input.rotationDegrees,
      );
      const orientedCanvas = document.createElement("canvas");
      orientedCanvas.width = oriented.width;
      orientedCanvas.height = oriented.height;
      const orientedContext = orientedCanvas.getContext("2d");
      if (!orientedContext) {
        throw new Error("Canvas is unavailable for chart generation");
      }
      orientedContext.translate(oriented.width / 2, oriented.height / 2);
      orientedContext.rotate((input.rotationDegrees * Math.PI) / 180);
      orientedContext.drawImage(
        bitmap,
        -input.naturalWidth / 2,
        -input.naturalHeight / 2,
        input.naturalWidth,
        input.naturalHeight,
      );
      context.drawImage(
        orientedCanvas,
        input.crop.x,
        input.crop.y,
        input.crop.width,
        input.crop.height,
        0,
        0,
        canvas.width,
        canvas.height,
      );
    }

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    return {
      width: canvas.width,
      height: canvas.height,
      data: imageData.data,
    };
  } finally {
    bitmap.close();
  }
}
