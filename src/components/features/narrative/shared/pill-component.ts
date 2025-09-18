import * as d3 from "d3";
import {
  calculatePillDimensions,
  calculatePillPosition,
} from "./visualization-utils";

export interface PillGeometryConfig {
  realTime: Date | [Date, Date] | null;
  xScale: any;
  radius: number;
  baseY: number;
  fallbackX?: number;
  centerX?: number;
}

export function applyPillGeometry(
  node: d3.Selection<SVGRectElement, any, any, any>,
  config: PillGeometryConfig
) {
  const { realTime, xScale, radius, baseY, fallbackX, centerX } = config;
  const position = calculatePillPosition(
    realTime,
    xScale,
    baseY,
    radius,
    fallbackX,
    centerX
  );
  const dimensions = calculatePillDimensions(realTime, xScale, radius);

  node
    .attr("x", position.x)
    .attr("y", position.y)
    .attr("width", dimensions.width)
    .attr("height", dimensions.height)
    .attr("rx", dimensions.rx)
    .attr("ry", dimensions.ry);

  return {
    position,
    dimensions,
  };
}

export interface GroupedPillMetricsConfig {
  x: number;
  y: number;
  radius: number;
  minX?: number;
  maxX?: number;
  realTime?: Date | [Date, Date] | null;
}

export interface GroupedPillMetrics {
  rectX: number;
  rectY: number;
  width: number;
  height: number;
  rx: number;
  ry: number;
  centerX: number;
  centerY: number;
  hasRange: boolean;
}

export function calculateGroupedPillMetrics(
  config: GroupedPillMetricsConfig
): GroupedPillMetrics {
  const { x, y, radius, minX, maxX, realTime } = config;
  const baseHeight = radius * 2;
  const defaultLeft = x - radius;
  const defaultRight = x + radius;

  const left =
    typeof minX === "number" && Number.isFinite(minX) ? minX : defaultLeft;
  const right =
    typeof maxX === "number" && Number.isFinite(maxX) ? maxX : defaultRight;

  const width = Math.max(right - left, baseHeight);
  const centerX = (left + right) / 2;
  const rectX = centerX - width / 2;
  const rectY = y - baseHeight / 2;
  const hasRange =
    Array.isArray(realTime) || Math.abs(right - left) > baseHeight + 0.5;

  return {
    rectX,
    rectY,
    width,
    height: baseHeight,
    rx: baseHeight / 2,
    ry: baseHeight / 2,
    centerX,
    centerY: y,
    hasRange,
  };
}

type D3Rect = d3.Selection<SVGRectElement, any, any, any>;

export interface SinglePillHandlersOptions<TDatum> {
  radius: number;
  hoverRadius: number;
  xScale: any;
  getBaseY: (datum: TDatum) => number;
  getFallbackX?: (datum: TDatum) => number | undefined;
  showTooltip?: (datum: TDatum, event: MouseEvent) => void;
  hideTooltip?: () => void;
  updatePosition?: (x: number, y: number) => void;
  onMouseEnterExtra?: (node: D3Rect, event: MouseEvent, datum: TDatum) => void;
  onMouseLeaveExtra?: (node: D3Rect, event: MouseEvent, datum: TDatum) => void;
  onClick?: (node: D3Rect, event: MouseEvent, datum: TDatum) => void;
}

export function createSinglePillHandlers<
  TDatum extends { realTime?: Date | [Date, Date] | null }
>(options: SinglePillHandlersOptions<TDatum>) {
  const {
    radius,
    hoverRadius,
    xScale,
    getBaseY,
    getFallbackX,
    showTooltip,
    hideTooltip,
    updatePosition,
    onMouseEnterExtra,
    onMouseLeaveExtra,
    onClick,
  } = options;

  const reset = (node: D3Rect, datum: TDatum, duration: number = 120) => {
    const baseY = getBaseY(datum);
    const fallbackX = getFallbackX?.(datum);
    const position = calculatePillPosition(
      datum.realTime ?? null,
      xScale,
      baseY,
      radius,
      fallbackX
    );
    const dimensions = calculatePillDimensions(
      datum.realTime ?? null,
      xScale,
      radius,
      1, // pointCount
      false, // isExpanded
      false, // isHovered
      0 // childCount
    );

    node
      .transition()
      .duration(duration)
      .attr("x", position.x)
      .attr("y", position.y)
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)
      .attr("rx", dimensions.rx)
      .attr("ry", dimensions.ry);
  };

  const handlers = {
    reset,
    mouseEnter(this: SVGRectElement, event: MouseEvent, datum: TDatum) {
      const node = d3.select<SVGRectElement, TDatum>(this);
      const baseY = getBaseY(datum);
      const centerY = baseY;
      const baseCenterX =
        parseFloat(node.attr("x")) + parseFloat(node.attr("width")) / 2;

      let newWidth = hoverRadius * 2;
      if (datum.realTime && Array.isArray(datum.realTime)) {
        const span = Math.abs(
          xScale(datum.realTime[1]) - xScale(datum.realTime[0])
        );
        newWidth = span + hoverRadius * 2;
      }

      node
        .raise()
        .transition()
        .duration(150)
        .attr("width", newWidth)
        .attr("height", hoverRadius * 2)
        .attr("x", baseCenterX - newWidth / 2)
        .attr("y", centerY - hoverRadius)
        .attr("rx", hoverRadius)
        .attr("ry", hoverRadius);

      showTooltip?.(datum, event);
      onMouseEnterExtra?.(node, event, datum);
    },
    mouseMove(this: SVGRectElement, event: MouseEvent) {
      updatePosition?.(event.pageX, event.pageY);
    },
    mouseLeave(this: SVGRectElement, event: MouseEvent, datum: TDatum) {
      const node = d3.select<SVGRectElement, TDatum>(this);
      reset(node, datum);
      hideTooltip?.();
      onMouseLeaveExtra?.(node, event, datum);
    },
    click(this: SVGRectElement, event: MouseEvent, datum: TDatum) {
      const node = d3.select<SVGRectElement, TDatum>(this);
      reset(node, datum, 120);
      onClick?.(node, event, datum);
    },
  };

  return handlers;
}
