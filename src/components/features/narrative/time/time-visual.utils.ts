import { NarrativeEvent } from "@/types/narrative/lite";
import { TIME_CONFIG } from "./time-config";
import * as d3 from "d3";
import { createTimeScale } from "@/components/shared/visualization-utils";

export interface DataPoint {
  event: NarrativeEvent;
  realTime: Date | null;
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
    .map((event, i) => ({
      event,
      realTime: new Date(event.temporal_anchoring.real_time!),
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

  return { dataPoints, leadTitlePoints };
}

// Create sorted points for line drawing (only points with real time)
export function getSortedPoints(dataPoints: DataPoint[]): DataPoint[] {
  return [...dataPoints]
    .filter((d) => d.hasRealTime)
    .sort((a, b) => {
      const timeCompare = a.narrativeTime - b.narrativeTime;
      if (timeCompare !== 0) return timeCompare;
      return a.realTime!.getTime() - b.realTime!.getTime();
    });
}

// Get scales for the visualization
export function getScales(
  dataPoints: DataPoint[],
  width: number,
  height: number,
  currentTime?: Date
) {
  const timePoints = dataPoints.filter((d) => d.hasRealTime);
  const timeDomain = d3.extent(timePoints, (d) => d.realTime) as [Date, Date];
  const xScale = createTimeScale(width, timeDomain, currentTime);

  const maxNarrativeTime = Math.max(...dataPoints.map((d) => d.narrativeTime));
  const yScale = d3
    .scaleLinear()
    .domain([0, Math.ceil(maxNarrativeTime) + 1])
    .range([0, height])
    .nice();

  return { xScale, yScale };
}

// Create label data for force layout (only for points with real time)
export function createLabelData(
  dataPoints: DataPoint[],
  xScale: any, // Using any since we have a custom composite scale
  yScale: d3.ScaleLinear<number, number>
): LabelDatum[] {
  return dataPoints
    .filter((d) => d.hasRealTime)
    .map((d, i) => {
      const displayText = d.event.short_text || d.event.text;
      return {
        id: i,
        x: xScale(d.realTime!),
        y: yScale(d.narrativeTime) - 30,
        text:
          displayText.length > 30
            ? displayText.slice(0, 27) + "..."
            : displayText,
        point: {
          x: xScale(d.realTime!),
          y: yScale(d.narrativeTime),
        },
        width: 0,
        height: 0,
        fx: undefined,
        fy: undefined,
        index: d.index,
      };
    });
}

// Create force simulation for labels
export function createForceSimulation(
  labelData: LabelDatum[],
  width: number,
  height: number
) {
  return d3
    .forceSimulation<LabelDatum>(labelData)
    .force(
      "collision",
      d3
        .forceCollide<LabelDatum>()
        .radius((d) => Math.sqrt(d.width / 2 + d.height / 2))
        .strength(0.5)
    )
    .force(
      "y",
      d3
        .forceY<LabelDatum>()
        .y((d) => d.point.y - 30)
        .strength(0.15)
    )
    .force("boundary", () => {
      for (let node of labelData) {
        node.x = Math.max(
          node.width / 2,
          Math.min(width - node.width / 2, node.point.x)
        );
        node.y = Math.max(
          node.height / 2 - 2,
          Math.min(height - node.height / 2 + 2, node.y)
        );
      }
    });
}

// Calculate dimensions based on container and config
export function calculateDimensions(
  containerWidth: number,
  eventsLength: number
) {
  const minHeight =
    eventsLength * 20 + TIME_CONFIG.margin.top + TIME_CONFIG.margin.bottom;
  const containerHeight = Math.max(minHeight, TIME_CONFIG.minHeight);
  const width =
    containerWidth - TIME_CONFIG.margin.left - TIME_CONFIG.margin.right;
  const height =
    containerHeight - TIME_CONFIG.margin.top - TIME_CONFIG.margin.bottom;

  return {
    containerWidth,
    containerHeight,
    width,
    height,
  };
}

// Create axes for the visualization
export function createAxes(
  xScale: any, // Using any since we have a custom composite scale
  yScale: d3.ScaleLinear<number, number>
) {
  const xAxis = d3
    .axisTop(xScale)
    .tickSize(TIME_CONFIG.axis.tickSize)
    .tickPadding(TIME_CONFIG.axis.tickPadding)
    .ticks(5); // Limit number of ticks for better readability

  const yAxis = d3
    .axisLeft(yScale)
    .tickSize(TIME_CONFIG.axis.tickSize)
    .tickPadding(TIME_CONFIG.axis.tickPadding)
    .ticks(Math.ceil(yScale.domain()[1]))
    .tickFormat(d3.format("d"));

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
    .x((d) => xScale(d.realTime!))
    .y((d) => yScale(d.narrativeTime))
    .curve(d3.curveLinear);
}
