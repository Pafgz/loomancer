export const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
export const MAX_SOURCE_PIXELS = 20_000_000;

const GUARANTEED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const BEST_EFFORT_TYPES = new Set(["image/heic", "image/heif"]);

export type DecodedImageSize = {
  width: number;
  height: number;
};

export type SourceImageDecoder = (
  blob: Blob,
) => Promise<DecodedImageSize>;

export type SourceImageValidation =
  | {
      ok: true;
      width: number;
      height: number;
      mimeType: string;
    }
  | {
      ok: false;
      message: string;
    };

export async function defaultDecodeSourceImage(
  blob: Blob,
): Promise<DecodedImageSize> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(blob, {
      imageOrientation: "from-image",
    });
    try {
      return { width: bitmap.width, height: bitmap.height };
    } finally {
      bitmap.close();
    }
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Image decode failed"));
      element.src = objectUrl;
    });
    return { width: image.naturalWidth, height: image.naturalHeight };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function validateSourceImage(
  file: File,
  decode: SourceImageDecoder = defaultDecodeSourceImage,
): Promise<SourceImageValidation> {
  const mimeType = file.type || "application/octet-stream";
  const isGuaranteed = GUARANTEED_TYPES.has(mimeType);
  const isBestEffort = BEST_EFFORT_TYPES.has(mimeType);

  if (!isGuaranteed && !isBestEffort) {
    return {
      ok: false,
      message:
        "Use a JPEG, PNG, or WebP photo. HEIC/HEIF may work on some devices; convert to JPEG/PNG if import fails.",
    };
  }

  if (file.size > MAX_SOURCE_BYTES) {
    return {
      ok: false,
      message:
        "That photo is larger than 25 MB. Choose a smaller image or export it at a lower quality.",
    };
  }

  try {
    const { width, height } = await decode(file);
    if (width * height > MAX_SOURCE_PIXELS) {
      return {
        ok: false,
        message:
          "That photo is above 20 megapixels. Resize it before importing so Knit-Pro stays responsive.",
      };
    }

    return {
      ok: true,
      width,
      height,
      mimeType,
    };
  } catch {
    if (isBestEffort) {
      return {
        ok: false,
        message:
          "This HEIC/HEIF photo could not be decoded. Convert it to JPEG or PNG and try again.",
      };
    }

    return {
      ok: false,
      message:
        "That file could not be read as an image. Try another JPEG, PNG, or WebP photo.",
    };
  }
}
