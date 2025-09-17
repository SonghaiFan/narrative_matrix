import * as d3 from "d3";
import { SHARED_CONFIG } from "./visualization-config";

// Flexible date parsing: supports year, year-month, unpadded month/day, and full dates
export function parseFlexibleDate(raw: any, isRangeEnd = false): Date | null {
  if (!raw) return null;
  if (raw instanceof Date) return raw;
  if (typeof raw !== "string") {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }
  let s = raw.trim();
  if (/^\d{4}$/.test(s)) {
    // Year only
    s = isRangeEnd ? `${s}-12-31` : `${s}-01-01`;
  } else if (/^\d{4}-\d{1,2}$/.test(s)) {
    // Year-month
    const [y, m] = s.split("-");
    const mm = m.padStart(2, "0");
    if (isRangeEnd) {
      const lastDay = new Date(parseInt(y), parseInt(mm), 0).getDate();
      s = `${y}-${mm}-${String(lastDay).padStart(2, "0")}`;
    } else {
      s = `${y}-${mm}-01`;
    }
  } else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) {
    // Pad month/day
    const [y, m, d] = s.split("-");
    s = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const date = new Date(s);
  return isNaN(date.getTime()) ? null : date;
}

// Helper function to check if two labels overlap
function doLabelsOverlap(
  pos1: number,
  width1: number,
  pos2: number,
  width2: number,
  padding: number = 10
): boolean {
  const left1 = pos1 - width1 / 2;
  const right1 = pos1 + width1 / 2;
  const left2 = pos2 - width2 / 2;
  const right2 = pos2 + width2 / 2;
  return !(right1 + padding < left2 || left1 > right2 + padding);
}

// Helper function to estimate text width
function estimateTextWidth(text: string): number {
  // Approximate width based on character count and average character width
  const avgCharWidth = 8;
  return text.length * avgCharWidth;
}

export function createTimeScale(width: number, domain: [Date, Date]) {
  // Create a time scale first to get proper time ticks
  const timeScale = d3.scaleTime().domain(domain).range([0, width]);

  // Create a power scale to transform the linear time scale into a logarithmic one
  const xScale = d3
    .scalePow()
    .exponent(SHARED_CONFIG.scale.timeExponent)
    .domain([0, width])
    .range([0, width]);

  // Create a composite scale function
  const compositeScale = (date: Date) => xScale(timeScale(date));

  // Calculate the time span in milliseconds
  const timeSpan = domain[1].getTime() - domain[0].getTime();
  const years = timeSpan / (1000 * 60 * 60 * 24 * 365);

  // Determine appropriate tick interval based on time span
  let tickInterval: d3.TimeInterval;
  let tickFormat: (date: Date) => string;

  if (years <= 1) {
    // For spans less than a year, show months
    tickInterval = d3.timeMonth.every(1)!;
    tickFormat = d3.timeFormat("%b %Y");
  } else if (years <= 2) {
    // For spans less than 2 years, show quarters
    tickInterval = d3.timeMonth.every(2)!;
    tickFormat = d3.timeFormat("%b %Y");
  } else if (years <= 5) {
    // For spans less than 5 years, show half years
    tickInterval = d3.timeMonth.every(5)!;
    tickFormat = d3.timeFormat("%b %Y");
  } else if (years <= 10) {
    // For spans less than 10 years, show years
    tickInterval = d3.timeYear.every(2)!;
    tickFormat = d3.timeFormat("%Y");
  } else if (years <= 20) {
    // For spans less than 20 years, show every 2 years
    tickInterval = d3.timeYear.every(5)!;
    tickFormat = d3.timeFormat("%Y");
  } else {
    // For larger spans, show every 5 years
    tickInterval = d3.timeYear.every(10)!;
    tickFormat = d3.timeFormat("%Y");
  }

  // Keep track of visible labels to check for overlaps
  let lastLabelPos = -Infinity;
  let lastLabelWidth = 0;

  // Add necessary scale methods to make it work with d3
  const finalScale = Object.assign(compositeScale, {
    domain: timeScale.domain,
    range: xScale.range,
    ticks: () => {
      // Generate ticks using the determined interval
      const ticks = tickInterval.range(domain[0], domain[1]);

      // Add the end date if it's not included
      if (ticks[ticks.length - 1] < domain[1]) {
        ticks.push(domain[1]);
      }

      // Reset label tracking when generating new ticks
      lastLabelPos = -Infinity;
      lastLabelWidth = 0;

      return ticks;
    },
    tickFormat: () => {
      const format = tickFormat;
      return (d: Date) => {
        const pos = xScale(timeScale(d));
        const text = format(d);
        const width = estimateTextWidth(text);

        // Check if this label would overlap with the previous one
        if (doLabelsOverlap(lastLabelPos, lastLabelWidth, pos, width)) {
          return ""; // Hide this label
        }

        // Update the last label position and width
        lastLabelPos = pos;
        lastLabelWidth = width;
        return text;
      };
    },
    copy: function () {
      const newTimeScale = timeScale.copy();
      const newXScale = xScale.copy();
      const newCompositeScale = (date: Date) => newXScale(newTimeScale(date));
      return Object.assign(newCompositeScale, {
        domain: newTimeScale.domain,
        range: newXScale.range,
        ticks: this.ticks,
        tickFormat: this.tickFormat,
        copy: this.copy,
      });
    },
  });

  return finalScale;
}

