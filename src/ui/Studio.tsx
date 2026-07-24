import { useEffect, useMemo, useRef, useState } from "react";
import {
  fullImageCrop,
  rotateClockwise,
  type PatternProject,
} from "../domain/models";
import {
  defaultDecodeSourceImage,
  validateSourceImage,
  type SourceImageDecoder,
} from "../image/validate-source-image";

type StudioProps = {
  project: PatternProject;
  onBack: () => void;
  onProjectChange: (project: PatternProject) => Promise<void>;
  decodeSourceImage?: SourceImageDecoder;
};

export function Studio({
  project,
  onBack,
  onProjectChange,
  decodeSourceImage = defaultDecodeSourceImage,
}: StudioProps) {
  const [draft, setDraft] = useState(project);
  const draftRef = useRef(project);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    setDraft(project);
    draftRef.current = project;
  }, [project]);

  useEffect(() => {
    if (!draft.sourceImage) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(draft.sourceImage);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [draft.sourceImage]);

  const crop = draft.crop;

  async function persist(
    updater: (current: PatternProject) => PatternProject,
  ) {
    const stamped = {
      ...updater(draftRef.current),
      updatedAt: new Date().toISOString(),
    };
    draftRef.current = stamped;
    setDraft(stamped);
    await onProjectChange(stamped);
  }

  async function handleFileChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) {
      return;
    }

    const validation = await validateSourceImage(file, decodeSourceImage);
    if (!validation.ok) {
      setError(validation.message);
      return;
    }

    setError(null);
    await persist((current) => ({
      ...current,
      sourceImage: file,
      sourceFileName: file.name,
      sourceMimeType: validation.mimeType,
      naturalWidth: validation.width,
      naturalHeight: validation.height,
      rotationDegrees: 0,
      crop: fullImageCrop(validation.width, validation.height),
    }));
  }

  async function handleRotate() {
    await persist((current) => {
      if (!current.sourceImage) {
        return current;
      }
      return {
        ...current,
        rotationDegrees: rotateClockwise(current.rotationDegrees),
      };
    });
  }

  async function updateCrop(
    field: "x" | "y" | "width" | "height",
    rawValue: string,
  ) {
    const value = Number(rawValue);
    if (!Number.isFinite(value)) {
      return;
    }

    await persist((current) => {
      if (!current.naturalWidth || !current.naturalHeight || !current.crop) {
        return current;
      }

      const nextCrop = {
        ...current.crop,
        [field]: Math.max(0, Math.round(value)),
      };

      const maxWidth = current.naturalWidth - nextCrop.x;
      const maxHeight = current.naturalHeight - nextCrop.y;
      nextCrop.width = Math.min(Math.max(1, nextCrop.width), maxWidth);
      nextCrop.height = Math.min(Math.max(1, nextCrop.height), maxHeight);

      return {
        ...current,
        crop: nextCrop,
      };
    });
  }

  const previewStyle = useMemo(
    () => ({
      transform: `rotate(${draft.rotationDegrees}deg)`,
      maxWidth: "100%",
      maxHeight: "16rem",
    }),
    [draft.rotationDegrees],
  );

  return (
    <div className="studio">
      <header className="studio-header">
        <div>
          <button type="button" className="ghost" onClick={onBack}>
            All projects
          </button>
          <h1>{draft.name}</h1>
          <p className="muted">Local Pattern Project</p>
        </div>
        <div className="actions">
          <button type="button" disabled>
            Undo
          </button>
          <button type="button" disabled>
            Redo
          </button>
          <button type="button" className="primary" disabled>
            Save Knit-ready Pattern
          </button>
        </div>
      </header>

      <div className="studio-layout">
        <section className="panel" aria-label="Image controls">
          <h2>Image controls</h2>
          <label className="file-picker">
            Select photo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              onChange={(event) => {
                void handleFileChange(event.target.files);
                event.target.value = "";
              }}
            />
          </label>

          {error ? (
            <p className="form-error" role="alert">
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
                  crop
                    ? `${crop.x},${crop.y},${crop.width},${crop.height}`
                    : undefined
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
              <p className="muted">
                {draft.naturalWidth} × {draft.naturalHeight} · Rotation:{" "}
                {draft.rotationDegrees}°
              </p>
              <p className="muted">
                Original photo is kept intact; crop and rotation are parameters
                only.
              </p>
              <button type="button" onClick={() => void handleRotate()}>
                Rotate 90°
              </button>
              {crop ? (
                <div className="crop-fields">
                  <label>
                    Crop X
                    <input
                      type="number"
                      min={0}
                      value={crop.x}
                      onChange={(event) =>
                        void updateCrop("x", event.target.value)
                      }
                    />
                  </label>
                  <label>
                    Crop Y
                    <input
                      type="number"
                      min={0}
                      value={crop.y}
                      onChange={(event) =>
                        void updateCrop("y", event.target.value)
                      }
                    />
                  </label>
                  <label>
                    Crop width
                    <input
                      type="number"
                      min={1}
                      value={crop.width}
                      onChange={(event) =>
                        void updateCrop("width", event.target.value)
                      }
                    />
                  </label>
                  <label>
                    Crop height
                    <input
                      type="number"
                      min={1}
                      value={crop.height}
                      onChange={(event) =>
                        void updateCrop("height", event.target.value)
                      }
                    />
                  </label>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="muted">
              Choose a JPEG, PNG, or WebP photo from this device. Photos stay on
              your device.
            </p>
          )}
        </section>

        <section className="chart-stage" aria-label="Colorwork Chart">
          <h2 className="visually-hidden">Colorwork Chart</h2>
          <p className="muted">Chart preview will appear here after generation.</p>
        </section>

        <section className="panel" aria-label="Color key">
          <h2>Color key</h2>
          <p className="muted">
            Chart colors and Yarn Inventory matches will appear here.
          </p>
        </section>
      </div>
    </div>
  );
}
