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