// Generate ticks for time axis based on power scale
export function generateTimeTicks(startDate: Date, endDate: Date): Date[] {
  // This function is now deprecated as we're using d3's built-in tick generation
  // Return empty array to ensure backward compatibility
  return [];
}

// Create y-axis with integer ticks for narrative time
export function createNarrativeYAxis(
  yScale: d3.ScaleLinear<number, number>,
  config = SHARED_CONFIG
) {
  const maxNarrativeTime = Math.ceil(yScale.domain()[1]);
  const tickGap = config.axis.narrativeAxisTickGap || 1;
  const tickValues = Array.from(
    { length: Math.ceil(maxNarrativeTime / tickGap) + 1 },
    (_, i) => i * tickGap
  ).filter((t) => t <= maxNarrativeTime);

  return d3
    .axisLeft(yScale)
    .tickSize(config.axis.tickSize)
    .tickPadding(config.axis.tickPadding)
    .tickValues(tickValues)
    .tickFormat(d3.format("d"));
}

// Create x-axis for time scale
export function createTimeXAxis(xScale: any, config: any) {
  return d3
    .axisTop(xScale)
    .tickSize(config.axis.tickSize)
    .tickPadding(config.axis.tickPadding)
    .tickFormat(xScale.tickFormat());
}

// Shared utility for getting date from date range or single date
export function getDateFromRange(
  date: Date | [Date, Date] | null
): Date | null {
  if (!date) return null;
  return Array.isArray(date) ? date[0] : date;
}

// Shared utility for getting time domain from data points
export function getTimeDomain<
  T extends { realTime: Date | [Date, Date] | null }
>(dataPoints: T[]): [Date, Date] {
  const timePoints = dataPoints.filter((d) => d.realTime);
  return d3.extent(timePoints, (d) => getDateFromRange(d.realTime)) as [
    Date,
    Date
  ];
}

// Shared utility for getting x position from date range or single date
export function getXPosition(
  xScale: any,
  date: Date | [Date, Date] | null
): number {
  if (!date) return 0;
  // For date ranges, use the end date (right edge) for connections
  if (Array.isArray(date)) {
    return xScale(date[1]); // Return position of the end date without radius adjustment
    // (radius adjustment happens in the main component)
  }
  return xScale(date);
}

interface VisualizationConfig {
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  minHeight: number;
}

/**
 * Calculate dimensions for visualizations based on container size and event count
 */
export function calculateDimensions(
  containerWidth: number,
  eventsLength: number,
  config: VisualizationConfig
) {
  const width = containerWidth - config.margin.left - config.margin.right;
  const minHeight =
    eventsLength * SHARED_CONFIG.responsive.content.eventHeight +
    config.margin.top +
    config.margin.bottom;
  const containerHeight = Math.max(minHeight, config.minHeight);
  const height = containerHeight - config.margin.top - config.margin.bottom;

  return {
    containerWidth,
    width,
    containerHeight,
    height,
  };
}

// ============================================================================
// UNIFIED PILL POSITIONING AND SIZING UTILITIES
// ============================================================================

/**
 * Calculate pill dimensions for any node (child or parent)
 * @param realTime - Date, date range, or null (for child nodes)
 * @param xScale - D3 scale function
 * @param radius - Base radius for the pill
 * @param pointCount - Number of points in group (for parent nodes)
 * @param isExpanded - Whether parent node is expanded
 * @param isHovered - Whether node is being hovered
 * @param childCount - Number of child nodes (for expanded parent state)
 * @returns Object with width, height, rx, ry
 */
export function calculatePillDimensions(
  realTime: Date | [Date, Date] | null,
  xScale: any,
  radius: number,
  pointCount: number = 1,
  isExpanded: boolean = false,
  isHovered: boolean = false,
  childCount: number = 0
) {
  const baseSize = radius * 2;

  // Handle hover state first (applies to all nodes)
  if (isHovered) {
    return {
      width: baseSize,
      height: baseSize,
      rx: radius,
      ry: radius,
    };
  }

  // Handle expanded parent state
  if (isExpanded && pointCount > 1) {
    const verticalSpacing = radius * 2.5;
    const childHeight = childCount > 0 ? (childCount - 1) * verticalSpacing : 0;
    const expandedBaseSize = radius * 3;
    const height = Math.max(expandedBaseSize, childHeight + radius * 3);

    return {
      width: expandedBaseSize,
      height,
      rx: radius * 0.8,
      ry: radius * 0.8,
    };
  }

  let rangeWidth: number | null = null;
  if (realTime && typeof xScale === "function") {
    if (Array.isArray(realTime)) {
      const startX = xScale(realTime[0]);
      const endX = xScale(realTime[1]);
      if (Number.isFinite(startX) && Number.isFinite(endX)) {
        rangeWidth = Math.max(Math.abs(endX - startX) + baseSize, baseSize);
      }
    } else {
      const centerX = xScale(realTime);
      if (Number.isFinite(centerX)) {
        rangeWidth = baseSize;
      }
    }
  }

  if (rangeWidth !== null) {
    return {
      width: rangeWidth,
      height: baseSize,
      rx: radius,
      ry: radius,
    };
  }

  // Handle collapsed parent nodes (fallback when no range is available)
  if (pointCount > 1) {
    return {
      width: baseSize,
      height: baseSize,
      rx: radius,
      ry: radius,
    };
  }

  // Default single-date sizing
  return {
    width: baseSize,
    height: baseSize,
    rx: radius,
    ry: radius,
  };
}

