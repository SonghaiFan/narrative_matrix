import { Entity, NarrativeEvent } from "@/types/lite";
import { VisualizationType } from "@/types/visualization";
import * as d3 from "d3";
import { ENTITY_CONFIG } from "./entity-config";
import { getSentimentColor } from "@/components/features/narrative/shared/color-utils";
import {
  createNarrativeYAxis,
  calculateDimensions,
} from "@/components/features/narrative/shared/visualization-utils";

export type EntityAttribute = string;

export interface EntityMention {
  entity: Entity;
  count: number;
}

export interface EntityColumn {
  key: string;
  label: string;
  totalCount: number;
  entities: Entity[];
}

export interface EventColumnNode {
  columnKey: string;
  count: number;
  entities: Entity[];
}

export interface EventRowData {
  event: NarrativeEvent;
  nodes: EventColumnNode[];
}

// Remove the old calculateDimensions function and use the shared one
export function getEntityDimensions(
  containerWidth: number,
  eventsLength: number
) {
  return calculateDimensions(containerWidth, eventsLength, ENTITY_CONFIG);
}

export function buildEntityColumnData(
  events: NarrativeEvent[],
  selectedAttribute: string
): { columns: EntityColumn[]; rows: EventRowData[] } {
  const columnMap = new Map<
    string,
    {
      key: string;
      label: string;
      totalCount: number;
      entitySet: Map<string, Entity>;
    }
  >();
  const rows: EventRowData[] = [];

  events.forEach((event) => {
    const nodesByColumn = new Map<string, EventColumnNode>();

    event.entities.forEach((entity) => {
      let columnKey: string | null = null;
      let columnLabel: string | null = null;

      if (!selectedAttribute || selectedAttribute === "name") {
        columnKey = entity.id;
        columnLabel = entity.name || entity.id;
      } else {
        const rawValue = (entity as Record<string, unknown>)[selectedAttribute];
        if (!rawValue) return;
        columnKey = String(rawValue).trim();
        if (!columnKey) return;
        columnLabel = columnKey;
      }

      const columnEntry = columnMap.get(columnKey);
      if (columnEntry) {
        columnEntry.totalCount += 1;
        columnEntry.entitySet.set(entity.id, entity);
      } else {
        columnMap.set(columnKey, {
          key: columnKey,
          label: columnLabel!,
          totalCount: 1,
          entitySet: new Map([[entity.id, entity]]),
        });
      }

      const nodeEntry = nodesByColumn.get(columnKey);
      if (nodeEntry) {
        nodeEntry.count += 1;
        nodeEntry.entities.push(entity);
      } else {
        nodesByColumn.set(columnKey, {
          columnKey,
          count: 1,
          entities: [entity],
        });
      }
    });

    rows.push({
      event,
      nodes: Array.from(nodesByColumn.values()),
    });
  });

  const columns = Array.from(columnMap.values())
    .map((entry) => ({
      key: entry.key,
      label: entry.label,
      totalCount: entry.totalCount,
      entities: Array.from(entry.entitySet.values()),
    }))
    .sort((a, b) => {
      if (b.totalCount !== a.totalCount) {
        return b.totalCount - a.totalCount;
      }
      return a.label.localeCompare(b.label);
    });

  const columnIndexMap = new Map<string, number>();
  columns.forEach((column, index) => {
    columnIndexMap.set(column.key, index);
  });

  rows.forEach((row) => {
    row.nodes.sort((a, b) => {
      const indexA = columnIndexMap.get(a.columnKey) ?? Number.MAX_SAFE_INTEGER;
      const indexB = columnIndexMap.get(b.columnKey) ?? Number.MAX_SAFE_INTEGER;
      return indexA - indexB;
    });
  });

  return { columns, rows };
}

