import { Entity, NarrativeEvent } from "@/types/lite";
import * as d3 from "d3";
import { ENTITY_CONFIG } from "./entity-config";
import {
  createNarrativeYAxis,
  calculateDimensions,
} from "@/components/features/narrative/shared/visualization-utils";

export type EntityAttribute = string;

export interface EntityMention {
  entity: Entity;
  count: number;
}

// Remove the old calculateDimensions function and use the shared one
export function getEntityDimensions(
  containerWidth: number,
  eventsLength: number
) {
  return calculateDimensions(containerWidth, eventsLength, ENTITY_CONFIG);
}

// Get entity mentions count from events
export function getEntityMentions(
  events: NarrativeEvent[],
  selectedAttribute: string
): Map<string, EntityMention> {
  const entityMentions = new Map<string, EntityMention>();

  // If no attribute is selected, return empty map
  if (!selectedAttribute) {
    return entityMentions;
  }

  // First, collect all unique entities by ID
  const uniqueEntitiesById = new Map<string, Entity>();
  const entityCounts = new Map<string, number>();

  // Count occurrences of each entity across all events
  events.forEach((event) => {
    // Track which entities we've already counted in this event
    const countedInThisEvent = new Set<string>();

    event.entities.forEach((entity) => {
      // Skip entities that don't have the selected attribute
      if (
        entity[selectedAttribute] === undefined ||
        entity[selectedAttribute] === null ||
        entity[selectedAttribute] === ""
      ) {
        return;
      }

      // Store unique entity
      if (!uniqueEntitiesById.has(entity.id)) {
        uniqueEntitiesById.set(entity.id, entity);
        entityCounts.set(entity.id, 0);
      }

      // Only count each unique entity once per event
      if (!countedInThisEvent.has(entity.id)) {
        const currentCount = entityCounts.get(entity.id) || 0;
        entityCounts.set(entity.id, currentCount + 1);
        countedInThisEvent.add(entity.id);
      }
    });
  });

  // Create the final EntityMention map using entity ID as the key
  uniqueEntitiesById.forEach((entity, id) => {
    const count = entityCounts.get(id) || 0;
    entityMentions.set(id, { entity, count });
  });

  return entityMentions;
}

// Get top entities by mention count
export function getVisibleEntities(
  entityMentions: Map<string, EntityMention>
): Entity[] {
  // If no entity mentions, return empty array
  if (entityMentions.size === 0) {
    return [];
  }

  return (
    Array.from(entityMentions.values())
      .sort((a, b) => b.count - a.count)
      // .slice(0, 10) // Comment this line to show all
      .map((item) => item.entity)
  );
}

// Calculate column layout dimensions
export function calculateColumnLayout(width: number, entities: Entity[]) {
  const { entity } = ENTITY_CONFIG;

  // Calculate minimum width based on container
  const minWidth =
    width - ENTITY_CONFIG.margin.left - ENTITY_CONFIG.margin.right;

  // Calculate base width with default config values
  const baseColumnsWidth = entities.length * entity.columnWidth;
  const baseGapWidth = (entities.length - 1) * entity.columnGap;
  const baseTotalWidth = baseColumnsWidth + baseGapWidth;

  // If we have no entities, return minimum width
  if (entities.length === 0) {
    return {
      totalColumnsWidth: minWidth,
      columnWidth: entity.columnWidth,
      columnGap: entity.columnGap,
      columnPadding: entity.columnPadding,
    };
  }

  // If base width is less than minimum width, adjust gap to fill space
  if (baseTotalWidth < minWidth) {
    const extraSpace = minWidth - baseColumnsWidth;
    const newGap = extraSpace / (entities.length - 1 || 1);

    return {
      totalColumnsWidth: minWidth,
      columnWidth: entity.columnWidth,
      columnGap: newGap,
      columnPadding: entity.columnPadding,
    };
  }

  // If base width is greater than minimum width, use default values
  return {
    totalColumnsWidth: baseTotalWidth,
    columnWidth: entity.columnWidth,
    columnGap: entity.columnGap,
    columnPadding: entity.columnPadding,
  };
}

// Create scale for x-axis
export function createXScale(
  visibleEntities: Entity[],
  totalColumnsWidth: number
) {
  // If no visible entities, return a default scale
  if (visibleEntities.length === 0) {
    return d3
      .scaleBand()
      .domain(["Unknown"])
      .range([0, totalColumnsWidth])
      .padding(0.1);
  }

  // Use entity IDs as the domain to ensure consistent positioning
  return d3
    .scaleBand()
    .domain(visibleEntities.map((e) => e.id))
    .range([0, totalColumnsWidth])
    .padding(0.1);
}