/**
 * Calculate pill position for any node (child or parent)
 * @param realTime - Date, date range, or null (for child nodes)
 * @param xScale - D3 scale function
 * @param y - Y coordinate
 * @param radius - Base radius for the pill
 * @param fallbackX - Fallback X position when no realTime (e.g., publish line)
 * @param centerX - Center X coordinate (for parent nodes with calculated position)
 * @returns Object with x, y coordinates
 */
export function calculatePillPosition(
  realTime: Date | [Date, Date] | null,
  xScale: any,
  y: number,
  radius: number,
  fallbackX?: number,
  centerX?: number
) {
  let x: number;

  // Use provided centerX for parent nodes
  if (centerX !== undefined) {
    x = centerX - radius;
  } else if (realTime) {
    if (Array.isArray(realTime)) {
      // Date range: position at start date
      x = xScale(realTime[0]) - radius;
    } else {
      // Single date: center the rectangle on the point
      x = xScale(realTime) - radius;
    }
  } else {
    // No date: use fallback position (e.g., publish line)
    x = (fallbackX || 0) - radius;
  }

  return {
    x,
    y: y - radius,
  };
}

// Legacy function names for backward compatibility
export const calculateRectDimensions = calculatePillDimensions;
export const calculateRectPosition = calculatePillPosition;

/**
 * Calculate rectangle position from center coordinates
 * @param x - Center X coordinate
 * @param y - Center Y coordinate
 * @param width - Rectangle width
 * @param height - Rectangle height
 * @returns Object with rectX, rectY (top-left coordinates)
 */
export function calculateRectPositionFromCenter(
  x: number,
  y: number,
  width: number,
  height: number
) {
  const rectX = x - width / 2;
  const rectY = y - height / 2;
  return { rectX, rectY };
}

/**
 * Calculate center point from rectangle coordinates
 * @param rectX - Rectangle top-left X coordinate
 * @param rectY - Rectangle top-left Y coordinate
 * @param width - Rectangle width
 * @param height - Rectangle height
 * @returns Object with centerX, centerY
 */
export function calculateCenterPoint(
  rectX: number,
  rectY: number,
  width: number,
  height: number
) {
  const centerX = rectX + width / 2;
  const centerY = rectY + height / 2;
  return { centerX, centerY };
}

/**
 * Update rectangle and text with smooth transitions
 * @param rect - D3 selection of rectangle element
 * @param text - D3 selection of text element (optional)
 * @param x - Center X coordinate
 * @param y - Center Y coordinate
 * @param width - Rectangle width
 * @param height - Rectangle height
 * @param rx - Rectangle corner radius X
 * @param ry - Rectangle corner radius Y
 * @param duration - Transition duration in ms
 * @param opacity - Opacity value
 * @param cursor - Cursor style
 * @returns Object with final rectangle coordinates
 */
export function updateRectAndText(
  rect: any,
  text: any | null,
  x: number,
  y: number,
  width: number,
  height: number,
  rx: number,
  ry: number,
  duration: number = 150,
  opacity: number = 1,
  cursor: string = "pointer"
) {
  const { rectX, rectY } = calculateRectPositionFromCenter(x, y, width, height);
  const { centerX, centerY } = calculateCenterPoint(
    rectX,
    rectY,
    width,
    height
  );

  const transition = rect.transition().duration(duration);

  transition
    .attr("width", width)
    .attr("height", height)
    .attr("x", rectX)
    .attr("y", rectY)
    .attr("rx", rx)
    .attr("ry", ry)
    .style("opacity", opacity)
    .style("cursor", cursor);

  if (text) {
    // Get the point count from the data attribute if available
    const pointCount = parseInt(rect.attr("data-point-count") || "1", 10);
    const fontSize = Math.min(10 + (pointCount - 1) * 0.5, 14);

    text
      .transition()
      .duration(duration)
      .attr("x", centerX)
      .attr("y", centerY)
      .style("font-size", `${fontSize}px`);
  }

  return { rectX, rectY, centerX, centerY };
}
