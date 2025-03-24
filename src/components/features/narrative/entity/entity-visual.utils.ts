import { Entity, NarrativeEvent } from "@/types/narrative/lite";
import * as d3 from "d3";
import { ENTITY_CONFIG } from "./entity-config";

export type EntityAttribute = string;

export interface EntityMention {
  entity: Entity;
  count: number;
}

// Function to get entity attribute value
export function getEntityAttributeValue(
  entity: Entity,
  attribute: EntityAttribute
): string {
  // If entity is undefined or null, return "Unknown"
  if (!entity) {
    return "Unknown";
  }

  // If the attribute doesn't exist on this entity or is empty, return "Unknown"
  if (
    attribute === "" ||
    entity[attribute] === undefined ||
    entity[attribute] === null ||
    entity[attribute] === ""
  ) {
    return "Unknown";
  }

  const value = entity[attribute];
  return value?.toString() || "Unknown";
}

// Calculate dimensions for the visualization
export function calculateDimensions(
  containerWidth: number,
  eventsLength: number
) {
  const width =
    containerWidth - ENTITY_CONFIG.margin.left - ENTITY_CONFIG.margin.right;
  const minHeight =
    eventsLength * 20 + ENTITY_CONFIG.margin.top + ENTITY_CONFIG.margin.bottom;
  const containerHeight = Math.max(minHeight, ENTITY_CONFIG.minHeight);
  const height =
    containerHeight - ENTITY_CONFIG.margin.top - ENTITY_CONFIG.margin.bottom;

  return { containerWidth, width, containerHeight, height };
}

// Calculate how many entities can fit based on available width
export function calculateMaxEntities(
  availableWidth: number,
  minColumnWidth: number,
  columnGap: number
): number {
  // Calculate how many entities would fit with the minimum column width
  const entitiesFit = Math.floor(
    (availableWidth + columnGap) / (minColumnWidth + columnGap)
  );

  // Always show at least 5 entities if there's enough width for at least 3
  if (entitiesFit >= 3 && entitiesFit < 5) {
    return 5;
  }

  return Math.max(entitiesFit, 1); // Always show at least 1 entity
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

  events.forEach((event) => {
    event.entities.forEach((entity) => {
      // Skip entities that don't have the selected attribute
      if (
        entity[selectedAttribute] === undefined ||
        entity[selectedAttribute] === null ||
        entity[selectedAttribute] === ""
      ) {
        return;
      }

      // Use ID as the primary key for uniqueness
      if (!uniqueEntitiesById.has(entity.id)) {
        uniqueEntitiesById.set(entity.id, entity);
      }
    });
  });

  // Initialize count map for each unique entity
  const entityCounts = new Map<string, number>();
  uniqueEntitiesById.forEach((_, id) => {
    entityCounts.set(id, 0);
  });

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

// Get visible entities based on available space
export function getVisibleEntities(
  entityMentions: Map<string, EntityMention>,
  maxEntities: number
): Entity[] {
  // If no entity mentions, return empty array
  if (entityMentions.size === 0) {
    return [];
  }

  return Array.from(entityMentions.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, maxEntities)
    .map((item) => item.entity);
}

// Calculate column width and layout dimensions
export function calculateColumnLayout(
  width: number,
  visibleEntities: Entity[]
) {
  // Calculate responsive column width
  const totalGapWidth =
    (visibleEntities.length - 1) * ENTITY_CONFIG.entity.columnGap;
  const availableWidth = width - totalGapWidth;

  // Calculate column width based on number of entities
  let columnWidth = Math.min(
    ENTITY_CONFIG.entity.maxColumnWidth,
    Math.max(
      ENTITY_CONFIG.entity.minColumnWidth,
      availableWidth / visibleEntities.length
    )
  );

  // If we have more entities than would normally fit (forced by calculateMaxEntities),
  // we need to reduce the column width below the minimum to make them fit
  if (
    availableWidth / visibleEntities.length <
    ENTITY_CONFIG.entity.minColumnWidth
  ) {
    // Use a smaller column width, but ensure it's at least 30px
    columnWidth = Math.max(30, availableWidth / visibleEntities.length);
  }

  // Calculate total width including gaps
  const totalColumnsWidth =
    columnWidth * visibleEntities.length + totalGapWidth;

  // Center the visualization if total width is less than available width
  const leftOffset =
    ENTITY_CONFIG.margin.left + (width - totalColumnsWidth) / 2;

  return {
    totalGapWidth,
    availableWidth,
    columnWidth,
    totalColumnsWidth,
    leftOffset,
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
  return d3
    .axisLeft(yScale)
    .tickSize(5)
    .tickPadding(5)
    .ticks(Math.ceil(yScale.domain()[1]))
    .tickFormat(d3.format("d"));
}

// Filter relevant entities for an event
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
    (entity) =>
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

// Calculate connector line points for entities
export function calculateConnectorPoints(
  relevantEntities: Entity[],
  xScale: d3.ScaleBand<string>,
  selectedAttribute: string
) {
  if (!relevantEntities.length) return [];

  // Sort entities by x position to optimize connector layout
  const sortedEntities = [...relevantEntities].sort((a, b) => {
    const xA = xScale(a.id)! + xScale.bandwidth() / 2;
    const xB = xScale(b.id)! + xScale.bandwidth() / 2;
    return xA - xB;
  });

  // Calculate points for a single curved connector
  return sortedEntities.map((entity, i) => {
    const x = xScale(entity.id)! + xScale.bandwidth() / 2;
    return {
      x,
      entity,
      isFirst: i === 0,
      isLast: i === sortedEntities.length - 1,
    };
  });
}
