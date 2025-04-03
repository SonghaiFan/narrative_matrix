"use client";

import { NarrativeEvent } from "@/types/lite";
import { useEffect, useRef, useCallback, useState } from "react";
import * as d3 from "d3";
import { ENTITY_CONFIG } from "./entity-config";
import { useTooltip } from "@/contexts/tooltip-context";
import { useCenterControl } from "@/contexts/center-control-context";
import {
  getEntityDimensions,
  getEntityMentions,
  calculateColumnLayout,
  createXScale,
  createYScale,
  createYAxis,
  getRelevantEntities,
  getVisibleEntities,
  calculateForceLayout,
  createEventNode,
  createConnector,
  getEventFromNodeId,
  getNodesFromLink,
  createEventGroup,
  addEventGroupHoverEffects,
  addTrackHoverEffects,
} from "./entity-visual.utils";
import { createMetroTrack } from "./entity-visual.utils";
import {
  getSentimentColor,
  getHighlightColor,
} from "@/components/features/narrative/shared/color-utils";

export interface EntityVisualProps {
  events: NarrativeEvent[];
}

export function EntityVisual({ events }: EntityVisualProps) {
  const { selectedEventId, setSelectedEventId } = useCenterControl();
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const selectedNodeRef = useRef<SVGCircleElement | null>(null);
  const { showTooltip, hideTooltip, updatePosition } = useTooltip();

  // Function to update node styles based on selectedEventId
  const updateSelectedEventStyles = useCallback(
    (newSelectedId: number | null) => {
      if (!svgRef.current) return;

      // Reset all nodes and connectors to default style
      d3.select(svgRef.current)
        .selectAll(".event-node")
        .attr("stroke", "black");

      d3.select(svgRef.current)
        .selectAll(".connector-outer")
        .attr("stroke", "#000");

      // Get guide lines group
      const guideLine = d3.select(svgRef.current).select(".guide-lines");

      // Hide guide line by default
      guideLine.style("display", "none");

      // If we have a selected event, highlight it and show guide line
      if (newSelectedId !== null) {
        const selectedGroup = d3
          .select(svgRef.current)
          .select(`.event-group-${newSelectedId}`);

        if (!selectedGroup.empty()) {
          // Update node style in the group
          selectedGroup
            .selectAll(".event-node")
            .attr("stroke", getHighlightColor());

          // Update outer connector style in the group
          selectedGroup
            .selectAll(".connector-outer")
            .attr("stroke", getHighlightColor());

          // Get the selected node
          const node = selectedGroup
            .select(".event-node")
            .node() as SVGCircleElement;
          let y = 0;

          // Get the y position from the node
          y = parseFloat(node.getAttribute("cy") || "0");

          // Update guide line position and show it
          guideLine
            .style("display", "block")
            .select(".horizontal")
            .attr("y1", y)
            .attr("y2", y);

          // Store the selected node in the ref and scroll into view
          selectedNodeRef.current = node;
          selectedNodeRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }
    },
    []
  );

  // Function to update the visualization
  const updateVisualization = useCallback(() => {
    if (
      !events.length ||
      !svgRef.current ||
      !containerRef.current ||
      !headerRef.current
    )
      return;

    // Store current selection before clearing
    const currentSelection = selectedEventId;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();
    d3.select(headerRef.current).selectAll("*").remove();

    // Setup dimensions first
    const { containerHeight, height } = getEntityDimensions(
      containerRef.current.clientWidth,
      events.length
    );

    // Get all entity mentions
    const entityMentions = getEntityMentions(events, "name");
    const allEntities = getVisibleEntities(entityMentions);

    // Calculate layout dimensions for all entities
    const { totalColumnsWidth } = calculateColumnLayout(
      containerRef.current.clientWidth,
      allEntities
    );

    // Create scales
    const xScale = createXScale(allEntities, totalColumnsWidth);
    const yScale = createYScale(events, height);
    const yAxis = createYAxis(yScale);

    // Create fixed header for entity labels
    const headerWidth =
      totalColumnsWidth +
      ENTITY_CONFIG.margin.left +
      ENTITY_CONFIG.margin.right;

    const headerContainer = d3
      .select(headerRef.current)
      .style("width", `${headerWidth}px`);

    // Create header content container with proper margin
    const headerContent = headerContainer
      .append("div")
      .style("position", "relative")
      .style("margin-left", `${ENTITY_CONFIG.margin.left}px`)
      .style("width", `${totalColumnsWidth}px`);

    // Create entity labels in the fixed header
    allEntities.forEach((entity) => {
      const x = xScale(entity.id)! + xScale.bandwidth() / 2;

      const labelContainer = headerContent
        .append("div")
        .attr("class", "absolute -translate-x-1/2 cursor-pointer")
        .style("left", `${x}px`)
        .style("max-width", `${xScale.bandwidth()}px`)
        .on("click", () => {
          setSelectedTrackId(selectedTrackId === entity.id ? null : entity.id);
        });

      // Show only the entity name with text wrapping
      labelContainer
        .append("div")
        .attr(
          "class",
          [
            "font-semibold",
            `text-xs`,
            selectedTrackId === entity.id ? "text-blue-600" : "text-gray-700",
            "text-center",
            "break-words",
            "leading-tight",
            "line-clamp-3",
            "transition-colors",
            "duration-200",
            "hover:text-blue-600",
          ].join(" ")
        )
        .attr("title", entity.name)
        .text(entity.name);
    });

    // Create SVG with proper dimensions
    const svg = d3
      .select(svgRef.current)
      .attr("width", headerWidth)
      .attr("height", containerHeight)
      .style("overflow", "visible");

    // Create main group with proper margin
    const g = svg
      .append("g")
      .attr(
        "transform",
        `translate(${ENTITY_CONFIG.margin.left},${ENTITY_CONFIG.margin.top})`
      );

    // Add horizontal guide line (hidden by default)
    const guideLine = g
      .append("g")
      .attr("class", "guide-lines")
      .style("display", "none");

    guideLine
      .append("line")
      .attr("class", "guide-line horizontal")
      .attr("x1", 0)
      .attr("x2", totalColumnsWidth)
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2);

    // Apply force layout for all entities with connections
    const forceLayout = calculateForceLayout(
      events,
      allEntities,
      totalColumnsWidth,
      height,
      "name"
    );

    // Draw entity track
    allEntities.forEach((entity) => {
      const entitySlug = entity.id.replace(/\s+/g, "-");
      const startX = xScale(entity.id)! + xScale.bandwidth() / 2;

      // Get all nodes for this entity from the force layout
      const entityNodes = forceLayout.nodes
        .filter((node) => node.entity.id === entity.id)
        .sort((a, b) => a.y - b.y);

      if (entityNodes.length > 0) {
        // Create points array including start point
        const points = [
          { x: startX, y: 0 },
          ...entityNodes.map((node) => ({ x: node.x, y: node.y })),
        ];

        // Create the metro-style path
        const metroPath = createMetroTrack(points, { yScale });

        // Create the curved path with hover interaction
        const track = g
          .append("path")
          .attr("class", `track-${entitySlug}`)
          .attr("d", metroPath.toString())
          .attr("fill", "none")
          .attr("stroke", selectedTrackId === entity.id ? "#3b82f6" : "#94a3b8")
          .attr("stroke-width", ENTITY_CONFIG.track.strokeWidth)
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
      } else {
        // If no nodes, draw a straight line as fallback
        const track = g
          .append("line")
          .attr("class", `track-${entitySlug}`)
          .attr("x1", startX)
          .attr("y1", 0)
          .attr("x2", startX)
          .attr("y2", height)
          .attr("stroke", selectedTrackId === entity.id ? "#3b82f6" : "#94a3b8")
          .attr("stroke-width", ENTITY_CONFIG.track.strokeWidth)
          .attr("opacity", selectedTrackId === entity.id ? 0.8 : 0.15);

        addTrackHoverEffects(
          track,
          entity,
          selectedTrackId,
          showTooltip,
          updatePosition,
          hideTooltip,
          setSelectedTrackId
        );
      }
    });

    // Add y-axis with integer ticks
    g.append("g")
      .attr("class", "y-axis")
      .call(yAxis)
      .style("font-size", `${ENTITY_CONFIG.axis.fontSize}px`)
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke", "#94a3b8"))
      .append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -40)
      .attr("fill", "#64748b")
      .attr("text-anchor", "middle")
      .text("Narrative Time");

    // Create a map to store event groups
    const eventGroups = new Map();

    // 1. First draw the outer black connector
    forceLayout.links.forEach((link) => {
      const { sourceNode, targetNode } = getNodesFromLink(
        link,
        forceLayout.nodes
      );

      if (sourceNode && targetNode) {
        const yDifference = Math.abs(sourceNode.y - targetNode.y);

        if (yDifference < 1) {
          const sourceEventId = parseInt(sourceNode.id.split("-")[0]);
          const targetEventId = parseInt(targetNode.id.split("-")[0]);

          // Create or get the event groups
          if (!eventGroups.has(sourceEventId)) {
            eventGroups.set(sourceEventId, createEventGroup(g, sourceEventId));
          }
          if (!eventGroups.has(targetEventId)) {
            eventGroups.set(targetEventId, createEventGroup(g, targetEventId));
          }

          const sourceGroup = eventGroups.get(sourceEventId);
          const targetGroup = eventGroups.get(targetEventId);

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
        }
      }
    });

    // 2. Draw nodes in the middle from the force simulation
    forceLayout.nodes.forEach((node) => {
      const event = getEventFromNodeId(node.id, events);

      if (event) {
        // Create or get the event group
        if (!eventGroups.has(event.index)) {
          eventGroups.set(event.index, createEventGroup(g, event.index));
        }

        const eventGroup = eventGroups.get(event.index);

        // Create the event node
        createEventNode(eventGroup, node.x, node.y, event, selectedEventId);

        // Add hover effects to the entire group
        addEventGroupHoverEffects(
          eventGroup,
          event,
          showTooltip,
          updatePosition,
          hideTooltip,
          setSelectedEventId,
          selectedEventId
        );
      }
    });

    // 3. Finally draw the inner connector on top
    forceLayout.links.forEach((link) => {
      const { sourceNode, targetNode } = getNodesFromLink(
        link,
        forceLayout.nodes
      );

      if (sourceNode && targetNode) {
        const yDifference = Math.abs(sourceNode.y - targetNode.y);

        if (yDifference < 1) {
          const sourceEventId = parseInt(sourceNode.id.split("-")[0]);
          const targetEventId = parseInt(targetNode.id.split("-")[0]);

          const sourceEvent = getEventFromNodeId(sourceNode.id, events);
          const connectorColor = sourceEvent
            ? getSentimentColor(sourceEvent.topic.sentiment.polarity)
            : "#fff";

          const sourceGroup = eventGroups.get(sourceEventId);
          const targetGroup = eventGroups.get(targetEventId);

          // Add inner connector to both groups
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
    });

    // After visualization is complete, reapply selection if it exists
    if (currentSelection !== null && currentSelection !== undefined) {
      updateSelectedEventStyles(currentSelection);
    }
  }, [
    events,
    showTooltip,
    hideTooltip,
    updatePosition,
    setSelectedEventId,
    selectedEventId,
    updateSelectedEventStyles,
    selectedTrackId,
    setSelectedTrackId,
  ]);

  // Keep selection handling in a separate effect
  useEffect(() => {
    if (svgRef.current && selectedEventId !== undefined) {
      updateSelectedEventStyles(selectedEventId);
    }
  }, [selectedEventId, updateSelectedEventStyles]);

  // Initial setup and cleanup with resize observer
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(updateVisualization);
    });

    resizeObserver.observe(containerRef.current);
    resizeObserverRef.current = resizeObserver;

    updateVisualization();

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [updateVisualization]);

  return (
    <div
      className="w-full h-full overflow-y-scroll"
      style={{ scrollbarGutter: "stable" }}
    >
      <div className="min-w-fit">
        <div
          ref={headerRef}
          style={{ height: `${ENTITY_CONFIG.header.height}px` }}
          className="bg-white sticky top-0 z-10 shadow-sm"
        />
        <div ref={containerRef}>
          <svg ref={svgRef} className="w-full" />
        </div>
      </div>
    </div>
  );
}
