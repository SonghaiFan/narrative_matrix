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
  createMetroTrack,
} from "./entity-visual.utils";
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

      // Reset all nodes to default style
      d3.select(svgRef.current)
        .selectAll(".event-node")
        .attr("stroke", "black");

      // Get guide lines group
      const guideLine = d3.select(svgRef.current).select(".guide-lines");

      // Hide guide line by default
      guideLine.style("display", "none");

      // If we have a selected event, highlight it and show guide line
      if (newSelectedId !== null) {
        const selectedNodes = d3
          .select(svgRef.current)
          .selectAll(`.event-node[data-event-index="${newSelectedId}"]`);

        if (!selectedNodes.empty()) {
          // Update node style
          selectedNodes.attr("stroke", getHighlightColor());

          // Get the selected node
          const node = selectedNodes.node() as SVGCircleElement;
          let y = 0;

          // Find the parent connector group if it exists
          const parentGroup = d3.select(node.parentElement);
          if (parentGroup.classed("connector-group")) {
            // Get the transform attribute which contains the y position
            const transform = parentGroup.attr("transform");
            const match = transform.match(/translate\(0,\s*([^)]+)\)/);
            if (match) {
              y = parseFloat(match[1]);
            }
          } else {
            // For nodes without connector groups (e.g., nodes with no entities)
            y = parseFloat(node.getAttribute("cy") || "0");
          }

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
        .sort((a, b) => a.y - b.y); // Sort by y position to ensure correct path order

      if (entityNodes.length > 0) {
        // Create points array including start point
        const points = [
          { x: startX, y: 0 }, // Start from the entity's column position at y=0
          ...entityNodes.map((node) => ({ x: node.x, y: node.y })),
        ];

        // Create the metro-style path using the utility function
        const metroPath = createMetroTrack(points, {
          cornerRadius: 8,
          gridSize: 15,
          preferredAngles: [0, 45, 90, 135, 180],
          minSegmentLength: 20,
          smoothing: true,
          yScale,
        });

        // Create the curved path with hover interaction
        g.append("path")
          .attr("class", `track-${entitySlug}`)
          .attr("d", metroPath.toString())
          .attr("fill", "none")
          .attr("stroke", selectedTrackId === entity.id ? "#3b82f6" : "#94a3b8")
          .attr("stroke-width", ENTITY_CONFIG.track.strokeWidth)
          .attr("opacity", selectedTrackId === entity.id ? 0.8 : 0.3)
          .style("cursor", "pointer")
          .on("mouseenter", function (this: SVGPathElement, event: MouseEvent) {
            // Smoothly increase stroke width and opacity
            d3.select(this)
              .transition()
              .duration(200)
              .attr("stroke-width", ENTITY_CONFIG.track.strokeWidth * 1.5)
              .attr("opacity", selectedTrackId === entity.id ? 1 : 0.5);

            // Show tooltip with entity name
            showTooltip(null, event.pageX, event.pageY, "entity", entity);
            updatePosition(event.pageX, event.pageY);
          })
          .on("mousemove", function (event: MouseEvent) {
            updatePosition(event.pageX, event.pageY);
          })
          .on("mouseleave", function (this: SVGPathElement) {
            // Smoothly revert stroke width and opacity
            d3.select(this)
              .transition()
              .duration(200)
              .attr("stroke-width", ENTITY_CONFIG.track.strokeWidth)
              .attr("opacity", selectedTrackId === entity.id ? 0.8 : 0.3);

            hideTooltip();
          })
          .on("click", function () {
            setSelectedTrackId(
              selectedTrackId === entity.id ? null : entity.id
            );
          });
      } else {
        // If no nodes, draw a straight line as fallback with hover interaction
        g.append("line")
          .attr("class", `track-${entitySlug}`)
          .attr("x1", startX)
          .attr("y1", 0)
          .attr("x2", startX)
          .attr("y2", height)
          .attr("stroke", selectedTrackId === entity.id ? "#3b82f6" : "#94a3b8")
          .attr("stroke-width", ENTITY_CONFIG.track.strokeWidth)
          .attr("opacity", selectedTrackId === entity.id ? 0.8 : 0.15)
          .style("cursor", "pointer")
          .on("mouseenter", function (this: SVGLineElement, event: MouseEvent) {
            // Smoothly increase stroke width and opacity
            d3.select(this)
              .transition()
              .duration(200)
              .attr("stroke-width", ENTITY_CONFIG.track.strokeWidth * 1.5)
              .attr("opacity", selectedTrackId === entity.id ? 1 : 0.3);

            // Show tooltip with entity name
            showTooltip(null, event.pageX, event.pageY, "entity", entity);
            updatePosition(event.pageX, event.pageY);
          })
          .on("mousemove", function (event: MouseEvent) {
            updatePosition(event.pageX, event.pageY);
          })
          .on("mouseleave", function (this: SVGLineElement) {
            // Smoothly revert stroke width and opacity
            d3.select(this)
              .transition()
              .duration(200)
              .attr("stroke-width", ENTITY_CONFIG.track.strokeWidth)
              .attr("opacity", selectedTrackId === entity.id ? 0.8 : 0.15);

            hideTooltip();
          })
          .on("click", function () {
            setSelectedTrackId(
              selectedTrackId === entity.id ? null : entity.id
            );
          });
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

    // Helper function to create event node with event handlers
    const createEventNode = (
      parent: d3.Selection<any, unknown, null, undefined>,
      cx: number,
      cy: number,
      event: NarrativeEvent
    ) => {
      const node = parent
        .append("circle")
        .attr("class", "event-node")
        .attr("data-event-index", event.index)
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("r", ENTITY_CONFIG.point.radius)
        .attr("fill", getSentimentColor(event.topic.sentiment.polarity))
        .attr(
          "stroke",
          selectedEventId === event.index ? getHighlightColor() : "black"
        )
        .attr("stroke-width", ENTITY_CONFIG.point.strokeWidth)
        .style("cursor", "pointer");

      // Add event handlers
      node
        .on("mouseenter", function (this: SVGCircleElement, e: MouseEvent) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr("r", ENTITY_CONFIG.point.radius * 1.5);

          showTooltip(event, e.pageX, e.pageY, "entity");
          updatePosition(e.pageX, e.pageY);
        })
        .on("mousemove", function (e: MouseEvent) {
          updatePosition(e.pageX, e.pageY);
        })
        .on("mouseleave", function (this: SVGCircleElement) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr("r", ENTITY_CONFIG.point.radius);
          hideTooltip();
        })
        .on("click", function () {
          setSelectedEventId(
            selectedEventId === event.index ? null : event.index
          );
        });

      return node;
    };

    // Draw event nodes and connectors
    events.forEach((event) => {
      const y = yScale(event.temporal_anchoring.narrative_time);
      const relevantEntities = getRelevantEntities(event, allEntities, "name");

      if (
        relevantEntities.hasNoEntities ||
        relevantEntities.hasNoVisibleEntities
      ) {
        // Draw a single dashed node for events with no entities or no visible entities
        createEventNode(g, 0, y, event)
          .attr(
            "stroke",
            relevantEntities.hasNoEntities ? "#94a3b8" : "#64748b"
          )
          .attr("stroke-dasharray", "3,3");
      } else if (relevantEntities.entities.length > 0) {
        // Skip this - we'll use the force layout instead
      }
    });

    // Draw links from the force simulation
    const linkGroup = g.append("g").attr("class", "links");
    forceLayout.links.forEach((link) => {
      // Get the source and target nodes
      const sourceNode =
        typeof link.source === "string"
          ? forceLayout.nodes.find((n) => n.id === link.source)
          : link.source;

      const targetNode =
        typeof link.target === "string"
          ? forceLayout.nodes.find((n) => n.id === link.target)
          : link.target;

      if (sourceNode && targetNode) {
        // Only draw links between nodes at the same narrative time (same y-coordinate)
        // This skips the vertical entity links that would make the visualization messy
        const yDifference = Math.abs(sourceNode.y - targetNode.y);

        if (yDifference < 5) {
          // Small threshold to account for floating point precision
          // Create a curved path between nodes
          const path = d3.path();
          path.moveTo(sourceNode.x, sourceNode.y);

          // Create a gentle curve
          const midX = (sourceNode.x + targetNode.x) / 2;
          path.bezierCurveTo(
            midX,
            sourceNode.y, // Control point 1
            midX,
            targetNode.y, // Control point 2
            targetNode.x,
            targetNode.y // End point
          );

          linkGroup
            .append("path")
            .attr("d", path.toString())
            .attr("fill", "none")
            .attr("stroke", "#94a3b8")
            .attr("stroke-width", 1.5)
            .attr("opacity", 0.6);
        }
      }
    });

    // Draw nodes from the force simulation
    forceLayout.nodes.forEach((node) => {
      const eventId = parseInt(node.id.split("-")[0]);
      const event = events.find((e) => e.index === eventId);

      if (event) {
        createEventNode(g, node.x, node.y, event);
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
