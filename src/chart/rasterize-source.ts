import type { CropRect, RotationDegrees } from "../domain/models";
import type { RgbaImage } from "./chart-types";

export type RasterizeSourceInput = {
  sourceImage: Blob;
  naturalWidth: number;
  naturalHeight: number;
  rotationDegrees: RotationDegrees;
  crop: CropRect;
};

function rotatedSize(
  width: number,
  height: number,
  rotation: RotationDegrees,
): { width: number; height: number } {
  return rotation % 180 === 0
    ? { width, height }
    : { width: height, height: width };
}

export async function rasterizeSourceToRgba(
  input: RasterizeSourceInput,
): Promise<RgbaImage> {
  const bitmap = await createImageBitmap(input.sourceImage, {
    imageOrientation: "from-image",
  });

  try {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(input.crop.width));
    canvas.height = Math.max(1, Math.round(input.crop.height));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      throw new Error("Canvas is unavailable for chart generation");
    }

    if (input.rotationDegrees === 0) {
      context.drawImage(
        bitmap,
        input.crop.x,
        input.crop.y,
        input.crop.width,
        input.crop.height,
        0,
        0,
        canvas.width,
        canvas.height,
      );
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
