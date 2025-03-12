import { NarrativeEvent } from "@/types/narrative/lite";
import * as d3 from "d3";
import { TOPIC_CONFIG } from "./topic-config";

export interface DataPoint {
  event: NarrativeEvent;
  mainTopic: string;
  subTopics: string[];
  narrativeTime: number;
  sentiment: number;
  text: string;
  realTime: Date;
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
export function processEvents(
  events: NarrativeEvent[],
  viewMode: "main" | "sub" = "main"
): DataPoint[] {
  const validEvents = events.filter((e) => e.temporal_anchoring.real_time);
  return validEvents.map((event, index) => ({
    event,
    mainTopic: event.topic.main_topic,
    subTopics: event.topic.sub_topic,
    narrativeTime: event.temporal_anchoring.narrative_time,
    sentiment: event.topic.sentiment.intensity,
    text: event.text,
    realTime: new Date(event.temporal_anchoring.real_time!),
    index,
  }));
}

// Get unique topics and their counts
export function getTopicCounts(
  dataPoints: DataPoint[],
  viewMode: "main" | "sub" = "main"
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
    // Count subtopics
    dataPoints.forEach((point) => {
      point.subTopics.forEach((subTopic) => {
        topicCounts.set(subTopic, (topicCounts.get(subTopic) || 0) + 1);
      });
    });
  }

  return topicCounts;
}

// Get all unique topics sorted by frequency
export function getTopTopics(topicCounts: Map<string, number>): string[] {
  return Array.from(topicCounts.entries())
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

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(dataPoints, (d) => d.realTime) as [Date, Date])
    .range([0, width])
    .nice();

  return { xScale, yScale };
}

// Calculate dimensions based on container and config
export function calculateDimensions(
  containerWidth: number,
  containerHeight: number
) {
  // Calculate usable dimensions
  const width = Math.max(
    0,
    containerWidth - TOPIC_CONFIG.margin.left - TOPIC_CONFIG.margin.right
  );
  const height = Math.max(
    0,
    containerHeight - TOPIC_CONFIG.margin.top - TOPIC_CONFIG.margin.bottom
  );

  return {
    containerWidth,
    containerHeight,
    width,
    height,
  };
}

// Create axes for the visualization
export function createAxes(
  xScale: d3.ScaleTime<number, number>,
  yScale: d3.ScaleBand<string>
) {
  const xAxis = d3.axisTop(xScale).tickSize(5).tickPadding(10);

  const yAxis = d3.axisLeft(yScale).tickSize(5).tickPadding(5);

  return { xAxis, yAxis };
}

// Create edges between events based on narrative time
export function createEdges(
  dataPoints: DataPoint[],
  viewMode: "main" | "sub" = "main"
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
  xScale: d3.ScaleTime<number, number>,
  yScale: d3.ScaleBand<string>,
  viewMode: "main" | "sub" = "main"
): GroupedPoint[] {
  const groups: Map<string, GroupedPoint> = new Map();
  const threshold = 10; // Threshold for considering points as overlapping

  dataPoints.forEach((point) => {
    const x = xScale(point.realTime);
    const topic =
      viewMode === "main"
        ? point.mainTopic
        : point.subTopics[0] || point.mainTopic;
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
          (viewMode === "sub" && point.subTopics.includes(group.mainTopic)))
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
        viewMode === "main"
          ? point.mainTopic
          : point.subTopics[0] || point.mainTopic;

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

  // Calculate radius for the circle of nodes
  // Scale the circle radius based on the number of points
  // to ensure they don't overlap or go too far from the center
  const circleRadius = Math.max(
    radius * 2,
    Math.min(radius * 3, radius * (1 + n * 0.2))
  );

  // Distribute points evenly in a circle
  const angleStep = (2 * Math.PI) / n;

  for (let i = 0; i < n; i++) {
    const angle = i * angleStep;
    positions.push({
      x: group.x + circleRadius * Math.cos(angle),
      y: group.y + circleRadius * Math.sin(angle),
    });
  }

  return positions;
}
