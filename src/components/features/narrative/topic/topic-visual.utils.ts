import { NarrativeEvent } from "@/types/data";
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
  minX?: number; // For date range groups
  maxX?: number; // For date range groups
  isExpanded: boolean;
}

// Process events into data points
export function processEvents(
  events: NarrativeEvent[],
  viewMode: "main" | "sub" = "sub"
): DataPoint[] {
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
export function getTopTopics(
  topicCounts: Map<string, number>,
  viewMode: "main" | "sub" = "sub"
): string[] {
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
  const spatialThreshold = 25; // Increased threshold for spatial distance (pixels)
  const temporalThreshold = 7 * 24 * 60 * 60 * 1000; // Increased to 7 days in milliseconds

  // Filter dataPoints for "sub" viewMode to only include points with subtopics
  const filteredDataPoints =
    viewMode === "sub"
      ? dataPoints.filter((point) => point.subTopics.length > 0)
      : dataPoints;

  // Helper function to check if two time ranges overlap or are close
  const areTemporallyRelated = (
    point1: DataPoint,
    point2: DataPoint
  ): boolean => {
    const getTimeRange = (point: DataPoint): [Date, Date] => {
      if (Array.isArray(point.realTime)) {
        return point.realTime;
      } else {
        return [point.realTime as Date, point.realTime as Date];
      }
    };

    const [start1, end1] = getTimeRange(point1);
    const [start2, end2] = getTimeRange(point2);

    // Check for overlap or proximity
    const gap1 = start2.getTime() - end1.getTime(); // Gap from end of 1 to start of 2
    const gap2 = start1.getTime() - end2.getTime(); // Gap from end of 2 to start of 1

    // They overlap if either gap is negative, or they're close if gap is within threshold
    return gap1 <= temporalThreshold && gap2 <= temporalThreshold;
  };

  // Helper function to get the visual span of a point (considering node width)
  const getVisualSpan = (
    point: DataPoint
  ): { startX: number; endX: number } => {
    const radius = TOPIC_CONFIG.point.radius;
    const visualPadding = radius * 0.8; // Add padding for more inclusive grouping

    if (Array.isArray(point.realTime)) {
      // Date range - visual span from start to end with padding
      const startX = getXPosition(xScale, point.realTime[0]);
      const endX = getXPosition(xScale, point.realTime[1]);
      return {
        startX: startX - radius - visualPadding, // Include left cap + padding
        endX: endX + radius + visualPadding, // Include right cap + padding
      };
    } else {
      // Single point - visual span with padding
      const centerX = getXPosition(xScale, point.realTime);
      return {
        startX: centerX - radius - visualPadding,
        endX: centerX + radius + visualPadding,
      };
    }
  };

  // Helper function to check if two visual spans overlap
  const doVisualSpansOverlap = (
    span1: { startX: number; endX: number },
    span2: { startX: number; endX: number }
  ): boolean => {
    // Spans overlap if one starts before the other ends, and vice versa
    return span1.startX <= span2.endX && span2.startX <= span1.endX;
  };

  // Helper function to get the visual span of an entire group
  const getGroupVisualSpan = (
    group: GroupedPoint
  ): { startX: number; endX: number } => {
    if (group.minX !== undefined && group.maxX !== undefined) {
      // Group already has calculated bounds
      const radius = TOPIC_CONFIG.point.radius;
      const visualPadding = radius * 0.8; // Add padding for more inclusive grouping
      return {
        startX: group.minX - radius - visualPadding,
        endX: group.maxX + radius + visualPadding,
      };
    } else {
      // Calculate from individual points
      const spans = group.points.map(getVisualSpan);
      return {
        startX: Math.min(...spans.map((s) => s.startX)),
        endX: Math.max(...spans.map((s) => s.endX)),
      };
    }
  };

  // Helper function to check if point should be grouped with existing group
  const shouldGroupWith = (point: DataPoint, group: GroupedPoint): boolean => {
    // Must have same topic
    const pointTopic =
      viewMode === "main" ? point.mainTopic : point.subTopics[0];
    if (group.mainTopic !== pointTopic) return false;

    // Check temporal relationship with any point in the group
    const isTemporallyRelated = group.points.some((groupPoint) =>
      areTemporallyRelated(point, groupPoint)
    );

    // Get visual spans for overlap checking
    const pointSpan = getVisualSpan(point);
    const groupSpan = getGroupVisualSpan(group);
    const hasVisualOverlap = doVisualSpansOverlap(pointSpan, groupSpan);

    // Check if spans are close (within grouping tolerance)
    const proximityTolerance = TOPIC_CONFIG.point.radius * 1.5;
    const gapBetweenSpans = Math.min(
      Math.abs(pointSpan.startX - groupSpan.endX),
      Math.abs(groupSpan.startX - pointSpan.endX)
    );
    const areSpansClose = gapBetweenSpans <= proximityTolerance;

    // Group if temporally related OR visually overlapping OR spans are close
    if (isTemporallyRelated || hasVisualOverlap || areSpansClose) return true;

    // Fallback to spatial distance for edge cases (much smaller threshold now)
    const pointX = getXPosition(xScale, point.realTime);
    const pointTopic_y = yScale(pointTopic);
    if (!pointTopic_y) return false;

    const pointY = pointTopic_y + yScale.bandwidth() / 2;
    const distance = Math.sqrt(
      Math.pow(pointX - group.x, 2) + Math.pow(pointY - group.y, 2)
    );

    // Increased spatial threshold for more aggressive grouping
    return distance < spatialThreshold;
  };

  filteredDataPoints.forEach((point) => {
    const x = getXPosition(xScale, point.realTime);
    const topic = viewMode === "main" ? point.mainTopic : point.subTopics[0]; // Only use first subtopic

    // Skip if topic is undefined or not in yScale domain (could happen if we filtered out some topics)
    if (!topic || !yScale(topic)) return;

    const y = yScale(topic)! + yScale.bandwidth() / 2;

    // Check if this point should be grouped with any existing group
    let foundGroup = false;
    for (const [key, group] of groups.entries()) {
      if (shouldGroupWith(point, group)) {
        // Add the point to the existing group
        group.points.push(point);
        foundGroup = true;
        break;
      }
    }

    // If no suitable group was found, create a new one
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

  // Calculate bounds for each group after all points are added
  const groupsArray = Array.from(groups.values());
  groupsArray.forEach((group) => {
    if (group.points.length > 1) {
      // For multi-point groups, calculate the date range bounds
      const allDates: Date[] = [];
      group.points.forEach((point) => {
        if (Array.isArray(point.realTime)) {
          allDates.push(point.realTime[0], point.realTime[1]);
        } else {
          allDates.push(point.realTime as Date);
        }
      });

      if (allDates.length > 0) {
        const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
        const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

        group.minX = getXPosition(xScale, minDate);
        group.maxX = getXPosition(xScale, maxDate);

        // Update the center x position to be the center of the date range
        group.x = (group.minX + group.maxX) / 2;
      }
    } else if (group.points.length === 1) {
      // For single point groups, check if it's a date range
      const point = group.points[0];
      if (Array.isArray(point.realTime)) {
        group.minX = getXPosition(xScale, point.realTime[0]);
        group.maxX = getXPosition(xScale, point.realTime[1]);
        group.x = (group.minX + group.maxX) / 2;
      }
    }
  });

  return groupsArray;
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
    // Use same size as time visualization - no scaling based on point count
    const baseSize = radius * 2;

    width = baseSize;
    height = baseSize;

    // Use standard radius for all nodes, same as time visualization
    rx = radius;
    ry = radius;
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
