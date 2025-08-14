import { NarrativeEvent } from "@/types/lite";
import * as d3 from "d3";
import { TOPIC_CONFIG } from "./topic-config";
import {
  createTimeScale,
  createTimeXAxis,
  getDateFromRange,
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
  viewMode: "main" | "sub" = "sub"
): Map<string, number> {
  const topicCounts = new Map<string, number>();

  if (viewMode === "main") {
    // Count main topics
    dataPoints.forEach((point) => {
      topicCounts.set(
        point.mainTopic,
        (topicCounts.get(point.mainTopic) || 0) + 1
      );
    });
  } else {
    // Only count the first subtopic of each node
    dataPoints.forEach((point) => {
      if (point.subTopics.length > 0) {
        const firstSubTopic = point.subTopics[0];
        topicCounts.set(
          firstSubTopic,
          (topicCounts.get(firstSubTopic) || 0) + 1
        );
      }
    });
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

// Calculate dimensions based on container and config
export function calculateDimensions(
  containerWidth: number,
  containerHeight: number
) {
  const { responsive } = SHARED_CONFIG;

  // Ensure container dimensions are within bounds
  const boundedWidth = Math.min(
    Math.max(containerWidth, responsive.container.minWidth),
    responsive.container.maxWidth
  );
  const boundedHeight = Math.min(
    Math.max(containerHeight, responsive.container.minHeight),
    responsive.container.maxHeight
  );

  // Calculate usable dimensions accounting for margins
  const width = Math.max(
    0,
    boundedWidth - TOPIC_CONFIG.margin.left - TOPIC_CONFIG.margin.right
  );
  const height = Math.max(
    0,
    boundedHeight - TOPIC_CONFIG.margin.top - TOPIC_CONFIG.margin.bottom
  );

  return {
    containerWidth: boundedWidth,
    containerHeight: boundedHeight,
    width,
    height,
  };
}

// Create axes
export function createAxes(
  xScale: any, // Using any since we have a custom scale
  yScale: d3.ScaleBand<string>,
  config = TOPIC_CONFIG
) {
  const xAxis = createTimeXAxis(xScale, config);
  const yAxis = createTopicYAxis(yScale, config);

  return { xAxis, yAxis };
}

// Create edges between events based on narrative time
export function createEdges(
  dataPoints: DataPoint[],
  viewMode: "main" | "sub" = "sub"
): Edge[] {
  const edges: Edge[] = [];

  // Sort data points by narrative time
  const sortedPoints = [...dataPoints].sort(
    (a, b) => a.narrativeTime - b.narrativeTime
  );

  // Create edges between all events in narrative time sequence
  // This will connect events 1->2->4->6->7 in sequence
  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const current = sortedPoints[i];
    const next = sortedPoints[i + 1];

    // Create an edge with the appropriate topic based on viewMode
    if (viewMode === "main") {
      edges.push({
        source: current,
        target: next,
        mainTopic: current.mainTopic, // Use main topic for styling
      });
    } else {
      // For subtopics, create an edge for each shared subtopic
      const sharedSubTopics = current.subTopics.filter((subTopic) =>
        next.subTopics.includes(subTopic)
      );

      if (sharedSubTopics.length > 0) {
        // Create edges for shared subtopics
        sharedSubTopics.forEach((subTopic) => {
          edges.push({
            source: current,
            target: next,
            mainTopic: subTopic, // Use subtopic for styling
          });
        });
      } else {
        // If no shared subtopics, create a default edge
        edges.push({
          source: current,
          target: next,
          mainTopic: current.subTopics[0] || current.mainTopic, // Fallback to main topic if no subtopics
        });
      }
    }
  }

  return edges;
}

// Group overlapping points
export function groupOverlappingPoints(
  dataPoints: DataPoint[],
  xScale: any, // composite or time scale
  yScale: d3.ScaleBand<string>,
  viewMode: "main" | "sub" = "sub",
  proximityThreshold: number = 18 // px threshold for grouping close nodes
): GroupedPoint[] {
  const groups: Map<string, GroupedPoint> = new Map();

  // For sub view only keep points having at least one sub topic
  const filtered =
    viewMode === "sub"
      ? dataPoints.filter((p) => p.subTopics.length > 0)
      : dataPoints;

  filtered.forEach((point) => {
    const topic = viewMode === "main" ? point.mainTopic : point.subTopics[0];
    if (!topic || !yScale(topic)) return; // skip if filtered out

    const y = yScale(topic)! + yScale.bandwidth() / 2;
    const centerX = getXPosition(xScale, point.realTime);

    // Determine horizontal span of the point (date range vs single date)
    let spanMin = centerX;
    let spanMax = centerX;
    if (Array.isArray(point.realTime)) {
      const [startDate, endDate] = point.realTime;
      spanMin = getXPosition(xScale, startDate);
      spanMax = getXPosition(xScale, endDate);
      if (spanMax < spanMin) {
        // Swap if order is reversed for any reason
        [spanMin, spanMax] = [spanMax, spanMin];
      }
    }

    // Try to merge into an existing group on same topic if:
    // 1. Horizontal spans overlap or are within proximityThreshold
    // 2. Vertical distance (different topics) not relevant because topic must match
    // 3. For single points treat them as a small pill of width ~ 2*radius
    let merged = false;
    for (const group of groups.values()) {
      if (group.mainTopic !== topic) continue;

      // Compute overlap / closeness
      const gMin = group.minX ?? group.x;
      const gMax = group.maxX ?? group.x;

      const horizontallyClose =
        spanMin <= gMax + proximityThreshold &&
        spanMax >= gMin - proximityThreshold;

      if (horizontallyClose) {
        group.points.push(point);
        // Update span bounds
        group.minX = Math.min(gMin, spanMin);
        group.maxX = Math.max(gMax, spanMax);
        // Recompute visual center as midpoint of bounds (so later pills center align)
        group.x = (group.minX + group.maxX) / 2;
        merged = true;
        break;
      }
    }

    if (!merged) {
      const key = `group-${groups.size + 1}-${point.index}`;
      groups.set(key, {
        key,
        points: [point],
        mainTopic: topic,
        x: (spanMin + spanMax) / 2,
        y,
        isExpanded: false,
        minX: spanMin,
        maxX: spanMax,
      });
    }
  });

  return Array.from(groups.values());
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

// Helper function to calculate proper collapsed dimensions considering date range bounds
export function calculateCollapsedDimensions(d: GroupedPoint) {
  const hasDateRangeBounds = d.minX !== undefined && d.maxX !== undefined;

  if (hasDateRangeBounds) {
    // For date range groups, maintain the capsule shape
    const spanWidth = Math.max(
      d.maxX! - d.minX! + TOPIC_CONFIG.point.radius * 2,
      TOPIC_CONFIG.point.radius * 2
    );

    return {
      x: d.minX! - TOPIC_CONFIG.point.radius + spanWidth / 2, // Center of the capsule
      y: d.y,
      width: spanWidth,
      height: TOPIC_CONFIG.point.radius * 2,
      rx: TOPIC_CONFIG.point.radius,
      ry: TOPIC_CONFIG.point.radius,
      rectX: d.minX! - TOPIC_CONFIG.point.radius,
      rectY: d.y - TOPIC_CONFIG.point.radius,
    };
  } else {
    // For single points, use the traditional logic
    const dimensions = calculateRectDimensions(
      d.points.length,
      TOPIC_CONFIG.point.radius
    );
    const position = calculateRectPosition(
      d.x,
      d.y,
      dimensions.width,
      dimensions.height
    );

    return {
      x: d.x,
      y: d.y,
      width: dimensions.width,
      height: dimensions.height,
      rx: dimensions.rx,
      ry: dimensions.ry,
      rectX: position.rectX,
      rectY: position.rectY,
    };
  }
}