// Create scale for y-axis
export function createYScale(events: NarrativeEvent[], height: number) {
  const maxTime = Math.max(
    ...events.map((e) => e.temporal_anchoring.narrative_time)
  );

  return d3
    .scaleLinear()
    .domain([0, Math.ceil(maxTime) + 1])
    .range([0, height])
    .nice();
}

// Create y-axis with integer ticks
export function createYAxis(yScale: d3.ScaleLinear<number, number>) {
  return createNarrativeYAxis(yScale);
}

// Get relevant entities for an event
export interface RelevantEntitiesResult {
  entities: Entity[];
  hasNoEntities: boolean; // true if event has no entities at all
  hasNoVisibleEntities: boolean; // true if event has entities but none are visible
}

export function getRelevantEntities(
  event: NarrativeEvent,
  visibleEntities: Entity[],
  selectedAttribute: string
): RelevantEntitiesResult {
  // If the event has no entities, return empty with hasNoEntities flag
  if (!event.entities || event.entities.length === 0) {
    return {
      entities: [],
      hasNoEntities: true,
      hasNoVisibleEntities: false,
    };
  }

  // Get the IDs of all visible entities
  const visibleEntityIds = new Set(visibleEntities.map((entity) => entity.id));

  // Filter event entities to only include those that match visible entities by ID
  const filteredEntities = event.entities.filter(
    (entity: Entity) =>
      // Entity must have the selected attribute
      entity[selectedAttribute] !== undefined &&
      entity[selectedAttribute] !== null &&
      entity[selectedAttribute] !== "" &&
      // And its ID must be in the visible entities set
      visibleEntityIds.has(entity.id)
  );

  // If no entities match the criteria but the event had entities,
  // return empty with hasNoVisibleEntities flag
  if (filteredEntities.length === 0) {
    return {
      entities: [],
      hasNoEntities: false,
      hasNoVisibleEntities: true,
    };
  }

  return {
    entities: filteredEntities,
    hasNoEntities: false,
    hasNoVisibleEntities: false,
  };
}

// D3 force simulation for entity visualization
export interface ForceNode extends d3.SimulationNodeDatum {
  id: string;
  entity: Entity;
  narrativeTime: number;
  x: number;
  y: number;
  fx?: number;
  fy?: number;
}

export interface ForceLink extends d3.SimulationLinkDatum<ForceNode> {
  source: string | ForceNode;
  target: string | ForceNode;
  value: number;
}

