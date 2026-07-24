import type { CropRect, RotationDegrees } from "../domain/models";

export const MIN_CROP_SIDE = 16;

/** Image size after the Pattern Project's rotation is applied. */
export function orientedDimensions(
  naturalWidth: number,
  naturalHeight: number,
  rotation: RotationDegrees,
): { width: number; height: number } {
  return rotation % 180 === 0
    ? { width: naturalWidth, height: naturalHeight }
    : { width: naturalHeight, height: naturalWidth };
}

export function cropsEqual(a: CropRect, b: CropRect): boolean {
  return (
    a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
  );
}

/** Keep the crop inside the oriented image with a minimum size. */
export function clampCrop(
  crop: CropRect,
  imageWidth: number,
  imageHeight: number,
): CropRect {
  const width = Math.min(
    Math.max(MIN_CROP_SIDE, Math.round(crop.width)),
    Math.max(MIN_CROP_SIDE, imageWidth),
  );
  const height = Math.min(
    Math.max(MIN_CROP_SIDE, Math.round(crop.height)),
    Math.max(MIN_CROP_SIDE, imageHeight),
  );
  const x = Math.min(
    Math.max(0, Math.round(crop.x)),
    Math.max(0, imageWidth - width),
  );
  const y = Math.min(
    Math.max(0, Math.round(crop.y)),
    Math.max(0, imageHeight - height),
  );
  return { x, y, width, height };
}

/**
 * Largest crop of the given aspect that fits the image, centered.
 * Aspect is width/height.
 */
export function maxCropForAspect(
  aspect: number,
  imageWidth: number,
  imageHeight: number,
): CropRect {
  const safeAspect = Math.max(0.01, aspect);
  let width = imageWidth;
  let height = Math.round(width / safeAspect);
  if (height > imageHeight) {
    height = imageHeight;
    width = Math.round(height * safeAspect);
  }
  return clampCrop(
    {
      x: Math.round((imageWidth - width) / 2),
      y: Math.round((imageHeight - height) / 2),
      width,
      height,
    },
    imageWidth,
    imageHeight,
  );
}

/** Re-fit an existing crop to a new aspect, keeping center and as much coverage as possible. */
export function fitCropToAspect(
  crop: CropRect,
  aspect: number,
  imageWidth: number,
  imageHeight: number,
): CropRect {
  const safeAspect = Math.max(0.01, aspect);
  const cx = crop.x + crop.width / 2;
  const cy = crop.y + crop.height / 2;
  // Prefer keeping the larger side so we don't zoom out unexpectedly.
  let width = crop.width;
  let height = Math.round(width / safeAspect);
  if (height > imageHeight) {
    height = imageHeight;
    width = Math.round(height * safeAspect);
  }
  if (width > imageWidth) {
    width = imageWidth;
    height = Math.round(width / safeAspect);
  }
  return clampCrop(
    {
      x: Math.round(cx - width / 2),
      y: Math.round(cy - height / 2),
      width,
      height,
    },
    imageWidth,
    imageHeight,
  );
}

/** Pan the crop in oriented-image pixels (positive dx moves the crop right = image appears left). */
export function panCrop(
  crop: CropRect,
  dx: number,
  dy: number,
  imageWidth: number,
  imageHeight: number,
): CropRect {
  return clampCrop(
    { ...crop, x: crop.x + dx, y: crop.y + dy },
    imageWidth,
    imageHeight,
  );
}

/**
 * Zoom the crop by `factor` (>1 zooms in = smaller crop). Keeps center.
 * Aspect is preserved from the current crop.
 */
export function zoomCrop(
  crop: CropRect,
  factor: number,
  imageWidth: number,
  imageHeight: number,
): CropRect {
  const safe = Math.max(0.05, factor);
  const cx = crop.x + crop.width / 2;
  const cy = crop.y + crop.height / 2;
  const width = crop.width / safe;
  const height = crop.height / safe;
  return clampCrop(
    {
      x: cx - width / 2,
      y: cy - height / 2,
      width,
      height,
    },
    imageWidth,
    imageHeight,
  );
}

/** Convert a pointer delta in frame CSS pixels into oriented-image crop deltas. */
export function frameDeltaToCropDelta(
  crop: CropRect,
  frameWidthPx: number,
  dxPx: number,
  dyPx: number,
): { dx: number; dy: number } {
  if (frameWidthPx <= 0 || crop.width <= 0) {
    return { dx: 0, dy: 0 };
  }
  const scale = crop.width / frameWidthPx;
  // Dragging the image right means the crop moves left.
  return { dx: -dxPx * scale, dy: -dyPx * scale };
}
