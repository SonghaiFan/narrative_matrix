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
    tickInterval = d3.timeYear.every(1)!;
    tickFormat = d3.timeFormat("%Y");
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
export function createNarrativeYAxis(yScale: d3.ScaleLinear<number, number>) {
  return d3
    .axisLeft(yScale)
    .tickSize(5)
    .tickPadding(5)
    .ticks(Math.ceil(yScale.domain()[1]))
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
