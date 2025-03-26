"use client";

import { NarrativeEvent } from "@/types/narrative/lite";
import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import { ENTITY_CONFIG } from "./entity-config";
import { useTooltip } from "@/contexts/tooltip-context";
import { useCenterControl } from "@/contexts/center-control-context";
import {
  calculateDimensions,
  calculateMaxEntities,
  getEntityMentions,
  getVisibleEntities,
  calculateColumnLayout,
  createXScale,
  createYScale,
  createYAxis,
  getRelevantEntities,
  calculateConnectorPoints,
} from "./entity-visual.utils";
import { getSentimentColor } from "@/components/shared/color-utils";

export interface EntityVisualProps {
  events: NarrativeEvent[];
}

export function EntityVisual({ events }: EntityVisualProps) {
  const { selectedEventId, setSelectedEventId } = useCenterControl();
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
        .each(function () {
          const node = d3.select(this);
          // Only reset the stroke color, not the radius
          node.attr("stroke", "black");
        });

      // If we have a selected event, highlight it
      if (newSelectedId !== null) {
        const selectedNodes = d3
          .select(svgRef.current)
          .selectAll(`.event-node[data-event-index="${newSelectedId}"]`);

        if (!selectedNodes.empty()) {
          // Only change the stroke color for selection, not the radius
          selectedNodes.attr("stroke", "#3b82f6"); // Blue highlight for selected event

          // Store the first selected node in the ref
          selectedNodeRef.current = selectedNodes.node() as SVGCircleElement;

          // Scroll the selected node into view
          if (selectedNodeRef.current) {
            selectedNodeRef.current.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }
      }
    },
    []
  );

  // Effect to handle selectedEventId changes without full re-render
  useEffect(() => {
    if (svgRef.current) {
      updateSelectedEventStyles(selectedEventId || null);
    }
  }, [selectedEventId, updateSelectedEventStyles]);

  // Function to update the visualization
  const updateVisualization = useCallback(() => {
    if (
      !events.length ||
      !svgRef.current ||
      !containerRef.current ||
      !headerRef.current
    )
      return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();
    d3.select(headerRef.current).selectAll("*").remove();

    // Setup dimensions first
    const { containerWidth, width, containerHeight, height } =
      calculateDimensions(containerRef.current.clientWidth, events.length);

    // Get entity mentions and calculate visible entities
    const entityMentions = getEntityMentions(events, "name");

    // console.log(entityMentions);
    const maxEntities = calculateMaxEntities(
      width,
      ENTITY_CONFIG.entity.minColumnWidth,
      ENTITY_CONFIG.entity.columnGap
    );
    const visibleEntities = getVisibleEntities(entityMentions, maxEntities);

    // console.log(visibleEntities);

    // Calculate layout dimensions
    const { totalColumnsWidth, leftOffset } = calculateColumnLayout(
      width,
      visibleEntities
    );

    // Create scales
    const xScale = createXScale(visibleEntities, totalColumnsWidth);
    const yScale = createYScale(events, height);
    const yAxis = createYAxis(yScale);

    // Create fixed header for entity labels
    const headerContainer = d3
      .select(headerRef.current)
      .style("width", `${containerWidth}px`)
      .style("margin-left", "0")
      .style("background-color", "white");

    // Create header content container with centered alignment
    const headerContent = headerContainer
      .append("div")
      .style("position", "relative")
      .style("margin-left", `${leftOffset}px`)
      .style("width", `${totalColumnsWidth}px`);

    // Create entity labels in the fixed header
    visibleEntities.forEach((entity) => {
      const x = xScale(entity.id)!;
      const labelContainer = headerContent
        .append("div")
        .style("position", "absolute")
        .style("left", `${x + xScale.bandwidth() / 2}px`)
        .style("transform", "translateX(-50%)")
        .style("cursor", "pointer")
        .style("max-width", `${xScale.bandwidth()}px`)
        .on("mouseenter", function () {
          g.select(`.guide-line-${entity.id.replace(/\s+/g, "-")}`)
            .attr("opacity", 0.8)
            .attr("stroke-width", ENTITY_CONFIG.entity.lineStrokeWidth);
        })
        .on("mouseleave", function () {
          g.select(`.guide-line-${entity.id.replace(/\s+/g, "-")}`)
            .attr("opacity", 0.3)
            .attr("stroke-width", ENTITY_CONFIG.entity.lineStrokeWidth);
        });

      // Show only the entity name with text wrapping
      labelContainer
        .append("div")
        .style("font-weight", "600")
        .style("font-size", "12px")
        .style("color", "#374151")
        .style("text-align", "center")
        .style("word-wrap", "break-word")
        .style("white-space", "normal")
        .style("line-height", "1.2")
        .style("max-height", "2.4em")
        .style("overflow", "hidden")
        .style("display", "-webkit-box")
        .style("-webkit-line-clamp", "2")
        .style("-webkit-box-orient", "vertical")
        .attr("title", entity.name)
        .text(entity.name);
    });

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", containerWidth)
      .attr("height", containerHeight)
      .style("max-width", "100%");

    // Create main group with centered alignment
    const g = svg
      .append("g")
      .attr(
        "transform",
        `translate(${leftOffset},${ENTITY_CONFIG.margin.top})`
      );

    // Draw entity columns
    visibleEntities.forEach((entity) => {
      // Use entity ID for positioning instead of attribute value
      const x = xScale(entity.id)!;
      const entityColor = "#94a3b8";

      g.append("line")
        .attr("class", `guide-line-${entity.id.replace(/\s+/g, "-")}`)
        .attr("x1", x + xScale.bandwidth() / 2)
        .attr("y1", 0)
        .attr("x2", x + xScale.bandwidth() / 2)
        .attr("y2", height)
        .attr("stroke", entityColor)
        .attr("stroke-width", ENTITY_CONFIG.entity.lineStrokeWidth)
        .attr("opacity", 0.3);
    });

    // Add y-axis with integer ticks
    g.append("g")
      .attr("class", "y-axis")
      .call(yAxis)
      .style("font-size", "12px")
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

    // Draw event nodes and connectors
    events.forEach((event) => {
      const y = yScale(event.temporal_anchoring.narrative_time);
      const relevantEntities = getRelevantEntities(
        event,
        visibleEntities,
        "name"
      );

      if (
        relevantEntities.hasNoEntities ||
        relevantEntities.hasNoVisibleEntities
      ) {
        // Draw a single dashed node for events with no entities or no visible entities
        g.append("circle")
          .attr("class", "event-node")
          .attr("data-event-index", event.index)
          .attr("cx", 0)
          .attr("cy", y)
          .attr("r", ENTITY_CONFIG.event.nodeRadius)
          .attr("fill", getSentimentColor(event.topic.sentiment.polarity))
          .attr(
            "stroke",
            relevantEntities.hasNoEntities ? "#94a3b8" : "#64748b"
          )
          .attr("stroke-width", ENTITY_CONFIG.event.nodeStrokeWidth)
          .attr("stroke-dasharray", "3,3")
          .style("cursor", "pointer")
          .on("mouseenter", function (e) {
            d3.select(this)
              .transition()
              .duration(200)
              .attr("r", ENTITY_CONFIG.event.nodeRadius * 1.5);

            showTooltip(event, e.pageX, e.pageY, "entity");
            updatePosition(e.pageX, e.pageY);
          })
          .on("mousemove", function (e) {
            updatePosition(e.pageX, e.pageY);
          })
          .on("mouseleave", function () {
            d3.select(this)
              .transition()
              .duration(200)
              .attr("r", ENTITY_CONFIG.event.nodeRadius);
            hideTooltip();
          })
          .on("click", function () {
            setSelectedEventId(
              selectedEventId === event.index ? null : event.index
            );
          });
      } else if (relevantEntities.entities.length > 0) {
        const connectorPoints = calculateConnectorPoints(
          relevantEntities.entities,
          xScale,
          "name"
        );

        if (connectorPoints.length > 0) {
          // Create a single curved connector path
          const connectorGroup = g
            .append("g")
            .attr("class", "connector-group")
            .attr("transform", `translate(0, ${y})`);

          if (connectorPoints.length > 1) {
            // Create curved path for multiple points
            const path = d3.path();
            connectorPoints.forEach((point, i) => {
              if (i === 0) {
                path.moveTo(point.x, 0);
              } else {
                const prevPoint = connectorPoints[i - 1];
                const midX = (prevPoint.x + point.x) / 2;
                path.bezierCurveTo(
                  midX,
                  0, // Control point 1
                  midX,
                  0, // Control point 2
                  point.x,
                  0 // End point
                );
              }
            });

            connectorGroup
              .append("path")
              .attr("d", path.toString())
              .attr("fill", "none")
              .attr("stroke", "#94a3b8")
              .attr("stroke-width", 2)
              .attr("opacity", 0.6);
          }

          // Draw nodes on top of the connector
          connectorPoints.forEach((point) => {
            const node = connectorGroup
              .append("circle")
              .attr("class", "event-node")
              .attr("data-event-index", event.index)
              .attr("cx", point.x)
              .attr("cy", 0)
              .attr("r", ENTITY_CONFIG.event.nodeRadius)
              .attr("fill", getSentimentColor(event.topic.sentiment.polarity))
              .attr(
                "stroke",
                selectedEventId === event.index ? "#3b82f6" : "black"
              )
              .attr("stroke-width", ENTITY_CONFIG.event.nodeStrokeWidth)
              .style("cursor", "pointer");

            // Add event handlers
            node
              .on("mouseenter", function (e) {
                d3.select(this)
                  .transition()
                  .duration(200)
                  .attr("r", ENTITY_CONFIG.event.nodeRadius * 1.5);

                showTooltip(event, e.pageX, e.pageY, "entity");
                updatePosition(e.pageX, e.pageY);
              })
              .on("mousemove", function (e) {
                updatePosition(e.pageX, e.pageY);
              })
              .on("mouseleave", function () {
                d3.select(this)
                  .transition()
                  .duration(200)
                  .attr("r", ENTITY_CONFIG.event.nodeRadius);
                hideTooltip();
              })
              .on("click", function () {
                setSelectedEventId(
                  selectedEventId === event.index ? null : event.index
                );
              });
          });
        }
      }
    });

    // Apply initial highlighting for selected event
    if (selectedEventId !== null && selectedEventId !== undefined) {
      updateSelectedEventStyles(selectedEventId);
    }
  }, [events, showTooltip, hideTooltip, updatePosition, setSelectedEventId]);

  // Initial setup and cleanup
  useEffect(() => {
    if (!containerRef.current) return;

    // Create ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      // Use requestAnimationFrame to throttle updates
      window.requestAnimationFrame(updateVisualization);
    });

    // Start observing
    resizeObserver.observe(containerRef.current);
    resizeObserverRef.current = resizeObserver;

    // Initial render
    updateVisualization();

    // Cleanup
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [updateVisualization]);

  return (
    <div className="w-full h-full flex flex-col overflow-auto">
      <div className="flex-none bg-white sticky top-0 z-10 shadow-sm">
        <div
          ref={headerRef}
          style={{ height: `${ENTITY_CONFIG.header.height}px` }}
        />
      </div>
      <div ref={containerRef} className="flex-1 relative">
        <svg ref={svgRef} className="w-full h-full" />
      </div>
    </div>
  );
}
