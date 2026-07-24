import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
  type TouchEvent,
  type WheelEvent,
} from "react";
import type { ColorworkChart } from "../domain/models";
import {
  CHART_CELL_PX,
  CHART_GAP_PX,
  chartContentSize,
  clampChartScale,
  computeFitScale,
} from "./chart-viewport-math";

type ChartViewportProps = {
  chart: ColorworkChart;
  toolbarExtra?: ReactNode;
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
};

/**
 * Fit-to-viewport Colorwork Chart with pan + zoom. Fit resets the view;
 * fullscreen is handled by the parent (same controls either way).
 */
export function ChartViewport({
  chart,
  toolbarExtra,
  fullscreen = false,
  onToggleFullscreen,
}: ChartViewportProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [fitted, setFitted] = useState(true);

  const content = chartContentSize(chart.width, chart.height);
  const fitScale =
    viewport.width > 0 && viewport.height > 0
      ? computeFitScale(
          content.width,
          content.height,
          viewport.width,
          viewport.height,
        )
      : 1;

  const scaleRef = useRef(scale);
  const txRef = useRef(tx);
  const tyRef = useRef(ty);
  const fitScaleRef = useRef(fitScale);
  scaleRef.current = scale;
  txRef.current = tx;
  tyRef.current = ty;
  fitScaleRef.current = fitScale;

  const fitToViewport = useCallback((nextFit = fitScaleRef.current) => {
    setScale(nextFit);
    setTx(0);
    setTy(0);
    setFitted(true);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      const { width, height } = entry.contentRect;
      setViewport({ width, height });
    });
    observer.observe(stage);
    const rect = stage.getBoundingClientRect();
    setViewport({ width: rect.width, height: rect.height });
    return () => observer.disconnect();
  }, [fullscreen]);

  // Re-fit when the chart size changes, or when the viewport changes while fitted.
  useEffect(() => {
    if (viewport.width <= 0 || viewport.height <= 0) {
      return;
    }
    if (fitted) {
      fitToViewport(fitScale);
    }
  }, [chart.width, chart.height, fitScale, fitted, fitToViewport, viewport.width, viewport.height]);

  const zoomBy = useCallback((factor: number) => {
    const next = clampChartScale(
      scaleRef.current * factor,
      fitScaleRef.current,
    );
    setScale(next);
    setFitted(Math.abs(next - fitScaleRef.current) < 0.001 && txRef.current === 0 && tyRef.current === 0);
  }, []);

  const dragRef = useRef<{
    pointerId: number;
    lastX: number;
    lastY: number;
  } | null>(null);
  const pinchRef = useRef<{ distance: number; scale: number } | null>(null);

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
    setTx((value) => value + dx);
    setTy((value) => value + dy);
    setFitted(false);
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
      pinchRef.current = {
        distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        scale: scaleRef.current,
      };
    }
  }

  function onTouchMove(event: TouchEvent<HTMLDivElement>) {
    const pinch = pinchRef.current;
    if (!pinch || event.touches.length !== 2) {
      return;
    }
    event.preventDefault();
    const [a, b] = [event.touches[0], event.touches[1]];
    if (!a || !b || pinch.distance <= 0) {
      return;
    }
    const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const next = clampChartScale(
      pinch.scale * (distance / pinch.distance),
      fitScaleRef.current,
    );
    setScale(next);
    setFitted(false);
  }

  function onTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (event.touches.length < 2) {
      pinchRef.current = null;
    }
  }

  function onWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    zoomBy(event.deltaY > 0 ? 0.9 : 1.1);
  }

  return (
    <div
      className={
        fullscreen ? "chart-viewport chart-viewport-fullscreen" : "chart-viewport"
      }
    >
      <div className="chart-viewport-toolbar" role="toolbar" aria-label="Chart view">
        <button
          type="button"
          onClick={() => fitToViewport()}
          aria-pressed={fitted}
        >
          Fit
        </button>
        <button
          type="button"
          className="icon"
          aria-label="Zoom out"
          onClick={() => zoomBy(0.85)}
        >
          −
        </button>
        <button
          type="button"
          className="icon"
          aria-label="Zoom in"
          onClick={() => zoomBy(1.18)}
        >
          +
        </button>
        {onToggleFullscreen ? (
          <button type="button" onClick={onToggleFullscreen}>
            {fullscreen ? "Exit full screen" : "Full screen"}
          </button>
        ) : null}
        {toolbarExtra}
      </div>

      <div
        ref={stageRef}
        className="chart-viewport-stage"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onWheel={onWheel}
      >
        <div
          className="chart-viewport-world"
          style={{
            width: content.width,
            height: content.height,
            marginLeft: -content.width / 2,
            marginTop: -content.height / 2,
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
          }}
        >
          <div
            className="chart-grid"
            role="table"
            aria-label={`${chart.width} by ${chart.height} Colorwork Chart`}
            style={{
              gridTemplateColumns: `repeat(${chart.width}, ${CHART_CELL_PX}px)`,
              gap: CHART_GAP_PX,
              width: content.width,
              height: content.height,
            }}
          >
            {chart.cells.map((cell, index) => {
              const entry = chart.palette[cell];
              const row = Math.floor(index / chart.width) + 1;
              const column = (index % chart.width) + 1;
              return (
                <span
                  key={`${row}-${column}`}
                  className="chart-cell"
                  role="cell"
                  aria-label={`Row ${row}, column ${column}, ${entry?.symbol ?? "?"} ${entry?.hex ?? ""}`}
                  style={{
                    backgroundColor: entry?.hex ?? "#ccc",
                    width: CHART_CELL_PX,
                    height: CHART_CELL_PX,
                    fontSize: Math.max(6, Math.round(CHART_CELL_PX * 0.42)),
                  }}
                >
                  <span className="chart-cell-symbol" aria-hidden="true">
                    {entry?.symbol}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