// Calculate column layout dimensions
export function calculateColumnLayout(width: number, columnCount: number) {
  const { entity } = ENTITY_CONFIG;

  // Fixed layout: always use configured columnWidth & columnGap, no stretching.
  // Total width grows linearly with number of entities and can be smaller than container (leaving empty space) or larger (scrollable).
  if (columnCount === 0) {
    return {
      totalColumnsWidth: 0,
      columnWidth: entity.columnWidth,
      columnGap: entity.columnGap,
      columnPadding: entity.columnPadding,
    };
  }

  const totalColumnsWidth =
    columnCount * entity.columnWidth +
    Math.max(0, columnCount - 1) * entity.columnGap;

  return {
    totalColumnsWidth,
    columnWidth: entity.columnWidth,
    columnGap: entity.columnGap,
    columnPadding: entity.columnPadding,
  };
}

// Create scale for x-axis
export function createXScale(
  columns: EntityColumn[],
  totalColumnsWidth: number
) {
  // If no visible entities, return a default scale
  if (columns.length === 0) {
    return d3
      .scaleBand()
      .domain(["Unknown"])
      .range([0, totalColumnsWidth])
      .padding(0.1);
  }

  // Use entity IDs as the domain to ensure consistent positioning
  return d3
    .scaleBand()
    .domain(columns.map((column) => column.key))
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

  // Track number of nodes per entity for force weighting
  const entityNodeCounts = new Map<string, number>();

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

        // Count nodes per entity
        const currentCount = entityNodeCounts.get(entity.id) || 0;
        entityNodeCounts.set(entity.id, currentCount + 1);
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
    // Apply x force to keep nodes in their entity column, with strength based on node count
    .force(
      "x",
      d3
        .forceX<ForceNode>()
        .x((d) => {
          // Get the entity's ideal x position
          return entityPositions.get(d.entity.id) || width / 2;
        })
        .strength((d) => {
          // Get the number of nodes for this entity
          const nodeCount = entityNodeCounts.get(d.entity.id) || 1;
          // More nodes = stronger x-force to keep the track straighter
          // Use a logarithmic scale with configurable base and max
          return Math.min(
            ENTITY_CONFIG.force.xForceMax,
            Math.log2(nodeCount) * ENTITY_CONFIG.force.xForceBase
          );
        })
    )
    // Apply minimal collision force to prevent overlap
    .force(
      "collision",
      d3.forceCollide<ForceNode>(ENTITY_CONFIG.point.radius + 1)
    )
    // Apply link force with strength based on node count
    .force(
      "link",
      d3
        .forceLink<ForceNode, ForceLink>(links)
        .id((d) => d.id)
        .strength((link) => {
          const l = link as ForceLink;
          // Get source and target nodes
          const sourceNode =
            typeof l.source === "string"
              ? nodes.find((n) => n.id === l.source)
              : l.source;
          const targetNode =
            typeof l.target === "string"
              ? nodes.find((n) => n.id === l.target)
              : l.target;

          if (!sourceNode || !targetNode)
            return ENTITY_CONFIG.force.verticalLinkStrength;

          // Get source and target narrative times
          const sourceTime = sourceNode.narrativeTime;
          const targetTime = targetNode.narrativeTime;

          // Get node counts for both entities
          const sourceCount = entityNodeCounts.get(sourceNode.entity.id) || 1;
          const targetCount = entityNodeCounts.get(targetNode.entity.id) || 1;

          // Calculate average node count for this link
          const avgNodeCount = (sourceCount + targetCount) / 2;

          // Very strong force for horizontal connections (same narrative time)
          if (Math.abs(sourceTime - targetTime) < 0.1) {
            // Use logarithmic scale for link strength based on node count
            return Math.min(
              ENTITY_CONFIG.force.horizontalLinkMax,
              Math.log2(avgNodeCount) * ENTITY_CONFIG.force.horizontalLinkBase
            );
          }
          // Very weak vertical connection
          return ENTITY_CONFIG.force.verticalLinkStrength;
        })
        .distance((d) => {
          const source =
            typeof d.source === "string"
              ? nodes.find((n) => n.id === d.source)
              : d.source;
          const target =
            typeof d.target === "string"
              ? nodes.find((n) => n.id === d.target)
              : d.target;

          if (!source || !target)
            return (
              ENTITY_CONFIG.point.radius * ENTITY_CONFIG.force.maxNodeDistance
            );

          // Keep horizontal connections as close as possible
          if (Math.abs(source.narrativeTime - target.narrativeTime) < 0.1) {
            return (
              ENTITY_CONFIG.point.radius * ENTITY_CONFIG.force.minNodeDistance
            );
          }
          return (
            ENTITY_CONFIG.point.radius * ENTITY_CONFIG.force.maxNodeDistance
          );
        })
    );

  // Run the simulation for configured number of iterations
  for (let i = 0; i < ENTITY_CONFIG.force.iterations; i++) {
    simulation.tick();
  }

  // Stop the simulation
  simulation.stop();

  return { nodes, links };
}

