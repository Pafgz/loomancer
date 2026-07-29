import { useId, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  pickSystemEyeDropperHex,
  sampleHexFromImageElement,
  supportsSystemEyeDropper,
} from "../image/sample-image-color";

type ImageEyedropperProps = {
  imageUrl: string;
  /** When set, picking applies immediately (add or replace). */
  onPick: (hex: string) => void;
  disabled?: boolean;
  /** Compact trigger label for the open/close control. */
  label?: string;
};

/**
 * Pick a yarn color from the Pattern Project's original photo.
 * Primary path: tap/click the preview (works on phones).
 * Secondary: system EyeDropper where the browser supports it.
 */
export function ImageEyedropper({
  imageUrl,
  onPick,
  disabled = false,
  label = "Pick from photo",
}: ImageEyedropperProps) {
  const panelId = useId();
  const imageRef = useRef<HTMLImageElement>(null);
  const [open, setOpen] = useState(false);
  const [previewHex, setPreviewHex] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canUseSystemPicker = supportsSystemEyeDropper();

  function commit(hex: string) {
    setPreviewHex(hex);
    setError(null);
    onPick(hex);
    setOpen(false);
  }

  function handlePointerSample(event: ReactPointerEvent<HTMLDivElement>) {
    const image = imageRef.current;
    if (!image) {
      return;
    }
    const hex = sampleHexFromImageElement(image, event.clientX, event.clientY);
    if (!hex) {
      setError("Could not read that pixel. Try another spot.");
      return;
    }
    commit(hex);
  }

  async function handleSystemPicker() {
    setError(null);
    const hex = await pickSystemEyeDropperHex();
    if (hex) {
      commit(hex);
    }
  }

  return (
    <div className="image-eyedropper">
      <div className="image-eyedropper-triggers">
        <button
          type="button"
          className={open ? "is-active" : undefined}
          aria-expanded={open}
          aria-controls={panelId}
          disabled={disabled}
          onClick={() => {
            setError(null);
            setOpen((value) => !value);
          }}
        >
          {label}
        </button>
        {canUseSystemPicker ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => void handleSystemPicker()}
            aria-label="Sample any on-screen color with the system eyedropper"
          >
            Eyedropper
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          id={panelId}
          className="image-eyedropper-panel"
          role="region"
          aria-label="Sample a color from the original photo"
        >
          <p className="hint">
            Tap or click the photo to sample a color
            {previewHex ? ` · last ${previewHex}` : ""}.
          </p>
          <div
            className="image-eyedropper-stage"
            onPointerDown={handlePointerSample}
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Original photo — tap to sample a color"
              draggable={false}
              decoding="async"
            />
          </div>
          {error ? (
            <p className="form-error" role="alert">
              <span aria-hidden="true">⚠</span>
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
