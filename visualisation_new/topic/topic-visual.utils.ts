import { NarrativeEvent } from "@/types/data";
import * as d3 from "d3";
import { TOPIC_CONFIG } from "./topic-config";
import {
  createTimeScale,
  createTimeXAxis,
  getTimeDomain,
  getXPosition,
} from "@/components/visualisation/shared/visualization-utils";

export interface DataPoint {
  event: NarrativeEvent;
  mainTopic: string;
  subTopics: string[];
  narrativeTime: number;
  sentiment: number;
  sentimentPolarity: "positive" | "negative" | "neutral";
  semanticEmbedding: number;
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
  viewMode: "main" | "sub" | "sentiment" = "sub"
): DataPoint[] {
  const validEvents = events.filter((e) => e.temporal_anchoring.real_time);
  return validEvents.map((event, index) => ({
    event,
    mainTopic: event.topic.main_topic,
    subTopics: event.topic.sub_topic,
    narrativeTime: event.temporal_anchoring.narrative_time,
    sentiment: event.topic.sentiment.intensity,
    sentimentPolarity: event.topic.sentiment.polarity,
    semanticEmbedding: event.topic.semantic_embeddings.full_text_umap,
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
  viewMode: "main" | "sub" | "sentiment" = "sub"
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
  } else if (viewMode === "sentiment") {
    // Count sentiment polarities
    dataPoints.forEach((point) => {
      topicCounts.set(
        point.sentimentPolarity,
        (topicCounts.get(point.sentimentPolarity) || 0) + 1
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

// Get average semantic embedding for a topic
export function getTopicSemanticAverages(
  dataPoints: DataPoint[],
  viewMode: "main" | "sub" | "sentiment" = "sub"
): Map<string, number> {
  const topicEmbeddings = new Map<string, number[]>();

  dataPoints.forEach((point) => {
    let topic: string;
    if (viewMode === "main") {
      topic = point.mainTopic;
    } else if (viewMode === "sentiment") {
      topic = point.sentimentPolarity;
    } else {
      topic = point.subTopics[0] || point.mainTopic;
    }

    if (!topicEmbeddings.has(topic)) {
      topicEmbeddings.set(topic, []);
    }
    topicEmbeddings.get(topic)!.push(point.semanticEmbedding);
  });

  const averages = new Map<string, number>();
  for (const [topic, embeddings] of topicEmbeddings.entries()) {
    const average =
      embeddings.reduce((sum, val) => sum + val, 0) / embeddings.length;
    averages.set(topic, average);
  }

  return averages;
}

// Get all unique topics sorted by frequency or semantic similarity
export function getTopTopics(
  topicCounts: Map<string, number>,
  viewMode: "main" | "sub" | "sentiment" = "sub",
  dataPoints?: DataPoint[],
  sortBySemantic: boolean = false
): string[] {
  const topics = Array.from(topicCounts.entries())
    .filter(([_, count]) => count > 0) // Filter out topics with no nodes
    .map(([topic]) => topic);

  // For sentiment view, ensure consistent ordering
  if (viewMode === "sentiment") {
    const sentimentOrder = ["positive", "neutral", "negative"];
    return topics.sort((a, b) => {
      const aIndex = sentimentOrder.indexOf(a);
      const bIndex = sentimentOrder.indexOf(b);
      return aIndex - bIndex;
    });
  }

  // Sort by semantic embedding if requested and dataPoints available
  if (sortBySemantic && dataPoints) {
    const semanticAverages = getTopicSemanticAverages(dataPoints, viewMode);
    return topics.sort((a, b) => {
      const avgA = semanticAverages.get(a) || 0;
      const avgB = semanticAverages.get(b) || 0;
      return avgB - avgA; // Higher semantic values at top
    });
  }

  // Default: sort by frequency
  const sortedByFrequency = Array.from(topicCounts.entries())
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([topic]) => topic);

  return sortedByFrequency;
}

// Normalize semantic embeddings to -1 to 1 range
export function normalizeSemanticEmbeddings(
  dataPoints: DataPoint[]
): DataPoint[] {
  const embeddings = dataPoints.map((d) => d.semanticEmbedding);
  const min = Math.min(...embeddings);
  const max = Math.max(...embeddings);

  // Avoid division by zero if all values are the same
  if (max === min) {
    return dataPoints.map((point) => ({
      ...point,
      semanticEmbedding: 0, // Center at 0 if all values are the same
    }));
  }

  // Normalize to -1 to 1 range: normalized = 2 * (value - min) / (max - min) - 1
  const normalizedPoints = dataPoints.map((point) => {
    const normalized = (2 * (point.semanticEmbedding - min)) / (max - min) - 1;
    return {
      ...point,
      semanticEmbedding: normalized,
    };
  });

  // Debug log to check normalization
  console.log("Semantic normalization:", {
    originalRange: { min, max },
    originalValues: embeddings,
    normalizedValues: normalizedPoints.map((p) => p.semanticEmbedding),
  });

  return normalizedPoints;
}

// Get semantic embedding domain for continuous y-axis (normalized -1 to 1)
export function getSemanticDomain(dataPoints: DataPoint[]): [number, number] {
  // Since we normalize to -1 to 1, add small padding
  const padding = 0.1;
  return [-1 - padding, 1 + padding];
}

// Get scales for the visualization
export function getScales(
  dataPoints: DataPoint[],
  topTopics: string[],
  width: number,
  height: number,
  useSemanticAxis: boolean = false
) {
  let yScale: any;

  if (useSemanticAxis) {
    const semanticDomain = getSemanticDomain(dataPoints);
    yScale = d3.scaleLinear().domain(semanticDomain).range([height, 0]); // Invert range so higher values are at the top
  } else {
    yScale = d3.scaleBand().domain(topTopics).range([0, height]).padding(0.3);
  }

  const timeDomain = getTimeDomain(dataPoints);
  const xScale = createTimeScale(width, timeDomain);

  return { xScale, yScale };
}

// Create semantic y-axis for continuous values
export function createSemanticYAxis(
  yScale: d3.ScaleLinear<number, number>,
  config = TOPIC_CONFIG
) {
  return d3
    .axisLeft(yScale)
    .ticks(8)
    .tickFormat((d) => d3.format(".2f")(d as number))
    .tickSize(config.axis.tickSize)
    .tickPadding(config.axis.tickPadding);
}

// Create axes
export function createAxes(
  xScale: any, // Using any since we have a custom scale
  yScale: any, // Can be either ScaleBand or ScaleLinear
  config = TOPIC_CONFIG,
  useSemanticAxis: boolean = false
) {
  const xAxis = createTimeXAxis(xScale, config);
  const yAxis = useSemanticAxis
    ? createSemanticYAxis(yScale, config)
    : createTopicYAxis(yScale, config);

  return { xAxis, yAxis };
}

// Create edges between events based on narrative time
export function createEdges(
  dataPoints: DataPoint[],
  viewMode: "main" | "sub" | "sentiment" = "sub"
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
    } else if (viewMode === "sentiment") {
      edges.push({
        source: current,
        target: next,
        mainTopic: current.sentimentPolarity, // Use sentiment polarity for styling
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

// Helper function to check temporal proximity between two points
function areTemporallyClose(
  point1: DataPoint,
  point2: DataPoint,
  thresholdMs: number
): boolean {
  const getTimeRange = (point: DataPoint): [Date, Date] => {
    return Array.isArray(point.realTime)
      ? point.realTime
      : [point.realTime as Date, point.realTime as Date];
  };

  const [start1, end1] = getTimeRange(point1);
  const [start2, end2] = getTimeRange(point2);

  // Check for overlap or proximity
  const gap1 = start2.getTime() - end1.getTime(); // Gap from end of 1 to start of 2
  const gap2 = start1.getTime() - end2.getTime(); // Gap from end of 2 to start of 1

  // They overlap if either gap is negative, or they're close if gap is within threshold
  return gap1 <= thresholdMs && gap2 <= thresholdMs;
}

// Helper function to update group positions and bounds
function updateGroupPositions(
  groups: Map<string, GroupedPoint>,
  xScale: any,
  yScale: any,
  useSemanticAxis: boolean = false
): void {
  for (const group of groups.values()) {
    if (group.points.length > 1) {
      // Calculate date range bounds
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
        group.x = (group.minX + group.maxX) / 2;
      }

      // Update Y position based on axis type
      if (useSemanticAxis) {
        // For semantic axis, use average of semantic embeddings
        const avgSemantic =
          group.points.reduce((sum, p) => sum + p.semanticEmbedding, 0) /
          group.points.length;
        group.y = yScale(avgSemantic);
      } else {
        // For categorical axis, Y position is already set by the band scale
        // No need to update Y position for categorical groups
      }
    }
  }
}

// Group overlapping points for semantic axis
export function groupOverlappingPointsSemantic(
  dataPoints: DataPoint[],
  xScale: any,
  yScale: d3.ScaleLinear<number, number>
): GroupedPoint[] {
  const groups: Map<string, GroupedPoint> = new Map();

  // More restrictive thresholds for semantic axis to prevent over-grouping
  const semanticThreshold = 0.05; // Tighter semantic similarity threshold
  const spatialThreshold = 20; // Smaller visual distance threshold in pixels
  const strictTemporalThreshold = 30 * 24 * 60 * 60 * 1000; // 30 days for very close events only

  const shouldGroupWith = (point: DataPoint, group: GroupedPoint): boolean => {
    // For semantic axis, prioritize semantic similarity and only group very close points
    return group.points.some((groupPoint) => {
      // 1. Check semantic similarity first (primary criteria)
      const semanticDistance = Math.abs(
        point.semanticEmbedding - groupPoint.semanticEmbedding
      );
      const isSemanticallyVeryClose = semanticDistance <= semanticThreshold;

      // 2. Check if they are very close temporally (for exact overlaps only)
      const isExactTemporalOverlap = areTemporallyClose(
        point,
        groupPoint,
        strictTemporalThreshold
      );

      // 3. Check visual proximity for points that are very close on screen
      const pointX = getXPosition(xScale, point.realTime);
      const pointY = yScale(point.semanticEmbedding);
      const groupPointX = getXPosition(xScale, groupPoint.realTime);
      const groupPointY = yScale(groupPoint.semanticEmbedding);

      const visualDistance = Math.sqrt(
        Math.pow(pointX - groupPointX, 2) + Math.pow(pointY - groupPointY, 2)
      );
      const isVisuallyVeryClose = visualDistance <= spatialThreshold;

      // For semantic mode, only group if semantically very similar AND (temporally overlapping OR visually very close)
      return (
        isSemanticallyVeryClose &&
        (isExactTemporalOverlap || isVisuallyVeryClose)
      );
    });
  };

  dataPoints.forEach((point) => {
    const x = getXPosition(xScale, point.realTime);
    const y = yScale(point.semanticEmbedding);

    // Check if this point should be grouped with any existing group
    let foundGroup = false;
    for (const [key, group] of groups.entries()) {
      if (shouldGroupWith(point, group)) {
        group.points.push(point);
        foundGroup = true;
        break;
      }
    }

    // If no suitable group was found, create a new one
    if (!foundGroup) {
      const groupKey = `semantic-group-${groups.size + 1}-${point.index}`;
      groups.set(groupKey, {
        key: groupKey,
        points: [point],
        mainTopic: point.mainTopic, // For styling/coloring
        x,
        y,
        isExpanded: false,
      });
    }
  });

  // Update group positions after all points are added
  updateGroupPositions(groups, xScale, yScale, true);

  return Array.from(groups.values());
}

// Group overlapping points
export function groupOverlappingPoints(
  dataPoints: DataPoint[],
  xScale: any, // Using any since we have a custom composite scale
  yScale: d3.ScaleBand<string> | d3.ScaleLinear<number, number>,
  viewMode: "main" | "sub" | "sentiment" = "sub",
  useSemanticAxis: boolean = false
): GroupedPoint[] {
  if (useSemanticAxis) {
    // For semantic axis, create individual groups for each point to show distribution clearly
    return dataPoints.map((point) => {
      const x = getXPosition(xScale, point.realTime);
      const linearYScale = yScale as d3.ScaleLinear<number, number>;
      const y = linearYScale(point.semanticEmbedding);

      const group: GroupedPoint = {
        key: `semantic-individual-${point.index}`,
        points: [point],
        mainTopic: point.mainTopic,
        x,
        y,
        isExpanded: false,
      };

      // Handle date ranges for individual points
      if (Array.isArray(point.realTime)) {
        group.minX = getXPosition(xScale, point.realTime[0]);
        group.maxX = getXPosition(xScale, point.realTime[1]);
        group.x = (group.minX + group.maxX) / 2;
      }

      return group;
    });
  }

  // Categorical logic with simplified overlap detection
  const categoricalYScale = yScale as d3.ScaleBand<string>;
  const groups: Map<string, GroupedPoint> = new Map();

  // Grouping thresholds
  const temporalThreshold = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
  const visualThreshold = TOPIC_CONFIG.point.radius * 2.5; // Visual proximity threshold

  // Filter dataPoints for "sub" viewMode to only include points with subtopics
  const filteredDataPoints =
    viewMode === "sub"
      ? dataPoints.filter((point) => point.subTopics.length > 0)
      : dataPoints;

  // Simplified grouping logic for categorical mode
  const shouldGroupWith = (point: DataPoint, group: GroupedPoint): boolean => {
    // Must have same topic category
    const pointTopic =
      viewMode === "main"
        ? point.mainTopic
        : viewMode === "sentiment"
        ? point.sentimentPolarity
        : point.subTopics[0];

    if (group.mainTopic !== pointTopic) return false;

    // Check if any point in the group is related to this point
    return group.points.some((groupPoint) => {
      // 1. Check temporal proximity
      const isTemporallyClose = areTemporallyClose(
        point,
        groupPoint,
        temporalThreshold
      );

      // 2. Check visual overlap (for date ranges and close positioning)
      const pointX = getXPosition(xScale, point.realTime);
      const groupPointX = getXPosition(xScale, groupPoint.realTime);
      const visualDistance = Math.abs(pointX - groupPointX);
      const isVisuallyClose = visualDistance <= visualThreshold;

      return isTemporallyClose || isVisuallyClose;
    });
  };

  filteredDataPoints.forEach((point) => {
    const x = getXPosition(xScale, point.realTime);
    const topic =
      viewMode === "main"
        ? point.mainTopic
        : viewMode === "sentiment"
        ? point.sentimentPolarity
        : point.subTopics[0]; // Only use first subtopic

    // Skip if topic is undefined or not in yScale domain (could happen if we filtered out some topics)
    if (!topic || !categoricalYScale(topic)) return;

    const y = categoricalYScale(topic)! + categoricalYScale.bandwidth() / 2;

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
        viewMode === "main"
          ? point.mainTopic
          : viewMode === "sentiment"
          ? point.sentimentPolarity
          : point.subTopics[0];

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

  // Update group positions using shared helper function
  updateGroupPositions(groups, xScale, yScale, false);

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
