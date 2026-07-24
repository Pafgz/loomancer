import { useCallback, useRef, type PointerEvent, type TouchEvent, type WheelEvent } from "react";
import type { CropRect } from "../domain/models";
import {
  frameDeltaToCropDelta,
  panCrop,
  zoomCrop,
} from "../image/framing";

type CropFrameProps = {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  crop: CropRect;
  onCropChange: (crop: CropRect) => void;
};

/**
 * Fixed-frame framing control: drag to pan the photo, pinch or scroll to zoom.
 * Updates are local only — the parent decides when to Apply.
 */
export function CropFrame({
  imageUrl,
  imageWidth,
  imageHeight,
  crop,
  onCropChange,
}: CropFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const cropRef = useRef(crop);
  cropRef.current = crop;
  const dragRef = useRef<{
    pointerId: number;
    lastX: number;
    lastY: number;
  } | null>(null);
  const pinchRef = useRef<{
    distance: number;
    crop: CropRect;
  } | null>(null);

  const applyPan = useCallback(
    (dxPx: number, dyPx: number) => {
      const frame = frameRef.current;
      if (!frame) {
        return;
      }
      const current = cropRef.current;
      const { dx, dy } = frameDeltaToCropDelta(
        current,
        frame.clientWidth,
        dxPx,
        dyPx,
      );
      const next = panCrop(current, dx, dy, imageWidth, imageHeight);
      cropRef.current = next;
      onCropChange(next);
    },
    [imageHeight, imageWidth, onCropChange],
  );

  const applyZoom = useCallback(
    (factor: number) => {
      const next = zoomCrop(cropRef.current, factor, imageWidth, imageHeight);
      cropRef.current = next;
      onCropChange(next);
    },
    [imageHeight, imageWidth, onCropChange],
  );

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (pinchRef.current) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY,
    };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || pinchRef.current) {
      return;
    }
    const dx = event.clientX - drag.lastX;
    const dy = event.clientY - drag.lastY;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    applyPan(dx, dy);
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  }

  function onTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (event.touches.length === 2) {
      dragRef.current = null;
      const [a, b] = [event.touches[0], event.touches[1]];
      if (!a || !b) {
        return;
      }
      const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      pinchRef.current = { distance, crop };
    }
  }

  function onTouchMove(event: TouchEvent<HTMLDivElement>) {
    const pinch = pinchRef.current;
    if (!pinch || event.touches.length !== 2) {
      return;
    }
    event.preventDefault();
    const [a, b] = [event.touches[0], event.touches[1]];
    if (!a || !b) {
      return;
    }
    const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    if (pinch.distance <= 0) {
      return;
    }
    const factor = distance / pinch.distance;
    onCropChange(zoomCrop(pinch.crop, factor, imageWidth, imageHeight));
  }

  function onTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (event.touches.length < 2) {
      pinchRef.current = null;
    }
  }

  function onWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const factor = event.deltaY > 0 ? 0.92 : 1.08;
    applyZoom(factor);
  }

  const aspect = crop.height > 0 ? crop.width / crop.height : 1;

  return (
    <div className="crop-frame-stack">
      <div
        ref={frameRef}
        className="crop-frame"
        data-testid="crop-preview"
        data-crop={`${crop.x},${crop.y},${crop.width},${crop.height}`}
        style={{ aspectRatio: `${aspect}` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onWheel={onWheel}
        role="img"
        aria-label="Framing preview. Drag to pan, pinch or scroll to zoom."
      >
        <img
          src={imageUrl}
          alt="Source preview"
          draggable={false}
          style={{
            width: `${(imageWidth / Math.max(1, crop.width)) * 100}%`,
            height: `${(imageHeight / Math.max(1, crop.height)) * 100}%`,
            maxWidth: "none",
            maxHeight: "none",
            marginLeft: `${(-crop.x / Math.max(1, crop.width)) * 100}%`,
            marginTop: `${(-crop.y / Math.max(1, crop.height)) * 100}%`,
          }}
        />
      </div>
      <div className="crop-frame-zoom" role="group" aria-label="Zoom">
        <button
          type="button"
          className="icon"
          aria-label="Zoom out"
          onClick={() => applyZoom(0.85)}
        >
          −
        </button>
        <button
          type="button"
          className="icon"
          aria-label="Zoom in"
          onClick={() => applyZoom(1.18)}
        >
          +
        </button>
      </div>
    </div>
  );
}