export function calculateForceLayout(
  events: NarrativeEvent[],
  visibleEntities: Entity[],
  width: number,
  height: number,
  selectedAttribute: string
) {
  // Create nodes for each entity mention in events
  const nodes: ForceNode[] = [];
  const links: ForceLink[] = [];
  const nodeMap = new Map<string, ForceNode>();

  // Create a map of entity ids to their column positions
  const entityPositions = new Map<string, number>();
  const xScale = createXScale(visibleEntities, width);

  visibleEntities.forEach((entity) => {
    const x = xScale(entity.id)! + xScale.bandwidth() / 2;
    entityPositions.set(entity.id, x);
  });

  // Create scale for y-axis based on narrative time
  const yScale = createYScale(events, height);

  // Process each event to create nodes and links
  events.forEach((event) => {
    const narrativeTime = event.temporal_anchoring.narrative_time;
    const y = yScale(narrativeTime);

    // Get relevant entities for this event
    const relevantEntities = getRelevantEntities(
      event,
      visibleEntities,
      selectedAttribute
    );

    if (relevantEntities.entities.length > 0) {
      // Create nodes for each entity in this event
      relevantEntities.entities.forEach((entity) => {
        const nodeId = `${event.index}-${entity.id}`;
        const node: ForceNode = {
          id: nodeId,
          entity,
          narrativeTime,
          x: entityPositions.get(entity.id) || width / 2,
          y,
          fy: y, // Fix y position based on narrative time
        };
        nodes.push(node);
        nodeMap.set(nodeId, node);
      });

      // Create links between entities in the same event
      const entityNodes = relevantEntities.entities.map(
        (e) => `${event.index}-${e.id}`
      );

      // Connect all entities in this event with links
      for (let i = 0; i < entityNodes.length; i++) {
        for (let j = i + 1; j < entityNodes.length; j++) {
          links.push({
            source: entityNodes[i],
            target: entityNodes[j],
            value: 1,
          });
        }
      }
    }
  });

  // Add vertical links to connect the same entity across different events
  // This helps maintain vertical alignment for the same entity
  visibleEntities.forEach((entity) => {
    // Get all nodes for this entity, sorted by narrative time
    const entityNodes = nodes
      .filter((node) => node.entity.id === entity.id)
      .sort((a, b) => a.narrativeTime - b.narrativeTime);

    // Connect sequential nodes with links
    for (let i = 0; i < entityNodes.length - 1; i++) {
      links.push({
        source: entityNodes[i].id,
        target: entityNodes[i + 1].id,
        value: 0.5, // Weaker connection for vertical alignment
      });
    }
  });

  // Create and run the force simulation
  const simulation = d3
    .forceSimulation<ForceNode>()
    .nodes(nodes)
    // Apply x force to keep nodes in their entity column, but very weak
    .force(
      "x",
      d3
        .forceX<ForceNode>()
        .x((d) => {
          // Get the entity's ideal x position
          return entityPositions.get(d.entity.id) || width / 2;
        })
        .strength(0) // Very weak column alignment to allow more horizontal movement
    )
    // Apply minimal collision force to prevent overlap
    .force(
      "collision",
      d3.forceCollide<ForceNode>(ENTITY_CONFIG.point.radius + 1) // Just enough to prevent overlap
    )
    // Apply strong link force to pull connected entities very close together
    .force(
      "link",
      d3
        .forceLink<ForceNode, ForceLink>(links)
        .id((d) => d.id)
        .strength((link) => {
          const l = link as ForceLink;
          // Get source and target narrative times safely
          const sourceTime =
            typeof l.source === "string"
              ? nodes.find((n) => n.id === l.source)?.narrativeTime ?? 0
              : l.source.narrativeTime;
          const targetTime =
            typeof l.target === "string"
              ? nodes.find((n) => n.id === l.target)?.narrativeTime ?? 0
              : l.target.narrativeTime;

          // Very strong force for horizontal connections (same narrative time)
          if (Math.abs(sourceTime - targetTime) == 0) {
            return 2.0; // Stronger horizontal connection
          }
          return 0.1; // Very weak vertical connection
        })
        .distance((d) => {
          // Keep horizontal connections as close as possible
          const source =
            typeof d.source === "string"
              ? nodes.find((n) => n.id === d.source)
              : d.source;
          const target =
            typeof d.target === "string"
              ? nodes.find((n) => n.id === d.target)
              : d.target;
          if (
            source &&
            target &&
            Math.abs(source.narrativeTime - target.narrativeTime) < 0.1
          ) {
            return ENTITY_CONFIG.point.radius * 2; // Just slightly more than collision radius
          }
          return ENTITY_CONFIG.point.radius * 10; // Keep vertical connections far apart
        })
    );
  // Run the simulation longer to ensure convergence
  for (let i = 0; i < 300; i++) {
    simulation.tick();
  }

  // Stop the simulation
  simulation.stop();

  return { nodes, links };
}

interface Point {
  x: number;
  y: number;
}

interface GridPoint extends Point {
  isSnapped: boolean;
}

interface MetroPathOptions {
  cornerRadius?: number;
  gridSize?: number;
  minSegmentLength?: number;
  preferredAngles?: number[];
  smoothing?: boolean;
  yScale?: d3.ScaleLinear<number, number>;
}

function snapToGrid(
  point: Point,
  gridSize: number,
  yScale?: d3.ScaleLinear<number, number>
): GridPoint {
  if (yScale) {
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: point.y,
      isSnapped: true,
    };
  }

  // Default behavior without y-scale
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
    isSnapped: true,
  };
}

