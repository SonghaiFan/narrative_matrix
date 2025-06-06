import * as d3 from "d3";
import { SHARED_CONFIG } from "./visualization-config";

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

      // Ensure start date is included
      if (ticks.length === 0 || ticks[0] > domain[0]) {
        ticks.unshift(domain[0]);
      }

      // Ensure end date is included
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
 * Calculate responsive dimensions that fit content within the container height
 */
export function calculateResponsiveDimensions(
  containerWidth: number,
  containerHeight: number,
  eventsLength: number,
  config: VisualizationConfig,
  minEventHeight: number = 30,
  maxEventHeight: number = 120
) {
  const width = containerWidth - config.margin.left - config.margin.right;

  // Ensure we have a minimum container height
  const effectiveContainerHeight = Math.max(containerHeight, 400);
  const availableHeight =
    effectiveContainerHeight - config.margin.top - config.margin.bottom;

  // Calculate the height per event to fit all events in the available space
  // Ensure we always fit within the container by using floor division
  const calculatedEventHeight = Math.max(
    minEventHeight,
    Math.min(maxEventHeight, Math.floor(availableHeight / eventsLength))
  );

  // Calculate actual content height - this should never exceed availableHeight
  const contentHeight = Math.min(
    eventsLength * calculatedEventHeight,
    availableHeight
  );

  // Always use the original container height to ensure we fit within it
  return {
    containerWidth,
    width,
    containerHeight: effectiveContainerHeight,
    height: contentHeight,
    eventHeight: calculatedEventHeight,
  };
}
