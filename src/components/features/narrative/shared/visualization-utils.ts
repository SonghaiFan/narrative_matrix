import * as d3 from "d3";
import { SHARED_CONFIG } from "./visualization-config";

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

  // Add necessary scale methods to make it work with d3
  const finalScale = Object.assign(compositeScale, {
    domain: timeScale.domain,
    range: xScale.range,
    ticks: timeScale.ticks,
    tickFormat: timeScale.tickFormat,
    copy: function () {
      const newTimeScale = timeScale.copy();
      const newXScale = xScale.copy();
      const newCompositeScale = (date: Date) => newXScale(newTimeScale(date));
      return Object.assign(newCompositeScale, {
        domain: newTimeScale.domain,
        range: newXScale.range,
        ticks: newTimeScale.ticks,
        tickFormat: newTimeScale.tickFormat,
        copy: this.copy,
      });
    },
  });

  return finalScale;
}

// Generate ticks for time axis based on power scale
export function generateTimeTicks(startDate: Date, endDate: Date): Date[] {
  const ticks: Date[] = [];
  const baseYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  const totalYears = endYear - baseYear;

  // Use the power scale exponent from config to determine intervals
  for (let i = 0; i <= 10; i++) {
    // Apply inverse power scale to get non-linear distribution
    const progress = Math.pow(i / 10, 1 / SHARED_CONFIG.scale.timeExponent);
    const year = Math.floor(baseYear + progress * totalYears);
    if (year <= endYear) {
      ticks.push(new Date(year, 0, 1));
    }
  }
  return ticks;
}