function getAngle(
  p1: Point,
  p2: Point,
  yScale?: d3.ScaleLinear<number, number>
): number {
  // If yScale is provided, convert y coordinates to narrative time for angle calculation
  if (yScale) {
    const t1 = yScale.invert(p1.y);
    const t2 = yScale.invert(p2.y);
    return Math.atan2(t2 - t1, p2.x - p1.x);
  }

  // Default behavior without y-scale
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

function getDistance(p1: Point, p2: Point): number {
  // Use a more efficient calculation for distance
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function createMetroTrack(
  points: Point[],
  options: MetroPathOptions = {}
) {
  const {
    cornerRadius = ENTITY_CONFIG.point.radius * 2,
    gridSize = 20,
    minSegmentLength = cornerRadius * 2,
    preferredAngles = [0, 45, 90, 135, 180],
    smoothing = true,
    yScale,
  } = options;

  const path = d3.path();
  if (points.length < 2) return path;

  // Convert angles to radians
  const preferredRadians = preferredAngles.map(
    (angle) => (angle * Math.PI) / 180
  );

  // Snap points to grid and optimize path
  const snappedPoints: GridPoint[] = points.map((p) =>
    snapToGrid(p, gridSize, yScale)
  );

  // Helper to find the best angle
  function findBestAngle(dx: number, dy: number): number {
    const angle = getAngle({ x: 0, y: 0 }, { x: dx, y: dy }, yScale);
    // Normalize angle to 0-2π
    const normalizedAngle = angle < 0 ? angle + 2 * Math.PI : angle;

    return preferredRadians.reduce((best, preferred) => {
      const diff = Math.abs(normalizedAngle - preferred);
      const altDiff = Math.abs(normalizedAngle - (preferred + 2 * Math.PI));
      const minDiff = Math.min(diff, altDiff);

      if (minDiff < Math.abs(normalizedAngle - best)) {
        return preferred;
      }
      return best;
    }, normalizedAngle);
  }

  // Helper to create intermediate points for grid-aligned segments
  function createIntermediatePoints(
    start: GridPoint,
    end: GridPoint
  ): GridPoint[] {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = getDistance(start, end);

    if (distance < minSegmentLength) {
      return [end];
    }

    const angle = findBestAngle(dx, dy);
    const intermediatePoints: GridPoint[] = [];

    // For vertical or horizontal lines, no intermediate points needed
    if (
      Math.abs(angle) === 0 ||
      Math.abs(angle) === Math.PI ||
      Math.abs(angle) === Math.PI / 2 ||
      Math.abs(angle) === -Math.PI / 2
    ) {
      return [end];
    }

    // For diagonal lines at 45°, create one intermediate point
    if (Math.abs(Math.abs(angle) - Math.PI / 4) < 0.1) {
      const midPoint = snapToGrid(
        {
          x: start.x + dx / 2,
          y: start.y + dy / 2,
        },
        gridSize,
        yScale
      );
      intermediatePoints.push({ ...midPoint, isSnapped: true });
    } else {
      // For other angles, create two intermediate points to maintain grid alignment
      const midX = snapToGrid({ x: end.x, y: start.y }, gridSize, yScale);
      const midY = snapToGrid({ x: start.x, y: end.y }, gridSize, yScale);

      // Choose the shorter path
      if (
        getDistance(start, midX) + getDistance(midX, end) <
        getDistance(start, midY) + getDistance(midY, end)
      ) {
        intermediatePoints.push({ ...midX, isSnapped: true });
      } else {
        intermediatePoints.push({ ...midY, isSnapped: true });
      }
    }

    intermediatePoints.push(end);
    return intermediatePoints;
  }

  // Helper to create a smooth corner
  function createCorner(
    start: Point,
    corner: Point,
    end: Point,
    radius: number
  ) {
    const dx1 = corner.x - start.x;
    const dy1 = corner.y - start.y;
    const dx2 = end.x - corner.x;
    const dy2 = end.y - corner.y;

    const angle1 = Math.atan2(dy1, dx1);
    const angle2 = Math.atan2(dy2, dx2);

    const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

    // Adjust radius if segments are too short
    const actualRadius = Math.min(radius, dist1 * 0.5, dist2 * 0.5);

    // Calculate corner points
    const startCorner = {
      x: corner.x - Math.cos(angle1) * actualRadius,
      y: corner.y - Math.sin(angle1) * actualRadius,
    };

    const endCorner = {
      x: corner.x + Math.cos(angle2) * actualRadius,
      y: corner.y + Math.sin(angle2) * actualRadius,
    };

    return { startCorner, endCorner, actualRadius };
  }

  // Start path
  path.moveTo(snappedPoints[0].x, snappedPoints[0].y);

  // Process each segment with grid-aligned intermediate points
  let currentPoint = snappedPoints[0];
  for (let i = 1; i < snappedPoints.length; i++) {
    const nextPoint = snappedPoints[i];
    const intermediatePoints = createIntermediatePoints(
      currentPoint,
      nextPoint
    );

    for (let j = 0; j < intermediatePoints.length; j++) {
      const point = intermediatePoints[j];
      const isLastPoint = j === intermediatePoints.length - 1;

      if (smoothing && !isLastPoint) {
        const nextIntPoint = intermediatePoints[j + 1];
        const { startCorner, endCorner, actualRadius } = createCorner(
          currentPoint,
          point,
          nextIntPoint,
          cornerRadius
        );

        path.lineTo(startCorner.x, startCorner.y);
        path.arcTo(point.x, point.y, endCorner.x, endCorner.y, actualRadius);
        path.lineTo(nextIntPoint.x, nextIntPoint.y);
      } else {
        path.lineTo(point.x, point.y);
      }

      currentPoint = point;
    }
  }

  return path;
}
