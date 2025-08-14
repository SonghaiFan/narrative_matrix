"use client";

import { NarrativeEvent } from "@/types/data";
import { useEffect, useRef, useCallback, useState } from "react";
import * as d3 from "d3";
import { ENTITY_CONFIG } from "./entity-config";
// import { useTooltip } from "@/contexts/tooltip-context"; // Removed tooltip functionality
import { useCenterControl } from "@/contexts/center-control-context";
import {
  getEntityDimensions,
  getEntityMentions,
  calculateColumnLayout,
  createXScale,
  createYScale,
  createYAxis,
  getEntities,
  calculateForceLayout,
  createEventNode,
  getEventFromNodeId,
  createEventGroup,
  addEventGroupHoverEffects,
  drawLinkConnectors,
} from "./entity-visual.utils";
import { createMetroTrack } from "./entity-visual.utils";
import { createTrackWithHover } from "./entity-visual.utils";

export interface EntityVisualProps {
  events: NarrativeEvent[];
}

export function EntityVisual({ events }: EntityVisualProps) {
  const {
    focusedEventId,
    setfocusedEventId,
    markedEventIds,
    toggleMarkedEvent,
    isEventMarked,
  } = useCenterControl();
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const selectedNodeRef = useRef<SVGCircleElement | null>(null);
  // const { showTooltip, hideTooltip, updatePosition } = useTooltip(); // Removed tooltip functionality
  const showTooltip = () => {}; // Placeholder
  const hideTooltip = useCallback(() => {}, []); // Placeholder
  const updatePosition = useCallback(() => {}, []); // Placeholder

  // Function to update marked event styles
  const updateMarkedEventStyles = useCallback(() => {
    if (!svgRef.current) return;

    // Update all nodes and connectors for marked events
    d3.select(svgRef.current)
      .selectAll(".event-node")
      .attr("stroke", function () {
        const eventIndex = d3.select(this).attr("data-event-index");
        return isEventMarked(Number(eventIndex))
          ? ENTITY_CONFIG.highlight.color
          : "black";
      })
      .attr("stroke-width", function () {
        const eventIndex = d3.select(this).attr("data-event-index");
        return isEventMarked(Number(eventIndex))
          ? 2
          : ENTITY_CONFIG.point.strokeWidth;
      });

    // Update all outer connectors for marked events
    d3.select(svgRef.current)
      .selectAll(".connector-outer")
      .attr("stroke", function () {
        const eventIndex = d3.select(this).attr("data-event-index");
        return isEventMarked(Number(eventIndex))
          ? ENTITY_CONFIG.highlight.color
          : "black";
      })
      .attr("stroke-width", function () {
        const eventIndex = d3.select(this).attr("data-event-index");
        return isEventMarked(Number(eventIndex))
          ? ENTITY_CONFIG.event.connectorStrokeWidth +
              ENTITY_CONFIG.point.strokeWidth * 1.5
          : ENTITY_CONFIG.event.connectorStrokeWidth +
              ENTITY_CONFIG.point.strokeWidth * 1.25;
      });
  }, [isEventMarked]);

  // Function to update selected event styles
  const updateSelectedEventStyles = useCallback(
    (newSelectedId: number | null) => {
      if (!svgRef.current) return;

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
    (trackId: string | null, focusedEventId: number | null) => {
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
      // but skip the selected event node and marked nodes
      selectedNodes
        .filter(function () {
          const eventIndex = d3.select(this).attr("data-event-index");
          return (
            eventIndex !== String(focusedEventId) &&
            !isEventMarked(Number(eventIndex))
          );
        })
        .attr("stroke", ENTITY_CONFIG.highlight.color)
        .attr("stroke-width", ENTITY_CONFIG.point.strokeWidth * 1.5);
    },
    [isEventMarked]
  );

  // Add effect to update styles when marked events change
  useEffect(() => {
    if (svgRef.current) {
      updateMarkedEventStyles();
      updateSelectedEventStyles(focusedEventId);
      if (selectedTrackId) {
        updateSelectedTrackStyles(selectedTrackId, focusedEventId);
      }
    }
  }, [
    markedEventIds,
    focusedEventId,
    selectedTrackId,
    updateMarkedEventStyles,
    updateSelectedEventStyles,
    updateSelectedTrackStyles,
  ]);

  // Add effect to update styles when selected event changes
  useEffect(() => {
    if (svgRef.current) {
      updateSelectedEventStyles(focusedEventId);
      if (selectedTrackId) {
        updateSelectedTrackStyles(selectedTrackId, focusedEventId);
      }
    }
  }, [
    focusedEventId,
    selectedTrackId,
    updateSelectedEventStyles,
    updateSelectedTrackStyles,
  ]);

  // Function to handle background click
  const handleBackgroundClick = useCallback(() => {
    // Deselect any selected event
    setfocusedEventId(null);
    setSelectedTrackId(null);
    hideTooltip();
  }, [setfocusedEventId, setSelectedTrackId, hideTooltip]);

  // Create header for entity labels
  const updateHeader = (
    headerRef: HTMLDivElement,
    allEntities: Array<{ id: string; name: string }>,
    xScale: d3.ScaleBand<string>,
    totalColumnsWidth: number,
    selectedTrackId: string | null
  ) => {
    const headerWidth =
      totalColumnsWidth +
      ENTITY_CONFIG.margin.left +
      ENTITY_CONFIG.margin.right;

    // Select or create the header container
    const headerContainer = d3
      .select(headerRef)
      .style("width", `${headerWidth}px`);

    // Select or create the header content container
    let headerContent =
      headerContainer.select<HTMLDivElement>(".header-content");

    if (headerContent.empty()) {
      headerContent = headerContainer
        .append("div")
        .attr("class", "header-content")
        .style("position", "relative")
        .style("margin-left", `${ENTITY_CONFIG.margin.left}px`);
    }

    headerContent.style("width", `${totalColumnsWidth}px`);

    // Bind data to entity labels
    const labelContainers = headerContent
      .selectAll<HTMLDivElement, { id: string; name: string }>(
        ".entity-label-container"
      )
      .data(allEntities, (d) => d.id);

    // Remove old labels
    labelContainers
      .exit()
      .transition()
      .duration(500)
      .style("opacity", 0)
      .remove();

    // Create new labels
    const enterLabelContainers = labelContainers
      .enter()
      .append("div")
      .attr(
        "class",
        "entity-label-container absolute -translate-x-1/2 cursor-pointer"
      )
      .style("opacity", 0)
      .style("left", (d) => `${xScale(d.id)! + xScale.bandwidth() / 2}px`)
      .style("max-width", `${xScale.bandwidth()}px`)
      .on("click", (event, d) => {
        setSelectedTrackId(selectedTrackId === d.id ? null : d.id);
      });

    // Add text to new labels
    enterLabelContainers
      .append("div")
      .attr("class", (d) => {
        return [
          "font-semibold",
          "text-xs",
          selectedTrackId === d.id ? "text-blue-600" : "text-gray-700",
          "text-center",
          "break-words",
          "leading-tight",
          "line-clamp-3",
          "transition-colors",
          "duration-200",
          "hover:text-blue-600",
        ].join(" ");
      })
      .attr("title", (d) => d.name)
      .text((d) => d.name);

    // Merge enter + update selections
    const allLabelContainers = labelContainers.merge(enterLabelContainers);

    // Update all labels with transitions
    allLabelContainers
      .transition()
      .duration(500)
      .style("opacity", 1)
      .style("left", (d) => `${xScale(d.id)! + xScale.bandwidth() / 2}px`)
      .style("max-width", `${xScale.bandwidth()}px`);

    // Update text color for selection state
    allLabelContainers.select("div").attr("class", (d) => {
      return [
        "font-semibold",
        "text-xs",
        selectedTrackId === d.id ? "text-blue-600" : "text-gray-700",
        "text-center",
        "break-words",
        "leading-tight",
        "line-clamp-3",
        "transition-colors",
        "duration-200",
        "hover:text-blue-600",
      ].join(" ");
    });
  };

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
    const currentSelection = focusedEventId;
    const currentTrackSelection = selectedTrackId;

    // Clear previous content for SVG but not header
    d3.select(svgRef.current).selectAll("*").remove();

    // Setup dimensions first - get the main container height (the one with overflow-auto)
    const mainContainer = containerRef.current.closest(
      ".overflow-auto"
    ) as HTMLElement;
    const availableHeight = mainContainer
      ? mainContainer.clientHeight - ENTITY_CONFIG.header.height
      : window.innerHeight - ENTITY_CONFIG.header.height - 100; // fallback with some margin

    const { containerHeight, height } = getEntityDimensions(
      containerRef.current.clientWidth,
      availableHeight,
      events.length
    );

    // Get all entity mentions
    const entityMentions = getEntityMentions(events, "name");
    const allEntities = getEntities(
      entityMentions,
      selectedTrackId,
      focusedEventId,
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

    // Update header with entity labels using D3 pattern
    updateHeader(
      headerRef.current,
      allEntities,
      xScale,
      totalColumnsWidth,
      selectedTrackId
    );

    // Create SVG with proper dimensions
    const svg = d3
      .select(svgRef.current)
      .attr(
        "width",
        totalColumnsWidth +
          ENTITY_CONFIG.margin.left +
          ENTITY_CONFIG.margin.right
      )
      .attr("height", containerHeight)
      .style("overflow", "visible");

    // Add background click handler
    svg.on("click", function (e) {
      // Check if the click was on the background (not on any event node or track)
      const target = e.target as SVGElement;
      if (target.tagName === "svg" || target.classList.contains("background")) {
        handleBackgroundClick();
      }
    });

    // Create main group with proper margin
    const g = svg
      .append("g")
      .attr(
        "transform",
        `translate(${ENTITY_CONFIG.margin.left},${ENTITY_CONFIG.margin.top})`
      );

    // Add background rectangle for click handling
    g.append("rect")
      .attr("class", "background")
      .attr("width", totalColumnsWidth)
      .attr("height", height)
      .attr("fill", "none")
      .attr("pointer-events", "all");

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
      .text("← Paragraph");

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
        focusedEventId,
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
          focusedEventId,
          entityId
        );

        // Add hover effects to the entire group
        addEventGroupHoverEffects(
          eventGroup,
          event,
          showTooltip,
          updatePosition,
          hideTooltip,
          setfocusedEventId,
          focusedEventId,
          toggleMarkedEvent
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
        focusedEventId,
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

    // Apply marked event styles
    updateMarkedEventStyles();
  }, [
    events,
    focusedEventId,
    selectedTrackId,
    setfocusedEventId,
    showTooltip,
    hideTooltip,
    updatePosition,
    toggleMarkedEvent,
    updateMarkedEventStyles,
    updateSelectedEventStyles,
    updateSelectedTrackStyles,
    handleBackgroundClick,
  ]);

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
      className="w-full h-full overflow-auto"
      style={{ scrollbarGutter: "stable" }}
    >
      <div className="min-w-fit">
        <div
          ref={headerRef}
          style={{ height: `${ENTITY_CONFIG.header.height}px` }}
          className="bg-white sticky top-0 z-10 shadow-sm"
        />
        <div ref={containerRef}>
          <svg ref={svgRef} className="block" />
        </div>
      </div>
    </div>
  );
}
