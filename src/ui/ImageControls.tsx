import { useMemo } from "react";
import {
  MAX_CHART_COLORS,
  MAX_CHART_DIMENSION,
  MAX_DETAIL,
  MIN_CHART_COLORS,
  MIN_DETAIL,
} from "../chart/chart-types";
import type { PatternProject } from "../domain/models";

type ImageControlsProps = {
  draft: PatternProject;
  previewUrl: string | null;
  error: string | null;
  onFileChange: (files: FileList | null) => void;
  onRotate: () => void;
  onCropChange: (field: "x" | "y" | "width" | "height", value: string) => void;
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
  previewUrl,
  error,
  onFileChange,
  onRotate,
  onCropChange,
  onDetailChange,
  onDimensionChange,
  onAspectLockChange,
  onMaxColorsChange,
}: ImageControlsProps) {
  const crop = draft.crop;
  const previewStyle = useMemo(
    () => ({ transform: `rotate(${draft.rotationDegrees}deg)` }),
    [draft.rotationDegrees],
  );

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

        {draft.sourceImage && previewUrl ? (
          <div className="image-editor">
            <div
              className="crop-preview"
              style={{
                aspectRatio:
                  crop && crop.height > 0
                    ? `${crop.width} / ${crop.height}`
                    : undefined,
              }}
              data-testid="crop-preview"
              data-crop={
                crop ? `${crop.x},${crop.y},${crop.width},${crop.height}` : undefined
              }
            >
              <img
                src={previewUrl}
                alt="Source preview"
                style={{
                  ...previewStyle,
                  width:
                    crop && draft.naturalWidth
                      ? `${(draft.naturalWidth / crop.width) * 100}%`
                      : "100%",
                  maxWidth: "none",
                  maxHeight: "none",
                  marginLeft:
                    crop && crop.width
                      ? `${(-crop.x / crop.width) * 100}%`
                      : undefined,
                  marginTop:
                    crop && crop.height
                      ? `${(-crop.y / crop.height) * 100}%`
                      : undefined,
                }}
              />
            </div>
            <p className="hint">
              {draft.naturalWidth} × {draft.naturalHeight} · Rotation:{" "}
              {draft.rotationDegrees}°
            </p>
            <button type="button" onClick={onRotate}>
              Rotate 90°
            </button>
          </div>
        ) : (
          <p className="muted">
            Choose a JPEG, PNG, or WebP photo from this device. Photos stay on
            your device.
          </p>
        )}
      </div>

      {draft.sourceImage && crop ? (
        <div className="card">
          <h3>Framing</h3>
          <div className="crop-fields">
            <label>
              Crop X
              <input
                type="number"
                min={0}
                value={crop.x}
                onChange={(event) => onCropChange("x", event.target.value)}
              />
            </label>
            <label>
              Crop Y
              <input
                type="number"
                min={0}
                value={crop.y}
                onChange={(event) => onCropChange("y", event.target.value)}
              />
            </label>
            <label>
              Crop width
              <input
                type="number"
                min={1}
                value={crop.width}
                onChange={(event) => onCropChange("width", event.target.value)}
              />
            </label>
            <label>
              Crop height
              <input
                type="number"
                min={1}
                value={crop.height}
                onChange={(event) => onCropChange("height", event.target.value)}
              />
            </label>
          </div>
        </div>
      ) : null}

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
              onChange={(event) => onMaxColorsChange(Number(event.target.value))}
            />
            <span className="hint">{draft.maxColors} colors</span>
          </div>
        </div>
      ) : null}
    </>
  );
}
