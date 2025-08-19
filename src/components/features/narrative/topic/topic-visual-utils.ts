import { NarrativeEvent } from "@/types/lite";
import * as d3 from "d3";
import { TOPIC_CONFIG } from "./topic-config";
import {
  createTimeScale,
  createTimeXAxis,
  getTimeDomain,
  getXPosition,
  parseFlexibleDate,
} from "@/components/features/narrative/shared/visualization-utils";
import { SHARED_CONFIG } from "@/components/features/narrative/shared/visualization-config";

export interface DataPoint {
  event: NarrativeEvent;
  mainTopic: string;
  subTopics: string[];
  narrativeTime: number;
  sentiment: number;
  sentimentPolarity: "positive" | "negative" | "neutral";
  text: string;
  realTime: Date | [Date, Date];
  index: number;
}

export interface Edge {
  source: DataPoint;
  target: DataPoint;
  mainTopic: string;
}

export interface GroupedPoint {
  key: string;
  points: DataPoint[];
  mainTopic: string;
  x: number;
  y: number;
  isExpanded: boolean;
  minX?: number; // For date range bounds
  maxX?: number; // For date range bounds
}

// Process events into data points
export function processEvents(events: NarrativeEvent[]): DataPoint[] {
  return events
    .filter((e) => e.temporal_anchoring.real_time)
    .map((event, index) => {
      const rt = event.temporal_anchoring.real_time;
      let realTime: Date | [Date, Date];
      if (Array.isArray(rt)) {
        const start = parseFlexibleDate(rt[0], false);
        const end = parseFlexibleDate(rt[1], true);
        if (start && end) realTime = [start, end];
        else if (start) realTime = start;
        else if (end) realTime = end;
        else realTime = new Date(NaN); // will be filtered implicitly later if needed
      } else {
        realTime = (parseFlexibleDate(rt, false) as Date) || new Date(NaN);
      }
      return {
        event,
        mainTopic: event.topic.main_topic,
        subTopics: event.topic.sub_topic,
        narrativeTime: event.temporal_anchoring.narrative_time,
        sentiment: event.topic.sentiment.intensity,
        sentimentPolarity: event.topic.sentiment.polarity,
        text: event.text,
        realTime,
        index,
      } as DataPoint;
    });
}

// Get unique topics and their counts
export function getTopicCounts(
  dataPoints: DataPoint[],
  viewMode: "main" | "sub" | "sentiment" = "sub"
): Map<string, number> {
  const topicCounts = new Map<string, number>();

  switch (viewMode) {
    case "main":
      dataPoints.forEach((point) => {
        topicCounts.set(
          point.mainTopic,
          (topicCounts.get(point.mainTopic) || 0) + 1
        );
      });
      break;
    case "sub":
      dataPoints.forEach((point) => {
        if (point.subTopics.length > 0) {
          const firstSubTopic = point.subTopics[0];
          topicCounts.set(
            firstSubTopic,
            (topicCounts.get(firstSubTopic) || 0) + 1
          );
        }
      });
      break;
    case "sentiment":
      dataPoints.forEach((point) => {
        const key = point.sentimentPolarity;
        topicCounts.set(key, (topicCounts.get(key) || 0) + 1);
      });
      break;
  }

  return topicCounts;
}

// Get all unique topics sorted by frequency, filtering out empty topics
export function getTopTopics(topicCounts: Map<string, number>): string[] {
  return Array.from(topicCounts.entries())
    .filter(([_, count]) => count > 0) // Filter out topics with no nodes
    .sort((a, b) => b[1] - a[1])
    .map(([topic]) => topic);
}

// Get scales for the visualization
export function getScales(
  dataPoints: DataPoint[],
  topTopics: string[],
  width: number,
  height: number
) {
  const yScale = d3
    .scaleBand()
    .domain(topTopics)
    .range([0, height])
    .padding(0.3);

  const timeDomain = getTimeDomain(dataPoints);
  const xScale = createTimeScale(width, timeDomain);

  return { xScale, yScale };
}

// Topic-specific axes (time on x, categorical band on y)
export function createAxes(
  xScale: any, // custom time scale (could be composite)
  yScale: d3.ScaleBand<string>,
  config = TOPIC_CONFIG
) {
  const xAxis = createTimeXAxis(xScale, config);
  const yAxis = d3
    .axisLeft(yScale)
    .tickSize(config.axis.tickSize)
    .tickPadding(config.axis.tickPadding);
  return { xAxis, yAxis };
}

// Calculate dimensions based on container and config
export function calculateDimensions(
  containerWidth: number,
  containerHeight: number
) {
  const { responsive } = SHARED_CONFIG;
}

