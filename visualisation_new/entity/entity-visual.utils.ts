import { NarrativeEvent } from "@/types/data";
import { Entity } from "@/types/study";
import * as d3 from "d3";
import { ENTITY_CONFIG } from "./entity-config";
import { getNodetColor } from "@/components/visualisation/shared/color-utils";
import {
  createNarrativeYAxis,
  calculateResponsiveDimensions,
} from "@/components/visualisation/shared/visualization-utils";

export type EntityAttribute = string;

export interface EntityMention {
  entity: Entity;
  count: number;
}

// Calculate dimensions that fit content within container height
export function getEntityDimensions(
  containerWidth: number,
  containerHeight: number,
  eventsLength: number
) {
  return calculateResponsiveDimensions(
    containerWidth,
    containerHeight,
    eventsLength,
    ENTITY_CONFIG,
    30, // minEventHeight - minimum readable height
    100 // maxEventHeight - maximum comfortable height
  );
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
        (entity as unknown as Record<string, unknown>)[selectedAttribute] ===
          undefined ||
        (entity as unknown as Record<string, unknown>)[selectedAttribute] ===
          null ||
        (entity as unknown as Record<string, unknown>)[selectedAttribute] === ""
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
export function getEntities(
  entityMentions: Map<string, EntityMention>,
  selectedTrackId: string | null = null,
  focusedEventId: number | null = null,
  events: NarrativeEvent[] = []
): Entity[] {
  // If no entity mentions, return empty array
  if (entityMentions.size === 0) {
    return [];
  }

  // Get entities related to selected event
  const selectedEventEntities = new Set<string>();
  if (focusedEventId !== null) {
    const selectedEvent = events.find((e) => e.index === focusedEventId);
    if (selectedEvent) {
      selectedEvent.entities.forEach((entity) => {
        selectedEventEntities.add(entity.id);
      });
    }
  }

  // Convert to array and sort
  const sortedEntities = Array.from(entityMentions.values())
    .sort((a, b) => {
      // First priority: selected track
      if (selectedTrackId) {
        if (a.entity.id === selectedTrackId) return -1;
        if (b.entity.id === selectedTrackId) return 1;
      }

      // Second priority: entities in selected event
      const aInSelectedEvent = selectedEventEntities.has(a.entity.id);
      const bInSelectedEvent = selectedEventEntities.has(b.entity.id);
      if (aInSelectedEvent && !bInSelectedEvent) return -1;
      if (!aInSelectedEvent && bInSelectedEvent) return 1;

      // Third priority: count
      return b.count - a.count;
    })
    .map((item) => item.entity);

  return sortedEntities;
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
  const minTime = Math.min(
    ...events.map((e) => e.temporal_anchoring.narrative_time)
  );
  const maxTime = Math.max(
    ...events.map((e) => e.temporal_anchoring.narrative_time)
  );

  return d3
    .scaleLinear()
    .domain([Math.floor(minTime), Math.ceil(maxTime)])
    .range([0, height])
    .nice();
}

// Create y-axis with integer ticks
export function createYAxis(yScale: d3.ScaleLinear<number, number>) {
  return createNarrativeYAxis(yScale);
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

// Get relevant entities for an event
function getRelevantEntities(
  event: NarrativeEvent,
  visibleEntities: Entity[],
  selectedAttribute: string
) {
  // If the event has no entities, return empty
  if (!event.entities || event.entities.length === 0) {
    return { entities: [] };
  }

  // Get the IDs of all visible entities
  const visibleEntityIds = new Set(visibleEntities.map((entity) => entity.id));

  // Filter event entities to only include those that match visible entities by ID
  const filteredEntities = event.entities.filter(
    (entity: Entity) =>
      // Entity must have the selected attribute
      (entity as unknown as Record<string, unknown>)[selectedAttribute] !==
        undefined &&
      (entity as unknown as Record<string, unknown>)[selectedAttribute] !==
        null &&
      (entity as unknown as Record<string, unknown>)[selectedAttribute] !==
        "" &&
      // And its ID must be in the visible entities set
      visibleEntityIds.has(entity.id)
  );

  return { entities: filteredEntities };
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

// Helper function to create event node
export function createEventNode(
  parent: d3.Selection<any, unknown, null, undefined>,
  cx: number,
  cy: number,
  event: NarrativeEvent,
  focusedEventId: number | null,
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
    .attr("fill", getNodetColor(event))
    .attr(
      "stroke",
      focusedEventId === event.index ? ENTITY_CONFIG.highlight.color : "black"
    )
    .attr("stroke-width", ENTITY_CONFIG.point.strokeWidth)
    .style("cursor", "pointer");
}

// Helper function to create connector
function createConnector(
  parent: d3.Selection<any, unknown, null, undefined>,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  className: string,
  stroke: string,
  strokeWidth: number,
  eventIndex?: number
) {
  const connector = parent
    .append("line")
    .attr("class", className)
    .attr("x1", x1)
    .attr("y1", y1)
    .attr("x2", x2)
    .attr("y2", y2)
    .attr("stroke", stroke)
    .attr("stroke-width", strokeWidth)
    .attr("stroke-linecap", "round");

  // Add event index as data attribute for outer connectors
  if (className === "connector-outer" && eventIndex !== undefined) {
    connector.attr("data-event-index", eventIndex);
  }

  return connector;
}

// Helper function to get event from node ID
export function getEventFromNodeId(nodeId: string, events: NarrativeEvent[]) {
  const eventId = parseInt(nodeId.split("-")[0]);
  return events.find((e) => e.index === eventId);
}

// Helper function to get nodes from link
function getNodesFromLink(
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
    type: string
  ) => void,
  updatePosition: (x: number, y: number) => void,
  hideTooltip: () => void,
  setfocusedEventId: (id: number | null) => void,
  focusedEventId: number | null,
  toggleMarkedEvent: (id: number) => void
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
      showTooltip(event, e.pageX, e.pageY, "entity");
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
      setfocusedEventId(focusedEventId === event.index ? null : event.index);
      toggleMarkedEvent(event.index);
    });
}

