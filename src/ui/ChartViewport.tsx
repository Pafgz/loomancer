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
} from "react";
import type { ColorworkChart } from "../domain/models";
import {
  CHART_CELL_PX,
  CHART_GAP_PX,
  chartCellAtStagePoint,
  chartCellLine,
  chartCellRect,
  chartContentSize,
  clampChartScale,
  computeFitScale,
  type ChartCell,
  type ChartViewTransform,
} from "./chart-viewport-math";
import {
  configureChartCellText,
  drawChartCell,
  drawColorworkChart,
} from "./draw-colorwork-chart";

/** Pan distance for one arrow-key press (Shift multiplies it). */
const PAN_STEP_PX = 40;

type ChartViewportProps = {
  chart: ColorworkChart;
  showSymbols?: boolean;
  onShowSymbolsChange?: (show: boolean) => void;
  toolbarExtra?: ReactNode;
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
  /** Palette index the pointer paints with; null means the drag pans instead. */
  activePaintIndex?: number | null;
  onActivePaintIndexChange?: (index: number | null) => void;
  /** Called once per stroke, never once per stitch, so undo stays one step. */
  onPaintCells?: (cells: ChartCell[]) => void;
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
  activePaintIndex = null,
  onActivePaintIndexChange,
  onPaintCells,
}: ChartViewportProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [fitted, setFitted] = useState(true);
  const [cursor, setCursor] = useState<ChartCell>({ x: 0, y: 0 });
  const hintId = useId();

  const canPaint = !!onPaintCells && !!onActivePaintIndexChange;
  const paintEntry =
    activePaintIndex === null ? undefined : chart.palette[activePaintIndex];
  const painting = canPaint && !!paintEntry;

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

  const redrawChart = useCallback(() => {
    const context = canvasRef.current?.getContext("2d");
    if (context) {
      drawColorworkChart(context, chart, { showSymbols });
    }
  }, [chart, showSymbols]);

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

  // A resize can leave the paint cursor outside the grid it belongs to.
  useEffect(() => {
    setCursor((current) => {
      const x = Math.min(current.x, chart.width - 1);
      const y = Math.min(current.y, chart.height - 1);
      return x === current.x && y === current.y ? current : { x, y };
    });
  }, [chart.width, chart.height]);

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

  // React's onWheel is passive, so preventDefault there cannot stop page
  // scroll. Own the listener so zoom stays on the chart, not the document.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }
    function onWheel(event: WheelEvent) {
      event.preventDefault();
      zoomBy(event.deltaY > 0 ? 0.9 : 1.1);
    }
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [zoomBy]);

  const dragRef = useRef<{
    pointerId: number;
    lastX: number;
    lastY: number;
  } | null>(null);
  const pinchRef = useRef<{
    distance: number;
    scale: number;
    centerX: number;
    centerY: number;
  } | null>(null);
  const strokeRef = useRef<{
    pointerId: number;
    last: ChartCell;
    cells: ChartCell[];
    seen: Set<string>;
  } | null>(null);

  function viewTransform(): ChartViewTransform {
    return {
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
      chartWidth: chart.width,
      chartHeight: chart.height,
      scale: scaleRef.current,
      translateX: txRef.current,
      translateY: tyRef.current,
    };
  }

  /** Pointer position relative to the stage's padding box, which the math expects. */
  function cellUnderPointer(clientX: number, clientY: number) {
    const stage = stageRef.current;
    if (!stage) {
      return null;
    }
    const rect = stage.getBoundingClientRect();
    return chartCellAtStagePoint(
      clientX - rect.left - stage.clientLeft,
      clientY - rect.top - stage.clientTop,
      viewTransform(),
    );
  }

  /**
   * Show the stroke on the canvas straight away. The real edit arrives on
   * release, so without this the chart would look frozen mid-drag.
   */
  function previewCells(cells: readonly ChartCell[]) {
    const context = canvasRef.current?.getContext("2d");
    if (!context || !paintEntry) {
      return;
    }
    if (showSymbols) {
      configureChartCellText(context, CHART_CELL_PX);
    }
    for (const cell of cells) {
      drawChartCell(context, paintEntry, cell.x, cell.y, { showSymbols });
    }
  }

  function extendStroke(cells: readonly ChartCell[]) {
    const stroke = strokeRef.current;
    if (!stroke) {
      return;
    }
    const fresh = cells.filter((cell) => !stroke.seen.has(`${cell.x},${cell.y}`));
    for (const cell of fresh) {
      stroke.seen.add(`${cell.x},${cell.y}`);
      stroke.cells.push(cell);
    }
    previewCells(fresh);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (pinchRef.current) {
      return;
    }

    // Primary button paints while a color is active; pan stays on the other
    // buttons, two fingers, and the arrow keys.
    if (painting && event.button === 0) {
      const cell = cellUnderPointer(event.clientX, event.clientY);
      if (!cell) {
        return;
      }
      event.currentTarget.setPointerCapture(event.pointerId);
      strokeRef.current = {
        pointerId: event.pointerId,
        last: cell,
        cells: [],
        seen: new Set(),
      };
      setCursor(cell);
      extendStroke([cell]);
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
    const stroke = strokeRef.current;
    if (stroke && stroke.pointerId === event.pointerId) {
      const cell = cellUnderPointer(event.clientX, event.clientY);
      if (cell) {
        extendStroke(chartCellLine(stroke.last, cell));
        stroke.last = cell;
      }
      return;
    }

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

    const stroke = strokeRef.current;
    if (stroke?.pointerId === event.pointerId) {
      strokeRef.current = null;
      if (stroke.cells.length > 0) {
        onPaintCells?.(stroke.cells);
      }
    }
  }

  function onTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (event.touches.length === 2) {
      dragRef.current = null;
      const [a, b] = [event.touches[0], event.touches[1]];
      if (!a || !b) {
        return;
      }
      // A second finger means the gesture was never a stroke: drop what it
      // drew and put the real chart back on screen.
      if (strokeRef.current) {
        strokeRef.current = null;
        redrawChart();
      }
      pinchRef.current = {
        distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        scale: scaleRef.current,
        centerX: (a.clientX + b.clientX) / 2,
        centerY: (a.clientY + b.clientY) / 2,
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

    // Two fingers also pan, which is the only way to move the chart on a touch
    // screen once one finger paints.
    const centerX = (a.clientX + b.clientX) / 2;
    const centerY = (a.clientY + b.clientY) / 2;
    txRef.current += centerX - pinch.centerX;
    tyRef.current += centerY - pinch.centerY;
    pinch.centerX = centerX;
    pinch.centerY = centerY;

    applyTransform();
    markUnfitted();
  }

  function onTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (event.touches.length < 2) {
      pinchRef.current = null;
    }
  }

  function moveCursor(dx: number, dy: number) {
    setCursor((current) => ({
      x: Math.min(chart.width - 1, Math.max(0, current.x + dx)),
      y: Math.min(chart.height - 1, Math.max(0, current.y + dy)),
    }));
  }

  /**
   * Keyboard parity with pointer pan/zoom: arrows pan, +/- zoom, 0 refits.
   * While a paint color is active the arrows drive the stitch cursor instead,
   * so painting has a keyboard path; Shift with an arrow still pans.
   */
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (painting && !event.shiftKey) {
      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          moveCursor(-1, 0);
          return;
        case "ArrowRight":
          event.preventDefault();
          moveCursor(1, 0);
          return;
        case "ArrowUp":
          event.preventDefault();
          moveCursor(0, -1);
          return;
        case "ArrowDown":
          event.preventDefault();
          moveCursor(0, 1);
          return;
        case "Enter":
        case " ":
          event.preventDefault();
          onPaintCells?.([cursor]);
          return;
        case "Escape":
          event.preventDefault();
          onActivePaintIndexChange?.(null);
          return;
        default:
          break;
      }
    }

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

      {canPaint ? (
        <div className="chart-paint-bar" role="group" aria-label="Paint color">
          <button
            type="button"
            className={painting ? "paint-tool" : "paint-tool is-active"}
            aria-pressed={!painting}
            onClick={() => onActivePaintIndexChange?.(null)}
          >
            Pan
          </button>
          {chart.palette.map((entry) => (
            <button
              key={entry.index}
              type="button"
              className={
                entry.index === activePaintIndex
                  ? "paint-tool paint-swatch is-active"
                  : "paint-tool paint-swatch"
              }
              aria-pressed={entry.index === activePaintIndex}
              aria-label={`Paint with ${entry.symbol} ${entry.yarnLabel ?? entry.hex}`}
              onClick={() =>
                onActivePaintIndexChange?.(
                  entry.index === activePaintIndex ? null : entry.index,
                )
              }
            >
              <span
                className="swatch"
                style={{ background: entry.hex }}
                aria-hidden="true"
              >
                {entry.symbol}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      <div
        ref={stageRef}
        className={
          painting ? "chart-viewport-stage is-painting" : "chart-viewport-stage"
        }
        tabIndex={0}
        role="group"
        aria-label={painting ? "Chart paint area" : "Chart pan and zoom area"}
        aria-describedby={hintId}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
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
          {painting ? (
            <div
              className="chart-paint-cursor"
              aria-hidden="true"
              style={chartCellRect(cursor.x, cursor.y, CHART_CELL_PX, CHART_GAP_PX)}
            />
          ) : null}
        </div>
      </div>

      <p id={hintId} className="visually-hidden">
        {painting
          ? "Arrow keys move the stitch cursor, Enter paints it, Escape stops painting. Hold Shift with an arrow key to pan, plus and minus zoom, zero refits the chart to the view."
          : "Arrow keys pan the chart, plus and minus zoom, zero refits it to the view. Hold Shift with an arrow key to pan faster."}
      </p>

      {painting ? (
        <p className="visually-hidden" role="status">
          Painting with {paintEntry.symbol}{" "}
          {paintEntry.yarnLabel ?? paintEntry.hex}. Cursor at stitch{" "}
          {cursor.x + 1}, row {cursor.y + 1}.
        </p>
      ) : null}
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
