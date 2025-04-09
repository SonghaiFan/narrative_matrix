import { NarrativeEvent } from "@/types/lite";
import * as d3 from "d3";
import { TOPIC_CONFIG } from "./topic-config";
import {
  createTimeScale,
  createTimeXAxis,
  getDateFromRange,
  getTimeDomain,
  getXPosition,
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
}

// Process events into data points
export function processEvents(events: NarrativeEvent[]): DataPoint[] {
  const validEvents = events.filter((e) => e.temporal_anchoring.real_time);
  return validEvents.map((event, index) => ({
    event,
    mainTopic: event.topic.main_topic,
    subTopics: event.topic.sub_topic,
    narrativeTime: event.temporal_anchoring.narrative_time,
    sentiment: event.topic.sentiment.intensity,
    sentimentPolarity: event.topic.sentiment.polarity,
    text: event.text,
    realTime: Array.isArray(event.temporal_anchoring.real_time)
      ? ([
          new Date(event.temporal_anchoring.real_time[0]),
          new Date(event.temporal_anchoring.real_time[1]),
        ] as [Date, Date])
      : new Date(event.temporal_anchoring.real_time as string),
    index,
  }));
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
  xScale: any, // Using any since we have a custom composite scale
  yScale: d3.ScaleBand<string>,
  viewMode: "main" | "sub" = "sub"
): GroupedPoint[] {
  const groups: Map<string, GroupedPoint> = new Map();
  const threshold = 10; // Threshold for considering points as overlapping

  // Filter dataPoints for "sub" viewMode to only include points with subtopics
  const filteredDataPoints =
    viewMode === "sub"
      ? dataPoints.filter((point) => point.subTopics.length > 0)
      : dataPoints;

  filteredDataPoints.forEach((point) => {
    const x = getXPosition(xScale, point.realTime);
    const topic = viewMode === "main" ? point.mainTopic : point.subTopics[0]; // Only use first subtopic

    // Skip if topic is undefined or not in yScale domain (could happen if we filtered out some topics)
    if (!topic || !yScale(topic)) return;

    const y = yScale(topic)! + yScale.bandwidth() / 2;

    // Check if this point overlaps with any existing group
    let foundGroup = false;
    for (const [key, group] of groups.entries()) {
      const distance = Math.sqrt(
        Math.pow(x - group.x, 2) + Math.pow(y - group.y, 2)
      );

      // If the point is close enough to an existing group and has the same topic
      if (
        distance < threshold &&
        ((viewMode === "main" && group.mainTopic === point.mainTopic) ||
          (viewMode === "sub" && group.mainTopic === point.subTopics[0]))
      ) {
        // Add the point to the existing group
        group.points.push(point);
        foundGroup = true;
        break;
      }
    }

    // If no overlapping group was found, create a new one
    if (!foundGroup) {
      const groupKey = `group-${groups.size + 1}-${point.index}`;
      const groupTopic =
        viewMode === "main" ? point.mainTopic : point.subTopics[0];

      groups.set(groupKey, {
        key: groupKey,
        points: [point],
        mainTopic: groupTopic,
        x,
        y,
        isExpanded: false,
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