// NEW DISTANCE-BASED GROUPING (preferred)
// Groups events on same categorical row by merging sequential pills whose spans overlap
// or whose gap is <= configured gapPx. This normalizes logic across view modes.
export function groupPointsByDistance(
  dataPoints: DataPoint[],
  xScale: any,
  yScale: d3.ScaleBand<string>,
  viewMode: "main" | "sub" | "sentiment" = "sub"
): GroupedPoint[] {
  const groups: GroupedPoint[] = [];

  // Configured horizontal gap threshold per mode
  const groupingCfg = TOPIC_CONFIG.grouping;
  const gapPx =
    viewMode === "main"
      ? groupingCfg.main.gapPx
      : viewMode === "sub"
      ? groupingCfg.sub.gapPx
      : 30; // sentiment mode: use a default small gap when clustering continuous single-date pills

  // Category accessor
  const category = (p: DataPoint): string | undefined => {
    if (viewMode === "main") return p.mainTopic || undefined;
    if (viewMode === "sub") return p.subTopics[0];
    return p.sentimentPolarity;
  };

  // Pre-filter for sub mode
  const filtered = dataPoints.filter((p) =>
    viewMode === "sub" ? p.subTopics.length > 0 : true
  );

  // Organize by category
  const byCat = d3.group(filtered, (p) => category(p) || "__none__");

  byCat.forEach((points, cat) => {
    if (cat === "__none__" || !yScale(cat)) return;
    const y = yScale(cat)! + yScale.bandwidth() / 2;

    // Map to span objects
    const spans = points.map((p) => {
      let start: number, end: number;
      if (Array.isArray(p.realTime)) {
        const [s, e] = p.realTime as [Date, Date];
        start = getXPosition(xScale, s);
        end = getXPosition(xScale, e);
        if (end < start) [start, end] = [end, start];
      } else {
        const cx = getXPosition(xScale, p.realTime as Date);
        start = cx - TOPIC_CONFIG.point.radius; // treat as pill
        end = cx + TOPIC_CONFIG.point.radius;
      }
      return { point: p, start, end };
    });

    // Sort spans left to right
    spans.sort((a, b) => a.start - b.start);

    // Sweep and group
    let current: { start: number; end: number; pts: DataPoint[] } | null = null;
    spans.forEach(({ point, start, end }) => {
      if (!current) {
        current = { start, end, pts: [point] };
        return;
      }
      // If overlapping or gap within threshold
      const gap = start > current.end ? start - current.end : 0;
      if (gap <= gapPx) {
        current.end = Math.max(current.end, end);
        current.pts.push(point);
      } else {
        // finalize current
        groups.push(buildGroup(current, cat, y));
        current = { start, end, pts: [point] };
      }
    });
    if (current) groups.push(buildGroup(current, cat, y));
  });

  return groups;

  function buildGroup(
    g: { start: number; end: number; pts: DataPoint[] },
    cat: string,
    y: number
  ): GroupedPoint {
    const centerX = (g.start + g.end) / 2;
    const key = `${cat}-dgrp-${groups.length}-${g.pts[0].index}`;
    return {
      key,
      points: g.pts,
      mainTopic: cat,
      x: centerX,
      y,
      isExpanded: false,
      minX: g.start + TOPIC_CONFIG.point.radius, // store boundaries aligning with prior logic expectations (center + radius offset)
      maxX: g.end - TOPIC_CONFIG.point.radius,
    };
  }
}

// Calculate positions for expanded child nodes
export function calculateExpandedPositions(
  group: GroupedPoint,
  radius: number
): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  const n = group.points.length;

  if (n === 1) {
    return [{ x: group.x, y: group.y }];
  }

  // Vertical alignment parameters
  const verticalSpacing = radius * 2.5; // Space between nodes vertically
  const totalHeight = (n - 1) * verticalSpacing; // Total height of the vertical arrangement
  const startY = group.y - totalHeight / 2; // Start from the top, centered around the parent

  // Distribute points vertically
  for (let i = 0; i < n; i++) {
    positions.push({
      x: group.x, // Keep x position the same as parent
      y: startY + i * verticalSpacing, // Distribute vertically
    });
  }

  return positions;
}

export function createTopicYAxis(
  yScale: d3.ScaleBand<string>,
  config = TOPIC_CONFIG
) {
  return d3
    .axisLeft(yScale)
    .tickSize(config.axis.tickSize)
    .tickPadding(config.axis.tickPadding);
}

// Utility functions for rectangle and text positioning
export function calculateRectDimensions(
  pointCount: number,
  radius: number,
  isExpanded: boolean = false,
  isHovered: boolean = false,
  childCount: number = 0
) {
  let width, height, rx, ry;

  if (isHovered) {
    width = radius * 2;
    height = radius * 2;
    rx = radius;
    ry = radius;
  } else if (isExpanded) {
    // When expanded, make the rectangle taller to encompass all child nodes
    // Calculate height based on number of child nodes
    const verticalSpacing = radius * 2.5; // Same as in calculateExpandedPositions
    const childHeight = childCount > 0 ? (childCount - 1) * verticalSpacing : 0;

    // Increase base size for expanded parent nodes
    const expandedBaseSize = radius * 3;

    // Base height plus space for children with additional padding
    height = Math.max(expandedBaseSize, childHeight + radius * 3);
    width = expandedBaseSize;

    // Keep corner radius proportional but smaller for the expanded state
    rx = radius * 0.8;
    ry = radius * 0.8;
  } else {
    // Scale parent node size based on child count
    const baseSize = radius * 2;
    const scaleFactor = Math.min(1 + (pointCount - 1) * 0.2, 2.5); // Scale up to 2.5x for larger groups

    width = pointCount > 1 ? baseSize * scaleFactor : baseSize;
    height = pointCount > 1 ? baseSize * scaleFactor : baseSize;

    // Corner radius scales proportionally with the size
    // Use a percentage of the width/height to maintain consistent rounded corners
    const cornerRadiusPercentage = 0.5; // 50% of the smaller dimension
    rx =
      pointCount > 1
        ? Math.min(width, height) * cornerRadiusPercentage
        : radius;
    ry =
      pointCount > 1
        ? Math.min(width, height) * cornerRadiusPercentage
        : radius;
  }

  return { width, height, rx, ry };
}

export function calculateRectPosition(
  x: number,
  y: number,
  width: number,
  height: number
) {
  const rectX = x - width / 2;
  const rectY = y - height / 2;
  return { rectX, rectY };
}

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

export function updateRectAndText(
  rect: d3.Selection<any, any, any, any>,
  text: d3.Selection<any, any, any, any> | null,
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
  const { rectX, rectY } = calculateRectPosition(x, y, width, height);
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
