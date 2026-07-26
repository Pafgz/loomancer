import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type TouchEvent,
  type WheelEvent,
} from "react";
import type { ColorworkChart } from "../domain/models";
import {
  chartContentSize,
  clampChartScale,
  computeFitScale,
} from "./chart-viewport-math";
import { drawColorworkChart } from "./draw-colorwork-chart";

/** Pan distance for one arrow-key press (Shift multiplies it). */
const PAN_STEP_PX = 40;

type ChartViewportProps = {
  chart: ColorworkChart;
  showSymbols?: boolean;
  onShowSymbolsChange?: (show: boolean) => void;
  toolbarExtra?: ReactNode;
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
};

/**
 * Fit-to-viewport Colorwork Chart with pan + zoom.
 * Cells are painted on a canvas; pan/zoom mutate the transform via refs so
 * pointer moves do not re-render React.
 */
export function ChartViewport({
  chart,
  showSymbols = true,
  onShowSymbolsChange,
  toolbarExtra,
  fullscreen = false,
  onToggleFullscreen,
}: ChartViewportProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [fitted, setFitted] = useState(true);
  const hintId = useId();

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

  const scaleRef = useRef(1);
  const txRef = useRef(0);
  const tyRef = useRef(0);
  const fitScaleRef = useRef(fitScale);
  fitScaleRef.current = fitScale;

  const applyTransform = useCallback(() => {
    const world = worldRef.current;
    if (!world) {
      return;
    }
    world.style.transform = `translate(${txRef.current}px, ${tyRef.current}px) scale(${scaleRef.current})`;
  }, []);

  const fitToViewport = useCallback(
    (nextFit = fitScaleRef.current) => {
      scaleRef.current = nextFit;
      txRef.current = 0;
      tyRef.current = 0;
      applyTransform();
      setFitted(true);
    },
    [applyTransform],
  );

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

  useEffect(() => {
    if (viewport.width <= 0 || viewport.height <= 0) {
      return;
    }
    if (fitted) {
      fitToViewport(fitScale);
    }
  }, [
    chart.width,
    chart.height,
    fitScale,
    fitted,
    fitToViewport,
    viewport.width,
    viewport.height,
  ]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(content.width * dpr));
    canvas.height = Math.max(1, Math.round(content.height * dpr));
    canvas.style.width = `${content.width}px`;
    canvas.style.height = `${content.height}px`;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawColorworkChart(context, chart, { showSymbols });
  }, [chart, content.width, content.height, showSymbols]);

  const markUnfitted = useCallback(() => {
    setFitted((was) => (was ? false : was));
  }, []);

  const zoomBy = useCallback(
    (factor: number) => {
      const next = clampChartScale(
        scaleRef.current * factor,
        fitScaleRef.current,
      );
      scaleRef.current = next;
      applyTransform();
      const nowFitted =
        Math.abs(next - fitScaleRef.current) < 0.001 &&
        txRef.current === 0 &&
        tyRef.current === 0;
      setFitted(nowFitted);
    },
    [applyTransform],
  );

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
    txRef.current += dx;
    tyRef.current += dy;
    applyTransform();
    markUnfitted();
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
    scaleRef.current = clampChartScale(
      pinch.scale * (distance / pinch.distance),
      fitScaleRef.current,
    );
    applyTransform();
    markUnfitted();
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

  /** Keyboard parity with pointer pan/zoom: arrows pan, +/- zoom, 0 refits. */
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? PAN_STEP_PX * 4 : PAN_STEP_PX;
    let dx = 0;
    let dy = 0;

    switch (event.key) {
      case "ArrowLeft":
        dx = step;
        break;
      case "ArrowRight":
        dx = -step;
        break;
      case "ArrowUp":
        dy = step;
        break;
      case "ArrowDown":
        dy = -step;
        break;
      case "+":
      case "=":
        event.preventDefault();
        zoomBy(1.18);
        return;
      case "-":
      case "_":
        event.preventDefault();
        zoomBy(0.85);
        return;
      case "0":
        event.preventDefault();
        fitToViewport();
        return;
      default:
        return;
    }

    event.preventDefault();
    txRef.current += dx;
    tyRef.current += dy;
    applyTransform();
    markUnfitted();
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
        {onShowSymbolsChange ? (
          <button
            type="button"
            aria-pressed={showSymbols}
            aria-label={showSymbols ? "Hide chart symbols" : "Show chart symbols"}
            onClick={() => onShowSymbolsChange(!showSymbols)}
          >
            {showSymbols ? "Symbols on" : "Symbols off"}
          </button>
        ) : null}
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
        tabIndex={0}
        role="group"
        aria-label="Chart pan and zoom area"
        aria-describedby={hintId}
        onKeyDown={onKeyDown}
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
          ref={worldRef}
          className="chart-viewport-world"
          style={{
            width: content.width,
            height: content.height,
            marginLeft: -content.width / 2,
            marginTop: -content.height / 2,
            transform: `translate(${txRef.current}px, ${tyRef.current}px) scale(${scaleRef.current})`,
          }}
        >
          <div className="chart-grid chart-grid-canvas">
            <canvas
              ref={canvasRef}
              role="img"
              aria-label={chartDescription(chart)}
            />
          </div>
        </div>
      </div>

      <p id={hintId} className="visually-hidden">
        Arrow keys pan the chart, plus and minus zoom, zero refits it to the
        view. Hold Shift with an arrow key to pan faster.
      </p>
    </div>
  );
}

/**
 * Text alternative for the chart canvas. Colors alone are not a channel a
 * screen reader can use, so the label names the size and the palette symbols.
 */
function chartDescription(chart: ColorworkChart): string {
  const size = `${chart.width} by ${chart.height} stitch Colorwork Chart`;
  if (chart.palette.length === 0) {
    return size;
  }
  const colors = chart.palette
    .map(
      (entry) =>
        `${entry.symbol} ${entry.yarnLabel ?? entry.hex} (${entry.stitchCount} stitches)`,
    )
    .join(", ");
  return `${size}. ${chart.palette.length} colors: ${colors}. Export the chart for a readable copy.`;
}