export interface Point {
  x: number;
  y: number;
}

export interface GridPoint extends Point {
  isSnapped: boolean;
}

export interface MetroPathOptions {
  cornerRadius?: number;
  gridSize?: number;
  minSegmentLength?: number;
  preferredAngles?: number[];
  smoothing?: boolean;
  yScale?: d3.ScaleLinear<number, number>;
}

export function snapToGrid(
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

export function getAngle(
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

export function getDistance(p1: Point, p2: Point): number {
  // Use a more efficient calculation for distance
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Helper function to create event node
export function createEventNode(
  parent: d3.Selection<any, unknown, null, undefined>,
  cx: number,
  cy: number,
  event: NarrativeEvent,
  selectedEventId: number | null,
  entityId?: string
) {
  return parent
    .append("circle")
    .attr("class", "event-node")
    .attr("data-event-index", event.index)
    .attr("data-entity-id", entityId || "")
    .attr("cx", cx)
    .attr("cy", cy)
    .attr("r", ENTITY_CONFIG.point.radius)
    .attr("fill", getSentimentColor(event.topic.sentiment.polarity))
    .attr(
      "stroke",
      selectedEventId === event.index ? ENTITY_CONFIG.highlight.color : "black"
    )
    .attr("stroke-width", ENTITY_CONFIG.point.strokeWidth)
    .style("cursor", "pointer");
}

// Helper function to create connector
export function createConnector(
  parent: d3.Selection<any, unknown, null, undefined>,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  className: string,
  stroke: string,
  strokeWidth: number
) {
  return parent
    .append("line")
    .attr("class", className)
    .attr("x1", x1)
    .attr("y1", y1)
    .attr("x2", x2)
    .attr("y2", y2)
    .attr("stroke", stroke)
    .attr("stroke-width", strokeWidth)
    .attr("stroke-linecap", "round");
}

// Helper function to get event from node ID
export function getEventFromNodeId(nodeId: string, events: NarrativeEvent[]) {
  const eventId = parseInt(nodeId.split("-")[0]);
  return events.find((e) => e.index === eventId);
}

// Helper function to get nodes from link
export function getNodesFromLink(
  link: ForceLink,
  nodes: ForceNode[]
): { sourceNode: ForceNode | undefined; targetNode: ForceNode | undefined } {
  const sourceNode =
    typeof link.source === "string"
      ? nodes.find((n) => n.id === link.source)
      : link.source;

  const targetNode =
    typeof link.target === "string"
      ? nodes.find((n) => n.id === link.target)
      : link.target;

  return { sourceNode, targetNode };
}

// Helper function to create event group
export function createEventGroup(
  parent: d3.Selection<any, unknown, null, undefined>,
  eventId: number
) {
  return parent.append("g").attr("class", `event-group-${eventId}`);
}

// Helper function to add hover effects to event group
export function addEventGroupHoverEffects(
  eventGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  event: NarrativeEvent,
  showTooltip: (
    event: NarrativeEvent,
    x: number,
    y: number,
    type: VisualizationType
  ) => void,
  updatePosition: (x: number, y: number) => void,
  hideTooltip: () => void,
  setSelectedEventId: (id: number | null) => void,
  selectedEventId: number | null
) {
  eventGroup
    .on("mouseenter", function (this: SVGGElement, e: MouseEvent) {
      // Highlight all nodes in the group
      d3.select(this)
        .selectAll(".event-node")
        .transition()
        .duration(200)
        .attr("r", ENTITY_CONFIG.point.radius * 1.5);

      // Scale up connectors
      d3.select(this)
        .selectAll(".connector-outer")
        .transition()
        .duration(200)
        .attr(
          "stroke-width",
          ENTITY_CONFIG.event.hoverConnectorStrokeWidth +
            ENTITY_CONFIG.point.strokeWidth * 1.25
        );

      d3.select(this)
        .selectAll(".connector-inner")
        .transition()
        .duration(200)
        .attr(
          "stroke-width",
          ENTITY_CONFIG.event.hoverConnectorStrokeWidth *
            ENTITY_CONFIG.event.innerConnectorScale
        );

      // Show tooltip
      showTooltip(event, e.pageX, e.pageY, "entity" as VisualizationType);
      updatePosition(e.pageX, e.pageY);
    })
    .on("mousemove", function (e: MouseEvent) {
      updatePosition(e.pageX, e.pageY);
    })
    .on("mouseleave", function (this: SVGGElement) {
      // Reset all nodes in the group
      d3.select(this)
        .selectAll(".event-node")
        .transition()
        .duration(200)
        .attr("r", ENTITY_CONFIG.point.radius);

      // Reset connectors
      d3.select(this)
        .selectAll(".connector-outer")
        .transition()
        .duration(200)
        .attr(
          "stroke-width",
          ENTITY_CONFIG.event.connectorStrokeWidth +
            ENTITY_CONFIG.point.strokeWidth * 1.25
        );

      d3.select(this)
        .selectAll(".connector-inner")
        .transition()
        .duration(200)
        .attr(
          "stroke-width",
          ENTITY_CONFIG.event.connectorStrokeWidth *
            ENTITY_CONFIG.event.innerConnectorScale
        );

      hideTooltip();
    })
    .on("click", function () {
      // Explicitly reset hover visuals BEFORE selection change so we don't get a stuck state
      const group = d3.select(this as SVGGElement);
      group
        .selectAll(".event-node")
        .interrupt()
        .attr("r", ENTITY_CONFIG.point.radius);
      group
        .selectAll(".connector-outer")
        .interrupt()
        .attr(
          "stroke-width",
          ENTITY_CONFIG.event.connectorStrokeWidth +
            ENTITY_CONFIG.point.strokeWidth * 1.25
        );
      group
        .selectAll(".connector-inner")
        .interrupt()
        .attr(
          "stroke-width",
          ENTITY_CONFIG.event.connectorStrokeWidth *
            ENTITY_CONFIG.event.innerConnectorScale
        );

      // Hide tooltip explicitly so mouseleave not firing won't leave it visible
      hideTooltip();

      // Toggle selection
      setSelectedEventId(selectedEventId === event.index ? null : event.index);
    });
}

// Helper function to add track hover effects
export function addTrackHoverEffects(
  track: d3.Selection<
    SVGLineElement | SVGPathElement,
    unknown,
    null,
    undefined
  >,
  entity: Entity,
  selectedTrackId: string | null,
  showTooltip: (
    event: null,
    x: number,
    y: number,
    type: VisualizationType,
    entity: Entity
  ) => void,
  updatePosition: (x: number, y: number) => void,
  hideTooltip: () => void,
  setSelectedTrackId: (id: string | null) => void
) {
  track
    .style("cursor", "pointer")
    .on(
      "mouseenter",
      function (this: SVGLineElement | SVGPathElement, event: MouseEvent) {
        // Smoothly increase stroke width and opacity
        d3.select(this)
          .transition()
          .duration(200)
          .attr("stroke-width", ENTITY_CONFIG.track.strokeWidth * 1.5)
          .attr("opacity", selectedTrackId === entity.id ? 1 : 0.5);

        // Show tooltip with entity name
        showTooltip(
          null,
          event.pageX,
          event.pageY,
          "entity" as VisualizationType,
          entity
        );
        updatePosition(event.pageX, event.pageY);
      }
    )
    .on("mousemove", function (event: MouseEvent) {
      updatePosition(event.pageX, event.pageY);
    })
    .on("mouseleave", function (this: SVGLineElement | SVGPathElement) {
      // Smoothly revert stroke width and opacity
      d3.select(this)
        .transition()
        .duration(200)
        .attr("stroke-width", ENTITY_CONFIG.track.strokeWidth)
        .attr("opacity", selectedTrackId === entity.id ? 0.8 : 0.3);

      hideTooltip();
    })
    .on("click", function () {
      // Reset hover state immediately to avoid stuck thicker stroke
      d3.select(this as SVGLineElement | SVGPathElement)
        .interrupt()
        .attr(
          "stroke-width",
          selectedTrackId === entity.id
            ? ENTITY_CONFIG.track.strokeWidth * 1.5
            : ENTITY_CONFIG.track.strokeWidth
        )
        .attr("opacity", selectedTrackId === entity.id ? 0.8 : 0.3);

      hideTooltip();

      setSelectedTrackId(selectedTrackId === entity.id ? null : entity.id);
    });
}

export function createMetroTrack(
  points: Point[],
  options: MetroPathOptions = {}
) {
  const {
    cornerRadius = ENTITY_CONFIG.point.radius *
      ENTITY_CONFIG.metro.cornerRadius,
    gridSize = ENTITY_CONFIG.metro.gridSize,
    minSegmentLength = cornerRadius * ENTITY_CONFIG.metro.minSegmentLength,
    preferredAngles = ENTITY_CONFIG.metro.preferredAngles,
    smoothing = ENTITY_CONFIG.metro.smoothing,
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

    // Adjust radius if segments are too short, but allow larger curves
    const actualRadius = Math.min(
      radius,
      dist1 * ENTITY_CONFIG.metro.maxCurveRatio,
      dist2 * ENTITY_CONFIG.metro.maxCurveRatio
    );

    // Calculate corner points with additional smoothing
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

        // Add a small straight line before the curve for smoother transition
        path.lineTo(startCorner.x, startCorner.y);
        // Use a larger arc for smoother curves
        path.arcTo(
          point.x,
          point.y,
          endCorner.x,
          endCorner.y,
          actualRadius * ENTITY_CONFIG.metro.curveScale
        );
        path.lineTo(nextIntPoint.x, nextIntPoint.y);
      } else {
        path.lineTo(point.x, point.y);
      }

      currentPoint = point;
    }
  }

  return path;
}

// Helper function to create and add hover effects to tracks
export function createTrackWithHover(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  entity: Entity,
  entitySlug: string,
  selectedTrackId: string | null,
  showTooltip: (
    event: null,
    x: number,
    y: number,
    type: VisualizationType,
    entity: Entity
  ) => void,
  updatePosition: (x: number, y: number) => void,
  hideTooltip: () => void,
  setSelectedTrackId: (id: string | null) => void,
  isPath: boolean,
  pathData: { d: string } | { x1: number; y1: number; x2: number; y2: number }
) {
  let track: d3.Selection<
    SVGLineElement | SVGPathElement,
    unknown,
    null,
    undefined
  >;

  if (isPath) {
    const pathTrack = g
      .append("path")
      .attr("class", `track-${entitySlug}`)
      .attr("d", (pathData as { d: string }).d)
      .attr("fill", "none");
    track = pathTrack as d3.Selection<
      SVGLineElement | SVGPathElement,
      unknown,
      null,
      undefined
    >;
  } else {
    const { x1, y1, x2, y2 } = pathData as {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    };
    const lineTrack = g
      .append("line")
      .attr("class", `track-${entitySlug}`)
      .attr("x1", x1)
      .attr("y1", y1)
      .attr("x2", x2)
      .attr("y2", y2);
    track = lineTrack as d3.Selection<
      SVGLineElement | SVGPathElement,
      unknown,
      null,
      undefined
    >;
  }

  track
    .attr(
      "stroke",
      selectedTrackId === entity.id
        ? ENTITY_CONFIG.highlight.color
        : ENTITY_CONFIG.track.color
    )
    .attr(
      "stroke-width",
      selectedTrackId === entity.id
        ? ENTITY_CONFIG.track.strokeWidth * 1.5
        : ENTITY_CONFIG.track.strokeWidth
    )
    .attr("opacity", selectedTrackId === entity.id ? 0.8 : 0.3);

  addTrackHoverEffects(
    track,
    entity,
    selectedTrackId,
    showTooltip,
    updatePosition,
    hideTooltip,
    setSelectedTrackId
  );

  return track;
}

// Helper function to draw connectors for a link
export function drawLinkConnectors(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  link: ForceLink,
  nodes: ForceNode[],
  events: NarrativeEvent[],
  eventGroups: Map<number, d3.Selection<SVGGElement, unknown, null, undefined>>,
  selectedEventId: number | null,
  layer: "outer" | "inner"
) {
  const { sourceNode, targetNode } = getNodesFromLink(link, nodes);

  if (!sourceNode || !targetNode) return;

  const yDifference = Math.abs(sourceNode.y - targetNode.y);
  if (yDifference >= 1) return;

  const sourceEventId = parseInt(sourceNode.id.split("-")[0]);
  const targetEventId = parseInt(targetNode.id.split("-")[0]);

  // Create or get the event groups
  if (!eventGroups.has(sourceEventId)) {
    eventGroups.set(sourceEventId, createEventGroup(g, sourceEventId));
  }
  if (!eventGroups.has(targetEventId)) {
    eventGroups.set(targetEventId, createEventGroup(g, targetEventId));
  }

  const sourceGroup = eventGroups.get(sourceEventId) as d3.Selection<
    SVGGElement,
    unknown,
    null,
    undefined
  >;
  const targetGroup = eventGroups.get(targetEventId) as d3.Selection<
    SVGGElement,
    unknown,
    null,
    undefined
  >;

  if (layer === "outer") {
    // Add outer connector to both groups
    createConnector(
      sourceGroup,
      sourceNode.x,
      sourceNode.y,
      targetNode.x,
      targetNode.y,
      "connector-outer",
      "#000",
      ENTITY_CONFIG.event.connectorStrokeWidth +
        ENTITY_CONFIG.point.strokeWidth * 1.25
    );

    createConnector(
      targetGroup,
      sourceNode.x,
      sourceNode.y,
      targetNode.x,
      targetNode.y,
      "connector-outer",
      "#000",
      ENTITY_CONFIG.event.connectorStrokeWidth +
        ENTITY_CONFIG.point.strokeWidth * 1.25
    );
  } else {
    // Add inner connector to both groups
    const sourceEvent = getEventFromNodeId(sourceNode.id, events);
    const connectorColor = sourceEvent
      ? getSentimentColor(sourceEvent.topic.sentiment.polarity)
      : "#fff";

    createConnector(
      sourceGroup,
      sourceNode.x,
      sourceNode.y,
      targetNode.x,
      targetNode.y,
      "connector-inner",
      connectorColor,
      ENTITY_CONFIG.event.connectorStrokeWidth * 0.85
    );

    createConnector(
      targetGroup,
      sourceNode.x,
      sourceNode.y,
      targetNode.x,
      targetNode.y,
      "connector-inner",
      connectorColor,
      ENTITY_CONFIG.event.connectorStrokeWidth * 0.85
    );
  }
}
