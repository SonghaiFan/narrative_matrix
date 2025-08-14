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

export function createTimeScale(
  width: number,
  domain: [Date, Date],
  useLogScale: boolean = false
) {
  const timeScale = d3.scaleTime().domain(domain).range([0, width]);
  const powerScale = useLogScale
    ? d3
        .scalePow()
        .exponent(SHARED_CONFIG.scale.timeExponent)
        .domain([0, width])
        .range([0, width])
    : null;

  const scaleFunction = (date: Date) => {
    const linearPos = timeScale(date);
    return powerScale ? powerScale(linearPos) : linearPos;
  };

  // Calculate years span and determine tick settings
  const years =
    (domain[1].getTime() - domain[0].getTime()) / (1000 * 60 * 60 * 24 * 365);
  const tickConfig = getTickConfig(years);

  const finalScale = Object.assign(scaleFunction, {
    domain: timeScale.domain,
    range: powerScale?.range || timeScale.range,
    ticks: () => {
      const ticks = tickConfig.interval.range(domain[0], domain[1]);

      // Ensure domain boundaries are included
      if (ticks.length === 0 || ticks[0] > domain[0]) ticks.unshift(domain[0]);
      if (ticks[ticks.length - 1] < domain[1]) ticks.push(domain[1]);

      return ticks;
    },
    tickFormat: () => {
      let labelTracker = { lastPos: -Infinity, lastWidth: 0 };

      return (d: Date) => {
        const pos = scaleFunction(d);
        const text = tickConfig.format(d);
        const textWidth = estimateTextWidth(text);

        if (
          doLabelsOverlap(
            labelTracker.lastPos,
            labelTracker.lastWidth,
            pos,
            textWidth
          )
        ) {
          return ""; // Hide overlapping labels, keep tick marks
        }

        labelTracker.lastPos = pos;
        labelTracker.lastWidth = textWidth;
        return text;
      };
    },
    copy: () => createTimeScale(width, domain, useLogScale),
  });

  return finalScale;
}

function getTickConfig(years: number) {
  const configs = [
    {
      maxYears: 1,
      interval: d3.timeMonth.every(1)!,
      format: d3.timeFormat("%b %Y"),
    },
    {
      maxYears: 2,
      interval: d3.timeMonth.every(3)!,
      format: d3.timeFormat("%b %Y"),
    },
    {
      maxYears: 5,
      interval: d3.timeMonth.every(6)!,
      format: d3.timeFormat("%b %Y"),
    },
    {
      maxYears: 10,
      interval: d3.timeYear.every(1)!,
      format: d3.timeFormat("%Y"),
    },
    {
      maxYears: 20,
      interval: d3.timeYear.every(2)!,
      format: d3.timeFormat("%Y"),
    },
    {
      maxYears: Infinity,
      interval: d3.timeYear.every(10)!,
      format: d3.timeFormat("%Y"),
    },
  ];

  return configs.find((config) => years <= config.maxYears)!;
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
