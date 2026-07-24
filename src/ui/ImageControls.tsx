import {
  MAX_CHART_COLORS,
  MAX_CHART_DIMENSION,
  MAX_DETAIL,
  MIN_CHART_COLORS,
  MIN_DETAIL,
} from "../chart/chart-types";
import type { CropRect, PatternProject } from "../domain/models";
import { cropsEqual } from "../image/framing";
import { CropFrame } from "./CropFrame";

type ImageControlsProps = {
  draft: PatternProject;
  framingCrop: CropRect | null;
  imageWidth: number;
  imageHeight: number;
  previewUrl: string | null;
  error: string | null;
  onFileChange: (files: FileList | null) => void;
  onRotate: () => void;
  onFramingCropChange: (crop: CropRect) => void;
  onApplyFraming: () => void;
  onDetailChange: (value: string) => void;
  onDimensionChange: (
    field: "chartWidth" | "chartHeight",
    value: string,
  ) => void;
  onAspectLockChange: (checked: boolean) => void;
  onMaxColorsChange: (value: number) => void;
};

export function ImageControls({
  draft,
  framingCrop,
  imageWidth,
  imageHeight,
  previewUrl,
  error,
  onFileChange,
  onRotate,
  onFramingCropChange,
  onApplyFraming,
  onDetailChange,
  onDimensionChange,
  onAspectLockChange,
  onMaxColorsChange,
}: ImageControlsProps) {
  const framingDirty =
    !!framingCrop &&
    !!draft.crop &&
    !cropsEqual(framingCrop, draft.crop);

  return (
    <>
      <div className="card">
        <label className="file-picker">
          <span>Select photo</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            onChange={(event) => {
              onFileChange(event.target.files);
              event.target.value = "";
            }}
          />
        </label>

        {error ? (
          <p className="form-error" role="alert">
            <span aria-hidden="true">⚠</span>
            {error}
          </p>
        ) : null}

        {draft.sourceImage && previewUrl && framingCrop ? (
          <div className="image-editor">
            <CropFrame
              imageUrl={previewUrl}
              imageWidth={imageWidth}
              imageHeight={imageHeight}
              crop={framingCrop}
              onCropChange={onFramingCropChange}
            />
            <p className="hint">
              Drag to pan · pinch or scroll to zoom · {imageWidth} ×{" "}
              {imageHeight}
              {draft.rotationDegrees ? ` · ${draft.rotationDegrees}°` : ""}
            </p>
            <div className="framing-actions">
              <button type="button" onClick={onRotate}>
                Rotate 90°
              </button>
              <button
                type="button"
                className="primary"
                disabled={!framingDirty}
                onClick={onApplyFraming}
              >
                Apply framing
              </button>
            </div>
            {framingDirty ? (
              <p className="hint framing-dirty" role="status">
                Framing changed — apply to update the Colorwork Chart.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="muted">
            Choose a JPEG, PNG, or WebP photo from this device. Photos stay on
            your device.
          </p>
        )}
      </div>

      {draft.sourceImage ? (
        <div className="card">
          <h3>Chart</h3>
          <div className="field">
            <label htmlFor="detail-range">Detail</label>
            <input
              id="detail-range"
              type="range"
              min={MIN_DETAIL}
              max={MAX_DETAIL}
              value={draft.detailLevel}
              onChange={(event) => onDetailChange(event.target.value)}
            />
            <span className="hint">
              {draft.chartWidth} × {draft.chartHeight} stitches
            </span>
          </div>
          <div className="crop-fields">
            <label>
              Stitch width
              <input
                type="number"
                min={1}
                max={MAX_CHART_DIMENSION}
                value={draft.chartWidth}
                onChange={(event) =>
                  onDimensionChange("chartWidth", event.target.value)
                }
              />
            </label>
            <label>
              Row height
              <input
                type="number"
                min={1}
                max={MAX_CHART_DIMENSION}
                value={draft.chartHeight}
                onChange={(event) =>
                  onDimensionChange("chartHeight", event.target.value)
                }
              />
            </label>
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={draft.aspectLocked}
              onChange={(event) => onAspectLockChange(event.target.checked)}
            />
            Lock aspect ratio
          </label>
          <div className="field">
            <label htmlFor="max-colors-range">Maximum colors</label>
            <input
              id="max-colors-range"
              type="range"
              min={MIN_CHART_COLORS}
              max={MAX_CHART_COLORS}
              value={draft.maxColors}
              onChange={(event) =>
                onMaxColorsChange(Number(event.target.value))
              }
            />
            <span className="hint">{draft.maxColors} colors</span>
          </div>
        </div>
      ) : null}
    </>
  );
}
