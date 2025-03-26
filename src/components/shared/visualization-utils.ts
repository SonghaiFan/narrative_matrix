import * as d3 from "d3";

export function createTimeScale(width: number, domain: [Date, Date]) {
  // Create a time scale first to get proper time ticks
  const timeScale = d3.scaleTime().domain(domain).range([0, width]);

  // Create a power scale to transform the linear time scale into a logarithmic one
  const xScale = d3
    .scalePow()
    .exponent(2) // Use a larger exponent to give more space to recent dates
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
