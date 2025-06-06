import { NarrativeEvent } from "@/types/data";
import { TIME_CONFIG } from "./time-config";
import * as d3 from "d3";
import {
  createTimeScale,
  createNarrativeYAxis,
  createTimeXAxis,
  getDateFromRange,
  getTimeDomain,
  getXPosition,
  calculateResponsiveDimensions,
} from "@/components/features/narrative/shared/visualization-utils";

export interface DataPoint {
  event: NarrativeEvent;
  realTime: Date | [Date, Date] | null;
  narrativeTime: number;
  index: number;
  hasRealTime: boolean;
}

export interface LabelDatum extends d3.SimulationNodeDatum {
  id: number;
  x: number;
  y: number;
  text: string;
  point: { x: number; y: number };
  width: number;
  height: number;
  index: number;
}

export interface LeadTitlePoint {
  event: NarrativeEvent;
  narrativeTime: number;
  hasRealTime: boolean;
}

// Process events into data points
export function processEvents(events: NarrativeEvent[]): {
  dataPoints: DataPoint[];
} {
  // Separate events into those with and without real_time
  const timePoints = events
    .filter((e) => e.temporal_anchoring.real_time)
    .map((event, i) => ({
      event,
      realTime: event.temporal_anchoring.real_time
        ? Array.isArray(event.temporal_anchoring.real_time)
          ? ([
              new Date(event.temporal_anchoring.real_time[0]),
              new Date(event.temporal_anchoring.real_time[1]),
            ] as [Date, Date])
          : new Date(event.temporal_anchoring.real_time)
        : null,
      narrativeTime: event.temporal_anchoring.narrative_time,
      index: i,
      hasRealTime: true,
    }));

  const noTimePoints = events
    .filter((e) => !e.temporal_anchoring.real_time)
    .map((event, i) => ({
      event,
      realTime: null,
      narrativeTime: event.temporal_anchoring.narrative_time,
      index: timePoints.length + i,
      hasRealTime: false,
    }));

  // Combine all points
  const dataPoints = [...timePoints, ...noTimePoints];

  return { dataPoints };
}

// Create sorted points for line drawing (only points with real time)
export function getSortedPoints(dataPoints: DataPoint[]): DataPoint[] {
  return [...dataPoints]
    .filter((d) => d.hasRealTime)
    .sort((a, b) => {
      const timeCompare = a.narrativeTime - b.narrativeTime;
      if (timeCompare !== 0) return timeCompare;

      const aTime = getDateFromRange(a.realTime);
      const bTime = getDateFromRange(b.realTime);
      return aTime!.getTime() - bTime!.getTime();
    });
}

// Get scales for the visualization
export function getScales(
  dataPoints: DataPoint[],
  width: number,
  height: number
) {
  const timePoints = dataPoints.filter((d) => d.hasRealTime);
  const timeDomain = getTimeDomain(timePoints);
  const xScale = createTimeScale(width, timeDomain);

  const maxNarrativeTime = Math.max(...dataPoints.map((d) => d.narrativeTime));
  const minNarrativeTime = Math.min(...dataPoints.map((d) => d.narrativeTime));
  const yScale = d3
    .scaleLinear()
    .domain([minNarrativeTime, Math.ceil(maxNarrativeTime)])
    .range([0, height])
    .nice();

  return { xScale, yScale };
}

// Calculate dimensions that fit content within container height
export function getTimeDimensions(
  containerWidth: number,
  containerHeight: number,
  eventsLength: number
) {
  return calculateResponsiveDimensions(
    containerWidth,
    containerHeight,
    eventsLength,
    TIME_CONFIG,
    30, // minEventHeight - minimum readable height
    120 // maxEventHeight - maximum comfortable height
  );
}

// Create axes for the visualization
export function createAxes(
  xScale: any, // Using any since we have a custom composite scale
  yScale: d3.ScaleLinear<number, number>
) {
  const xAxis = createTimeXAxis(xScale, TIME_CONFIG);
  const yAxis = createNarrativeYAxis(yScale);

  return { xAxis, yAxis };
}

// Create line generator for the path
export function createLineGenerator(
  xScale: any, // Using any since we have a custom composite scale
  yScale: d3.ScaleLinear<number, number>,
  publishX: number // Add publish date x position as parameter
) {
  return (
    d3
      .line<DataPoint>()
      // Remove the .defined() filter to connect all points
      .x((d) => {
        // For points with real time, use their position
        if (d.hasRealTime) {
          return getXPosition(xScale, d.realTime);
        }
        // For points without real time, use the publish date position
        return publishX;
      })
      .y((d) => yScale(d.narrativeTime))
      .curve(d3.curveLinear)
  );
}