// Simplified metro track creation - just creates a smooth path through points
export function createMetroTrack(
  points: Array<{ x: number; y: number }>,
  options: { yScale?: d3.ScaleLinear<number, number> } = {}
) {
  const path = d3.path();
  if (points.length < 2) return path;

  // Start the path
  path.moveTo(points[0].x, points[0].y);

  // For a simple smooth curve, use quadratic curves between points
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];

    if (i === 1) {
      // First segment, just line to second point
      path.lineTo(curr.x, curr.y);
    } else {
      // Use the previous point as control point for smooth curves
      const controlX = (prev.x + curr.x) / 2;
      const controlY = (prev.y + curr.y) / 2;
      path.quadraticCurveTo(prev.x, prev.y, controlX, controlY);
      path.lineTo(curr.x, curr.y);
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
    type: string,
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
    .attr("opacity", selectedTrackId === entity.id ? 0.8 : 0.3)
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
        showTooltip(null, event.pageX, event.pageY, "entity", entity);
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
      setSelectedTrackId(selectedTrackId === entity.id ? null : entity.id);
    });

  return track;
}

// Helper function to draw connectors for a link
export function drawLinkConnectors(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  link: ForceLink,
  nodes: ForceNode[],
  events: NarrativeEvent[],
  eventGroups: Map<number, d3.Selection<SVGGElement, unknown, null, undefined>>,
  focusedEventId: number | null,
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
        ENTITY_CONFIG.point.strokeWidth * 1.25,
      sourceEventId
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
        ENTITY_CONFIG.point.strokeWidth * 1.25,
      targetEventId
    );
  } else {
    // Add inner connector to both groups
    const sourceEvent = getEventFromNodeId(sourceNode.id, events);
    const connectorColor = sourceEvent ? getNodetColor(sourceEvent) : "#fff";

    createConnector(
      sourceGroup,
      sourceNode.x,
      sourceNode.y,
      targetNode.x,
      targetNode.y,
      "connector-inner",
      connectorColor,
      ENTITY_CONFIG.event.connectorStrokeWidth * 0.85,
      sourceEventId
    );

    createConnector(
      targetGroup,
      sourceNode.x,
      sourceNode.y,
      targetNode.x,
      targetNode.y,
      "connector-inner",
      connectorColor,
      ENTITY_CONFIG.event.connectorStrokeWidth * 0.85,
      targetEventId
    );
  }
}
