import { NarrativeEvent } from "@/types/lite";
import { TIME_CONFIG } from "./time-config";
import * as d3 from "d3";
import {
  createTimeScale,
  createNarrativeYAxis,
  createTimeXAxis,
  getDateFromRange,
  getTimeDomain,
  getXPosition,
  calculateDimensions,
  parseFlexibleDate,
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

// Process events into data points (uses shared parseFlexibleDate)

export function processEvents(events: NarrativeEvent[]): {
  dataPoints: DataPoint[];
  leadTitlePoints: LeadTitlePoint[];
} {
  const leadTitlePoints = events
    .filter((e) => e.lead_title)
    .map((event) => ({
      event,
      narrativeTime: event.temporal_anchoring.narrative_time,
      hasRealTime: !!event.temporal_anchoring.real_time,
    }));

  // Separate events into those with and without real_time
  const timePoints = events
    .filter((e) => e.temporal_anchoring.real_time)
    .map((event, i) => {
      const rt = event.temporal_anchoring.real_time;
      let parsed: Date | [Date, Date] | null = null;
      if (rt) {
        if (Array.isArray(rt)) {
          const start = parseFlexibleDate(rt[0], false);
          const end = parseFlexibleDate(rt[1], true);
          // Fallback: if one side missing, use the other
          if (start && end) parsed = [start, end];
          else if (start) parsed = start;
          else if (end) parsed = end;
        } else {
          parsed = parseFlexibleDate(rt, false);
        }
      }
      return {
        event,
        realTime: parsed,
        narrativeTime: event.temporal_anchoring.narrative_time,
        index: i,
        hasRealTime: !!parsed,
      };
    });

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

  return { dataPoints, leadTitlePoints };
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
  const yScale = d3
    .scaleLinear()
    .domain([0, Math.ceil(maxNarrativeTime) + 1])
    .range([0, height])
    .nice();

  return { xScale, yScale };
}

// Remove the old calculateDimensions function and use the shared one
export function getTimeDimensions(
  containerWidth: number,
  eventsLength: number
) {
  return calculateDimensions(containerWidth, eventsLength, TIME_CONFIG);
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
  yScale: d3.ScaleLinear<number, number>
) {
  return d3
    .line<DataPoint>()
    .defined((d) => d.hasRealTime)
    .x((d) => getXPosition(xScale, d.realTime))
    .y((d) => yScale(d.narrativeTime))
    .curve(d3.curveLinear);
}
