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
  getVisibleEntities,
  calculateForceLayout,
  createEventNode,
  getEventFromNodeId,
  createEventGroup,
  addEventGroupHoverEffects,
  drawLinkConnectors,
} from "./entity-visual-utils";
import { createMetroTrack } from "./entity-visual-utils";
import { createTrackWithHover } from "./entity-visual-utils";

export interface EntityVisualProps {
  events: NarrativeEvent[];
  selectedAttribute?: string;
}

export function EntityVisual({ events, selectedAttribute = "name" }: EntityVisualProps) {
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
            .attr("stroke", ENTITY_CONFIG.highlight.color);

          // Update outer connector style in the group
          selectedGroup
            .selectAll(".connector-outer")
            .attr("stroke", ENTITY_CONFIG.highlight.color);

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

          // Store the selected node in the ref
          selectedNodeRef.current = node;

          // Always scroll into view when an event is selected
          // This ensures that when selectedEventId changes, the view scrolls to the selected node
          selectedNodeRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }
    },
    []
  );

  // Function to update node styles based on selectedTrackId
  const updateSelectedTrackStyles = useCallback(
    (trackId: string | null, selectedEventId: number | null) => {
      if (!svgRef.current || trackId === null) return;

      // Find all nodes associated with the selected track using the data-entity-id attribute
      const selectedNodes = d3
        .select(svgRef.current)
        .selectAll(".event-node")
        .filter(function () {
          // Get the entity ID from the node
          const entityId = d3.select(this).attr("data-entity-id");
          return entityId === trackId;
        });

      // Apply highlight border to all nodes on the selected track
      // but skip the selected event node
      selectedNodes
        .filter(function () {
          const eventIndex = d3.select(this).attr("data-event-index");
          return eventIndex !== String(selectedEventId);
        })
        .attr("stroke", ENTITY_CONFIG.highlight.color)
        .attr("stroke-width", ENTITY_CONFIG.point.strokeWidth * 1.5);
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
    const currentTrackSelection = selectedTrackId;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();
    d3.select(headerRef.current).selectAll("*").remove();

    // Setup dimensions first
    const { containerHeight, height } = getEntityDimensions(
      containerRef.current.clientWidth,
      events.length
    );

    // Get all entity mentions
    const entityMentions = getEntityMentions(events, selectedAttribute);
    const allEntities = getVisibleEntities(
      entityMentions,
      selectedTrackId,
      selectedEventId,
      events
    );

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
          // Toggle highlight only
          setSelectedTrackId((prev) => (prev === entity.id ? null : entity.id));
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

    // Add vertical separator lines between entity columns (skip last)
    if (allEntities.length > 1) {
      const headerBarHeight = ENTITY_CONFIG.header.height * 0.7;
      allEntities.slice(0, -1).forEach((entity) => {
        const xRight = xScale(entity.id)! + xScale.bandwidth();
        headerContent
          .append("div")
          .attr("class", "absolute")
          .style("left", `${xRight}px`)
          .style(
            "top",
            `${(ENTITY_CONFIG.header.height - headerBarHeight) / 2}px`
          )
          .style("width", "1px")
          .style("height", `${headerBarHeight}px`)
          .style("background-color", "#cbd5e1") // slate-300
          .style("pointer-events", "none")
          .style("transform", "translateX(-0.5px)");
      });
    }

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
      .attr("stroke", ENTITY_CONFIG.highlight.color)
      .attr("stroke-width", 2);

    // Apply force layout for all entities with connections
    const forceLayout = calculateForceLayout(
      events,
      allEntities,
      totalColumnsWidth,
      height,
      selectedAttribute
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
        createTrackWithHover(
          g,
          entity,
          entitySlug,
          selectedTrackId,
          showTooltip,
          updatePosition,
          hideTooltip,
          setSelectedTrackId,
          true,
          { d: metroPath.toString() }
        );
      } else {
        // If no nodes, draw a straight line as fallback
        createTrackWithHover(
          g,
          entity,
          entitySlug,
          selectedTrackId,
          showTooltip,
          updatePosition,
          hideTooltip,
          setSelectedTrackId,
          false,
          { x1: startX, y1: 0, x2: startX, y2: height }
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
      .text("Paragraph Index");

    // Create a map to store event groups
    const eventGroups = new Map();

    // 1. First draw the outer black connector
    forceLayout.links.forEach((link) => {
      drawLinkConnectors(
        g,
        link,
        forceLayout.nodes,
        events,
        eventGroups,
        selectedEventId,
        "outer"
      );
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

        // Extract entity ID from node ID (format: "eventIndex-entityId")
        const entityId = node.id.split("-")[1];

        // Create the event node
        createEventNode(
          eventGroup,
          node.x,
          node.y,
          event,
          selectedEventId,
          entityId
        );

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
      drawLinkConnectors(
        g,
        link,
        forceLayout.nodes,
        events,
        eventGroups,
        selectedEventId,
        "inner"
      );
    });

    // After visualization is complete, reapply selection if it exists
    if (currentSelection !== null && currentSelection !== undefined) {
      updateSelectedEventStyles(currentSelection);
    }

    // Reapply track selection if it exists
    if (currentTrackSelection !== null) {
      setSelectedTrackId(currentTrackSelection);
      // Apply track styling after setting the track ID
      updateSelectedTrackStyles(currentTrackSelection, currentSelection);
    }
  }, [
    events,
    selectedAttribute,
    showTooltip,
    hideTooltip,
    updatePosition,
    setSelectedEventId,
    selectedEventId,
    updateSelectedEventStyles,
    selectedTrackId,
    setSelectedTrackId,
    updateSelectedTrackStyles,
  ]);

  // Keep selection handling in a separate effect
  useEffect(() => {
    if (svgRef.current && selectedEventId !== undefined) {
      updateSelectedEventStyles(selectedEventId);

      // If a track is also selected, apply track styling after event styling
      if (selectedTrackId !== null) {
        updateSelectedTrackStyles(selectedTrackId, selectedEventId);
      }
    }
  }, [
    selectedEventId,
    updateSelectedEventStyles,
    selectedTrackId,
    updateSelectedTrackStyles,
  ]);

  // Add effect to highlight nodes on selected track
  useEffect(() => {
    if (!svgRef.current) return;

    // Reset all nodes to default stroke style
    d3.select(svgRef.current)
      .selectAll(".event-node")
      .attr("stroke", "black")
      .attr("stroke-width", ENTITY_CONFIG.point.strokeWidth);

    // If a track is selected, apply track styling
    if (selectedTrackId !== null) {
      updateSelectedTrackStyles(selectedTrackId, selectedEventId);
    }
  }, [selectedTrackId, selectedEventId, updateSelectedTrackStyles]);

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
      className="w-full h-full overflow-scroll"
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
