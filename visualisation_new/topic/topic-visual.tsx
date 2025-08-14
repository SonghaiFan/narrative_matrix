"use client";

import { NarrativeEvent } from "@/types/data";
import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import { TOPIC_CONFIG } from "./topic-config";
import { useCenterControl } from "@/contexts/center-control-context";
import { getNodetColor } from "@/components/visualisation/shared/color-utils";
import {
  processEvents,
  getTopicCounts,
  getTopTopics,
  getScales,
  createAxes,
  groupOverlappingPoints,
  calculateExpandedPositions,
  calculateRectDimensions,
  calculateRectPosition,
  calculateCenterPoint,
  normalizeSemanticEmbeddings,
  type DataPoint,
  type GroupedPoint,
} from "./topic-visual.utils";

interface TopicVisualProps {
  events: NarrativeEvent[];
  viewMode: "main" | "sub" | "sentiment";
  useSemanticAxis?: boolean;
  metadata: {
    publishDate: string;
  };
}

interface PointState {
  x: number;
  y: number;
  isExpanded: boolean;
}

interface ChildPoint extends DataPoint {
  parentKey: string;
  index: number;
  total: number;
}

export function NarrativeTopicVisual({
  events,
  viewMode,
  useSemanticAxis,
  metadata,
}: TopicVisualProps) {
  const {
    focusedEventId,
    setfocusedEventId,
    markedEventIds,
    toggleMarkedEvent,
    isEventMarked,
  } = useCenterControl();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const pointStatesRef = useRef<Map<string, PointState>>(new Map());

  // Generate unique IDs for nodes
  const getParentNodeId = useCallback((groupKey: string) => {
    const safeKey = groupKey.replace(/[^a-zA-Z0-9-_]/g, "_");
    return `parent-node-${safeKey}`;
  }, []);

  const getChildNodeId = useCallback((eventIndex: number) => {
    return `child-node-${eventIndex}`;
  }, []);

  // Helper function to calculate proper collapsed dimensions considering date range bounds
  const calculateCollapsedDimensions = useCallback((d: GroupedPoint) => {
    const hasDateRangeBounds = d.minX !== undefined && d.maxX !== undefined;

    if (hasDateRangeBounds) {
      // For date range groups, maintain the capsule shape
      const spanWidth = Math.max(
        d.maxX! - d.minX! + TOPIC_CONFIG.point.radius * 2,
        TOPIC_CONFIG.point.radius * 2
      );

      return {
        x: d.minX! - TOPIC_CONFIG.point.radius + spanWidth / 2, // Center of the capsule
        y: d.y,
        width: spanWidth,
        height: TOPIC_CONFIG.point.radius * 2,
        rx: TOPIC_CONFIG.point.radius,
        ry: TOPIC_CONFIG.point.radius,
        rectX: d.minX! - TOPIC_CONFIG.point.radius,
        rectY: d.y - TOPIC_CONFIG.point.radius,
      };
    } else {
      // For single points, use the traditional logic
      const dimensions = calculateRectDimensions(
        d.points.length,
        TOPIC_CONFIG.point.radius
      );
      const position = calculateRectPosition(
        d.x,
        d.y,
        dimensions.width,
        dimensions.height
      );

      return {
        x: d.x,
        y: d.y,
        width: dimensions.width,
        height: dimensions.height,
        rx: dimensions.rx,
        ry: dimensions.ry,
        rectX: position.rectX,
        rectY: position.rectY,
      };
    }
  }, []);

  // Update node styles based on focusedEventId and markedEventIds
  const updateSelectedEventStyles = useCallback(
    (newSelectedId: number | null, xScale?: any) => {
      if (!svgRef.current) return;

      // Reset all nodes to default stroke style, only marked events get blue border
      d3.select(svgRef.current)
        .selectAll(".parent-point, .child-point-rect")
        .attr("stroke", (d: any) => {
          // For child nodes, check the single event; for parent nodes, check if any child is marked
          const isMarked = d.event?.index
            ? isEventMarked(d.event.index) // Child node
            : d.points?.some((point: DataPoint) =>
                isEventMarked(point.event.index)
              ); // Parent node
          return isMarked ? TOPIC_CONFIG.highlight.color : "black";
        })
        .attr("stroke-width", (d: any) => {
          // For child nodes, check the single event; for parent nodes, check if any child is marked
          const isMarked = d.event?.index
            ? isEventMarked(d.event.index) // Child node
            : d.points?.some((point: DataPoint) =>
                isEventMarked(point.event.index)
              ); // Parent node
          return isMarked ? 3 : TOPIC_CONFIG.point.strokeWidth;
        });

      const guideLine = d3.select(svgRef.current).select(".guide-lines");
      guideLine.style("display", "none");

      // Hide all guide elements
      guideLine.selectAll(".guide-line").style("display", "none");
      guideLine.selectAll(".guide-label").style("display", "none");

      if (newSelectedId === null) return;

      // Try to find and highlight the parent node
      const parentNode = d3
        .select(svgRef.current)
        .selectAll(".parent-point")
        .filter(function () {
          return (
            d3.select(this).attr("data-event-index") === String(newSelectedId)
          );
        });

      // Try to find and highlight the child node
      const childNode = d3
        .select(svgRef.current)
        .selectAll(".child-point-rect")
        .filter(function () {
          return (
            d3.select(this).attr("data-event-index") === String(newSelectedId)
          );
        });

      // Show guide lines for the selected node
      let selectedNode = null;
      if (!parentNode.empty()) {
        selectedNode = parentNode.node() as SVGRectElement;
      } else if (!childNode.empty()) {
        selectedNode = childNode.node() as SVGRectElement;
      }

      if (selectedNode && xScale) {
        // Get the selected node's position and dimensions
        const x = parseFloat(selectedNode.getAttribute("x") || "0");
        const width = parseFloat(selectedNode.getAttribute("width") || "0");
        const y = parseFloat(selectedNode.getAttribute("y") || "0");
        const height = parseFloat(selectedNode.getAttribute("height") || "0");

        // Calculate guide line positions
        const centerY = y + height / 2;

        // For date ranges, use the right edge (excluding the end cap)
        // For single points, use the center
        const isDateRange = width > TOPIC_CONFIG.point.radius * 2 + 2; // Add small epsilon for rounding
        const rightEdgeX = isDateRange
          ? x + width - TOPIC_CONFIG.point.radius // For date ranges, use position just before the end cap
          : x + width / 2; // For single points, use the center

        // Show and position guide lines
        guideLine.style("display", "block");

        // Update horizontal guide line
        guideLine
          .select(".guide-line.horizontal")
          .style("display", "block")
          .attr("y1", centerY)
          .attr("y2", centerY);

        // Update vertical guide line
        guideLine
          .select(".guide-line.vertical")
          .style("display", "block")
          .attr("x1", rightEdgeX)
          .attr("x2", rightEdgeX);

        // Get the selected node's data to show date labels
        const nodeData = d3.select(selectedNode).datum() as any;
        if (nodeData) {
          const startDate = nodeData.realTime || nodeData.points?.[0]?.realTime;

          if (startDate) {
            if (Array.isArray(startDate)) {
              // Date range - show both start and end labels
              const [start, end] = startDate;
              const startX = xScale(start);
              const endX = xScale(end);

              // Start date label
              guideLine
                .select(".guide-label.start")
                .style("display", "block")
                .attr("x", startX - 5)
                .text(start.toLocaleDateString());

              // End date label
              guideLine
                .select(".guide-label.end")
                .style("display", "block")
                .attr("x", endX + 5)
                .text(end.toLocaleDateString());

              // Show both vertical lines for date ranges
              guideLine
                .select(".guide-line.vertical.start")
                .style("display", "block")
                .attr("x1", startX)
                .attr("x2", startX);

              guideLine
                .select(".guide-line.vertical.end")
                .style("display", "block")
                .attr("x1", endX)
                .attr("x2", endX);
            } else {
              // Single date - show single label
              const dateX = xScale(startDate);

              // Single date label
              guideLine
                .select(".guide-label.start")
                .style("display", "block")
                .attr("x", dateX - 5)
                .text(startDate.toLocaleDateString());

              // Single vertical line
              guideLine
                .select(".guide-line.vertical")
                .style("display", "block")
                .attr("x1", dateX)
                .attr("x2", dateX);
            }
          }
        }
      }
    },
    [isEventMarked]
  );

  // Handle background click to deselect
  const handleBackgroundClick = useCallback(() => {
    // Deselect any selected event
    setfocusedEventId(null);

    // Close all expanded parent nodes
    if (svgRef.current) {
      // Reset multi-child parent nodes to collapsed state (single-child groups remain visible)
      d3.select(svgRef.current)
        .selectAll(".point-group")
        .each(function (d: any) {
          if (d.isExpanded && d.points.length > 1) {
            d.isExpanded = false;

            // Update the pointStatesRef to reflect the collapsed state
            if (d.key) {
              const currentState = pointStatesRef.current.get(d.key);
              if (currentState) {
                pointStatesRef.current.set(d.key, {
                  ...currentState,
                  isExpanded: false,
                });
              }
            }

            // Update the visual state
            const parent = d3.select(this);
            const children = parent.selectAll(".child-point");
            const parentRect = parent.select("rect");
            const countText = parent.select("text");

            // Use the proper collapsed dimensions that consider date range bounds
            const collapsedDims = calculateCollapsedDimensions(d);

            // Smooth transition for parent rectangle collapse
            parentRect
              .transition()
              .duration(200)
              .attr("width", collapsedDims.width)
              .attr("height", collapsedDims.height)
              .attr("x", collapsedDims.rectX)
              .attr("y", collapsedDims.rectY)
              .attr("rx", collapsedDims.rx)
              .attr("ry", collapsedDims.ry)
              .style("opacity", 1)
              .style("cursor", "pointer")
              .style("pointer-events", "all");

            // Update count text position
            if (countText) {
              countText
                .transition()
                .duration(200)
                .attr("x", collapsedDims.x)
                .attr("y", collapsedDims.y);
            }

            children
              .transition()
              .duration(200)
              .style("opacity", (d: any) => (d.total === 1 ? 1 : 0)) // Keep single-child nodes visible
              .style("pointer-events", (d: any) =>
                d.total === 1 ? "all" : "none"
              ); // Keep single-child nodes interactive
          }
        });
    }
  }, [setfocusedEventId, calculateCollapsedDimensions]);

  // Update visualization
  const updateVisualization = useCallback(() => {
    if (
      !events.length ||
      !svgRef.current ||
      !containerRef.current ||
      !headerRef.current
    )
      return;

    // Store current selection and expanded states
    const currentSelection = focusedEventId;
    const currentExpandedStates = new Map(pointStatesRef.current);

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();
    d3.select(headerRef.current).selectAll("*").remove();

    // Process data
    const rawDataPoints = processEvents(events, viewMode);
    // Normalize semantic embeddings to -1 to 1 range
    const dataPoints = normalizeSemanticEmbeddings(rawDataPoints);
    const topicCounts = getTopicCounts(dataPoints, viewMode);
    // Always sort topics by semantic embedding for better arrangement
    const topTopics = getTopTopics(topicCounts, viewMode, dataPoints, true);

    // Get container dimensions
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    const width = Math.max(
      0,
      containerWidth - TOPIC_CONFIG.margin.left - TOPIC_CONFIG.margin.right
    );
    const height = Math.max(
      0,
      containerHeight - TOPIC_CONFIG.margin.top - TOPIC_CONFIG.margin.bottom
    );

    // Create scales and axes
    const { xScale, yScale } = getScales(
      dataPoints,
      topTopics,
      width,
      height,
      useSemanticAxis
    );
    const { xAxis, yAxis } = createAxes(
      xScale,
      yScale,
      TOPIC_CONFIG,
      useSemanticAxis
    );

    // Create header
    const headerContainer = d3
      .select(headerRef.current)
      .style("width", `${containerWidth}px`)
      .style("margin-left", "0")
      .style("background-color", "white");

    const headerContent = headerContainer
      .append("div")
      .style("margin-left", `${TOPIC_CONFIG.margin.left}px`)
      .style("width", `${width}px`);

    const headerSvg = headerContent
      .append("svg")
      .attr("width", width + TOPIC_CONFIG.margin.right)
      .attr("height", TOPIC_CONFIG.header.height)
      .style("overflow", "visible");

    headerSvg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,30)`)
      .call(xAxis)
      .style("font-size", `${TOPIC_CONFIG.axis.fontSize}px`)
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke", "#94a3b8"));

    // Add "Real Time" label to x-axis
    headerSvg
      .append("text")
      .attr("class", "x-axis-label")
      .attr("x", -TOPIC_CONFIG.margin.left + 50)
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .attr("fill", "#64748b")
      .style("font-size", "12px")
      .style("font-weight", "500")
      .text("Real Time →");

    // Create main SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", containerWidth)
      .attr("height", containerHeight)
      .style("display", "block")
      .style("overflow", "visible");

    // Add background rectangle to capture clicks outside nodes
    svg
      .append("rect")
      .attr("class", "background-rect")
      .attr("width", containerWidth)
      .attr("height", containerHeight)
      .attr("fill", "transparent")
      .style("pointer-events", "all")
      .on("click", handleBackgroundClick);

    const g = svg
      .append("g")
      .attr(
        "transform",
        `translate(${TOPIC_CONFIG.margin.left},${TOPIC_CONFIG.margin.top})`
      );

    // Add vertical grid background for real time axis
    const gridGroup = g.append("g").attr("class", "background-grid");
    const gridCellPx = 40; // Size of grid cell in pixels for equal intervals
    // Draw vertical grid lines at equal intervals
    for (let x = 0; x <= width; x += gridCellPx) {
      gridGroup
        .append("line")
        .attr("x1", x)
        .attr("y1", 0)
        .attr("x2", x)
        .attr("y2", height)
        .attr("stroke", "#e5e7eb")
        .attr("stroke-width", 1);
    }
    // Add a dashed vertical grid line at the max x position to close the grid
    gridGroup
      .append("line")
      .attr("x1", width)
      .attr("y1", 0)
      .attr("x2", width)
      .attr("y2", height)
      .attr("stroke", "#e5e7eb")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4,4");

    // Add guide lines
    const guideLine = g
      .append("g")
      .attr("class", "guide-lines")
      .style("display", "none");

    // Start date guide line
    guideLine
      .append("line")
      .attr("class", "guide-line vertical start")
      .attr("y1", -TOPIC_CONFIG.margin.top)
      .attr("y2", height + TOPIC_CONFIG.margin.bottom + 1000)
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2);

    // End date guide line (for date ranges)
    guideLine
      .append("line")
      .attr("class", "guide-line vertical end")
      .attr("y1", -TOPIC_CONFIG.margin.top)
      .attr("y2", height + TOPIC_CONFIG.margin.bottom + 1000)
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2)
      .style("display", "none");

    // Start date label
    guideLine
      .append("text")
      .attr("class", "guide-label start")
      .attr("y", -TOPIC_CONFIG.margin.top + 12)
      .attr("fill", "#3b82f6")
      .attr("font-size", "12px")
      .attr("font-weight", "500")
      .attr("text-anchor", "end")
      .style("display", "none");

    // End date label
    guideLine
      .append("text")
      .attr("class", "guide-label end")
      .attr("y", -TOPIC_CONFIG.margin.top + 12)
      .attr("fill", "#3b82f6")
      .attr("font-size", "12px")
      .attr("font-weight", "500")
      .attr("text-anchor", "start")
      .style("display", "none");

    // Add y-axis
    g.append("g")
      .attr("class", "y-axis")
      .call(yAxis)
      .style("font-size", `${TOPIC_CONFIG.axis.fontSize}px`)
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").remove())
      .call((g) =>
        g
          .selectAll(".tick text")
          .style("font-weight", "500")
          .style("text-anchor", "end")
          .attr("dy", "0.32em")
      );

    // Add y-axis label
    svg
      .append("text")
      .attr("class", "y-axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -containerHeight / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("fill", "#64748b")
      .style("font-size", "12px")
      .style("font-weight", "500")
      .text(
        useSemanticAxis
          ? "Semantic Similarity (-1 to 1)"
          : "Topics (rank by Semantic Similarity)"
      );

    // Add topic lines (only for categorical axis)
    if (!useSemanticAxis) {
      topTopics.forEach((topic) => {
        const bandScale = yScale as d3.ScaleBand<string>;
        if (!bandScale(topic)) return;
        const y = bandScale(topic)! + bandScale.bandwidth() / 2;

        g.append("line")
          .attr("class", `topic-line-${topic.replace(/\s+/g, "-")}`)
          .attr("x1", 0)
          .attr("y1", y)
          .attr("x2", width)
          .attr("y2", y)
          .attr("stroke", TOPIC_CONFIG.track.color)
          .attr("stroke-width", TOPIC_CONFIG.track.strokeWidth)
          .attr("opacity", TOPIC_CONFIG.track.opacity);
      });
    }

    // Group overlapping points
    const groupedPoints = groupOverlappingPoints(
      dataPoints,
      xScale,
      yScale,
      viewMode,
      useSemanticAxis
    );

    // Node interaction handlers (defined after scales are available)
    const handleNodeInteraction = {
      // Mouse enter handler - adds hover visual effects + changes selected event state
      mouseOver(this: any, event: MouseEvent, d: any) {
        const isParent = d3.select(this).classed("parent-point");
        const node = d3.select(this);

        // Stop event propagation to prevent bubbling
        event.stopPropagation();

        // Apply hover visual effects
        const hoverRadius = TOPIC_CONFIG.point.radius * 1.2; // Slightly larger on hover
        let currentWidth = parseFloat(node.attr("width") || "0");
        let currentHeight = parseFloat(node.attr("height") || "0");
        let newWidth = currentWidth;
        let newHeight = hoverRadius * 2;

        if (isParent) {
          // For parent nodes, check if it has date range bounds
          const hasDateRangeBounds = node.attr("data-has-real-time") === "true";

          if (hasDateRangeBounds && d.points?.length === 1) {
            // Single parent with date range - only scale the caps
            const isDateRange = Array.isArray(d.points[0].realTime);
            if (isDateRange) {
              // For date ranges, preserve the time span and only increase caps
              const [startDate, endDate] = d.points[0].realTime;
              const startX = xScale(startDate);
              const endX = xScale(endDate);
              const timeSpanWidth = endX - startX;
              newWidth = timeSpanWidth + hoverRadius * 2;
            } else {
              // Single point parent
              newWidth = hoverRadius * 2;
            }
          } else {
            // Multi-point parent or single point without date range
            // Check if this is a grouped node with date range bounds
            if (d.minX !== undefined && d.maxX !== undefined) {
              // Grouped node with date range - preserve the span like time visualization
              const timeSpanWidth = d.maxX - d.minX;
              newWidth = timeSpanWidth + hoverRadius * 2;
            } else {
              // Regular grouped node without date range bounds
              newWidth = hoverRadius * 2;
            }
          }
        } else {
          // For child nodes
          const isDateRange = node.attr("data-has-real-time") === "true";
          if (isDateRange) {
            // Preserve time span for child date ranges
            const startX =
              parseFloat(node.attr("x") || "0") + TOPIC_CONFIG.point.radius;
            const currentSpanWidth =
              currentWidth - TOPIC_CONFIG.point.radius * 2;
            newWidth = currentSpanWidth + hoverRadius * 2;
          } else {
            // Single point child
            newWidth = hoverRadius * 2;
          }
        }

        // Calculate new position to maintain center alignment
        const originalX = parseFloat(node.attr("x") || "0");
        const originalY = parseFloat(node.attr("y") || "0");
        const originalCenterX = originalX + currentWidth / 2;
        const originalCenterY = originalY + currentHeight / 2;
        const newX = originalCenterX - newWidth / 2;
        const newY = originalCenterY - newHeight / 2;

        // Raise parent group to bring all related nodes to front
        if (isParent) {
          // For parent nodes, raise the entire group
          const parentKey = node.attr("data-group-key");
          if (parentKey) {
            d3.select(`#${getParentNodeId(parentKey)}`).raise();
          }
        } else {
          // For child nodes, raise the parent group
          const parentKey = node.attr("data-parent-key");
          if (parentKey) {
            d3.select(`#${getParentNodeId(parentKey)}`).raise();
          }
        }

        // Apply hover effects
        node
          .transition()
          .duration(150)
          .attr("width", newWidth)
          .attr("height", newHeight)
          .attr("x", newX)
          .attr("y", newY)
          .attr("rx", hoverRadius)
          .attr("ry", hoverRadius);

        // Event interaction (tooltip functionality removed)
        const eventData = isParent ? d.points?.[0]?.event || d.event : d.event;

        // Handle state change for selection/expansion
        let targetEventIndex: number | null = null;

        if (!isParent && d?.event?.index !== undefined) {
          // Child node - select its event
          targetEventIndex = d.event.index;
        }
        // Note: Parent node hover no longer sets selection to first child
        // Note: Single-child groups are handled as child nodes only (no parent)

        // Only update if different from current selection
        if (targetEventIndex !== null && targetEventIndex !== focusedEventId) {
          setfocusedEventId(targetEventIndex);
        }
      },

      // Mouse leave handler - restores original size + clears selected event state
      mouseOut(this: any, event: MouseEvent, d: any) {
        const isParent = d3.select(this).classed("parent-point");
        const node = d3.select(this);

        // Stop event propagation to prevent bubbling
        event.stopPropagation();

        // Don't restore size for expanded parent nodes - they should stay expanded
        if (isParent && d.isExpanded) {
          return;
        }

        // Calculate original dimensions
        let originalWidth: number;
        let originalHeight = TOPIC_CONFIG.point.radius * 2;
        const originalRadius = TOPIC_CONFIG.point.radius;

        if (isParent) {
          // For parent nodes, check if it has date range bounds
          const hasDateRangeBounds = node.attr("data-has-real-time") === "true";

          if (hasDateRangeBounds && d.points?.length === 1) {
            // Single parent with date range
            const isDateRange = Array.isArray(d.points[0].realTime);
            if (isDateRange) {
              // For date ranges, calculate original span width
              const [startDate, endDate] = d.points[0].realTime;
              const startX = xScale(startDate);
              const endX = xScale(endDate);
              const timeSpanWidth = endX - startX;
              originalWidth = Math.max(
                timeSpanWidth + originalRadius * 2,
                originalRadius * 2
              );
            } else {
              // Single point parent
              originalWidth = originalRadius * 2;
            }
          } else {
            // Multi-point parent or single point without date range
            // Check if this is a grouped node with date range bounds
            if (d.minX !== undefined && d.maxX !== undefined) {
              // Grouped node with date range - calculate original span width
              const timeSpanWidth = d.maxX - d.minX;
              originalWidth = Math.max(
                timeSpanWidth + originalRadius * 2,
                originalRadius * 2
              );
            } else {
              // Regular grouped node without date range bounds
              originalWidth = originalRadius * 2;
            }
          }
        } else {
          // For child nodes, get original width from data or calculate
          const isDateRange = node.attr("data-has-real-time") === "true";
          if (isDateRange) {
            // For child date ranges, we need to recalculate based on the stored time data
            if (Array.isArray(d.realTime)) {
              const startX = xScale(d.realTime[0]);
              const endX = xScale(d.realTime[1]);
              const timeSpanWidth = endX - startX;
              originalWidth = Math.max(
                timeSpanWidth + originalRadius * 2,
                originalRadius * 2
              );
            } else {
              originalWidth = originalRadius * 2;
            }
          } else {
            // Single point child
            originalWidth = originalRadius * 2;
          }
        }

        // Calculate position to maintain center alignment
        const currentX = parseFloat(node.attr("x") || "0");
        const currentWidth = parseFloat(node.attr("width") || "0");
        const currentHeight = parseFloat(node.attr("height") || "0");
        const centerX = currentX + currentWidth / 2;
        const centerY = parseFloat(node.attr("y") || "0") + currentHeight / 2;
        const newX = centerX - originalWidth / 2;
        const newY = centerY - originalHeight / 2;

        // Restore original size
        node
          .transition()
          .duration(150)
          .attr("width", originalWidth)
          .attr("height", originalHeight)
          .attr("x", newX)
          .attr("y", newY)
          .attr("rx", originalRadius)
          .attr("ry", originalRadius);

        // Clear selection state
        // setfocusedEventId(null);
      },

      // Click handler - triggers marking for child nodes, expansion for parent nodes
      click(this: any, event: MouseEvent, d: any) {
        event.preventDefault();
        event.stopPropagation();

        const isParent = d3.select(this).classed("parent-point");

        if (isParent && d.points?.length > 1) {
          // Parent node click - expand/collapse the group
          // Toggle expansion state
          d.isExpanded = !d.isExpanded;
          pointStatesRef.current.set(d.key, {
            x: d.x,
            y: d.y,
            isExpanded: d.isExpanded,
          });

          const parentRect = d3.select(this); // 'this' is the parent rectangle
          const parent = d3.select(this.parentElement); // The group container
          const children = parent.selectAll(".child-point");
          const countText = parent.select("text");

          if (d.isExpanded) {
            // Expand the group

            const x =
              parseFloat(parentRect.attr("x") || "0") +
              parseFloat(parentRect.attr("width") || "0") / 2;
            const y =
              parseFloat(parentRect.attr("y") || "0") +
              parseFloat(parentRect.attr("height") || "0") / 2;

            // Raise parent group to front
            parent.raise();

            // Get collapsed dimensions to preserve width
            const collapsedDims = calculateCollapsedDimensions(d);

            // Calculate expanded height
            const radius = TOPIC_CONFIG.point.radius;
            const verticalSpacing = radius * 2.5;
            const childHeight =
              d.points.length > 1 ? (d.points.length - 1) * verticalSpacing : 0;
            const expandedHeight = Math.max(
              radius * 3,
              childHeight + radius * 3
            );
            const expandedWidth = collapsedDims.width + radius * 0.8;

            // Calculate new position for expanded size
            const newRectX = x - expandedWidth / 2;
            const newRectY = y - expandedHeight / 2;

            // Smooth transition for parent rectangle expansion

            parentRect
              .transition()
              .duration(200)
              .attr("width", expandedWidth)
              .attr("height", expandedHeight)
              .attr("x", newRectX)
              .attr("y", newRectY)
              .attr("rx", collapsedDims.rx)
              .attr("ry", collapsedDims.ry)
              .style("opacity", 0.5)
              .style("cursor", "default")
              .style("pointer-events", "none");

            // Update count text position
            if (countText) {
              countText.transition().duration(200).attr("x", x).attr("y", y);
            }

            // Show children
            children
              .transition()
              .duration(200)
              .style("opacity", 1)
              .style("pointer-events", "all");
          } else {
            // Collapse the group
            const collapsedDims = calculateCollapsedDimensions(d);

            // Smooth transition for parent rectangle collapse
            parentRect
              .transition()
              .duration(200)
              .attr("width", collapsedDims.width)
              .attr("height", collapsedDims.height)
              .attr("x", collapsedDims.rectX)
              .attr("y", collapsedDims.rectY)
              .attr("rx", collapsedDims.rx)
              .attr("ry", collapsedDims.ry)
              .style("opacity", 1)
              .style("cursor", "pointer")
              .style("pointer-events", "all");

            // Update count text position
            if (countText) {
              countText
                .transition()
                .duration(200)
                .attr("x", collapsedDims.x)
                .attr("y", collapsedDims.y);
            }

            // Hide children
            children
              .transition()
              .duration(200)
              .style("opacity", 0)
              .style("pointer-events", "none");
          }
        } else {
          // Child node click - toggle marking
          const eventIndex = d.event?.index || d.points?.[0]?.event?.index;
          toggleMarkedEvent(eventIndex);
        }
      },
    };

    // Points group
    const pointsGroup = g.append("g").attr("class", "points");

    // Create parent nodes
    const parentNodes = pointsGroup
      .selectAll(".point-group")
      .data(groupedPoints)
      .enter()
      .append("g")
      .attr("class", "point-group")
      .attr("id", (d) => getParentNodeId(d.key))
      .each(function (d: GroupedPoint) {
        const state = pointStatesRef.current.get(d.key);
        if (state) {
          d.isExpanded = state.isExpanded;
        }
      });

    // Add parent rectangles (only for multi-child groups)
    parentNodes
      .filter((d: GroupedPoint) => d.points.length > 1) // Only show parent for multi-child groups
      .append("rect")
      .attr("class", "parent-point")
      .each(function (d: GroupedPoint) {
        // Check if this group has calculated date range bounds
        const hasDateRangeBounds = d.minX !== undefined && d.maxX !== undefined;
        const firstPoint = d.points[0];
        const isDateRange = Array.isArray(firstPoint.realTime);

        let rectX, rectY, width, height, rx, ry;

        if (hasDateRangeBounds) {
          // Group spans a date range - create capsule spanning the full range
          const spanWidth = Math.max(
            d.maxX! - d.minX! + TOPIC_CONFIG.point.radius * 2,
            TOPIC_CONFIG.point.radius * 2
          );

          rectX = d.minX! - TOPIC_CONFIG.point.radius;
          rectY = d.y - TOPIC_CONFIG.point.radius;
          width = spanWidth;
          height = TOPIC_CONFIG.point.radius * 2;
          rx = TOPIC_CONFIG.point.radius;
          ry = TOPIC_CONFIG.point.radius;
        } else {
          // Multi-point group - use existing logic
          const dimensions = calculateRectDimensions(
            d.points.length,
            TOPIC_CONFIG.point.radius
          );
          const position = calculateRectPosition(
            d.x,
            d.y,
            dimensions.width,
            dimensions.height
          );

          rectX = position.rectX;
          rectY = position.rectY;
          width = dimensions.width;
          height = dimensions.height;
          rx = dimensions.rx;
          ry = dimensions.ry;
        }

        d3.select(this)
          .attr("x", rectX)
          .attr("y", rectY)
          .attr("width", width)
          .attr("height", height)
          .attr("rx", rx)
          .attr("ry", ry)
          .attr("fill", (d: any) => getNodetColor(d))
          .attr("stroke", (d: any) =>
            d.points.some((point: DataPoint) =>
              isEventMarked(point.event.index)
            )
              ? TOPIC_CONFIG.highlight.color
              : "black"
          )
          .attr("stroke-width", (d: any) =>
            d.points.some((point: DataPoint) =>
              isEventMarked(point.event.index)
            )
              ? 3
              : TOPIC_CONFIG.point.strokeWidth
          )
          .attr("stroke-dasharray", "none")
          .style("cursor", "pointer") // Always clickable since only multi-child groups have parents
          .attr("data-group-key", d.key.replace(/[^a-zA-Z0-9-_]/g, "_"))
          .attr("data-event-index", d.points[0].event.index)
          .attr("data-point-count", d.points.length)
          .attr("data-has-real-time", hasDateRangeBounds || isDateRange);

        // Add count text for multi-child groups
        const { centerX, centerY } = calculateCenterPoint(
          rectX,
          rectY,
          width,
          height
        );

        d3.select(this.parentElement)
          .append("text")
          .attr("x", centerX)
          .attr("y", centerY)
          .attr("dy", "0.35em")
          .attr("text-anchor", "middle")
          .style(
            "font-size",
            `${Math.min(10 + (d.points.length - 1) * 0.5, 14)}px`
          )
          .style("fill", "black")
          .style("pointer-events", "none")
          .text(d.points.length);
      });

    // Add child nodes
    const childNodes = parentNodes
      .selectAll(".child-point")
      .data((d: GroupedPoint) =>
        d.points.map((p: DataPoint, i: number) => ({
          ...p,
          parentKey: d.key.replace(/[^a-zA-Z0-9-_]/g, "_"),
          index: i,
          total: d.points.length,
        }))
      )
      .enter()
      .append("g")
      .attr("class", "child-point")
      .style("opacity", (d: ChildPoint) => (d.total === 1 ? 1 : 0)) // Single-child groups always visible
      .style("pointer-events", (d: ChildPoint) =>
        d.total === 1 ? "all" : "none"
      ); // Single-child groups always interactive

    childNodes
      .append("rect")
      .attr("class", "child-point-rect")
      .attr("id", (d: ChildPoint) => getChildNodeId(d.event.index))
      .attr("x", (d: ChildPoint) => {
        const isDateRange = Array.isArray(d.realTime);

        if (isDateRange) {
          // For date range child nodes, position at start date
          const realTimeArray = d.realTime as [Date, Date];
          return xScale(realTimeArray[0]) - TOPIC_CONFIG.point.radius;
        } else {
          // For single date child nodes, align to exact date
          return xScale(d.realTime as Date) - TOPIC_CONFIG.point.radius;
        }
      })
      .attr("y", (d: ChildPoint) => {
        const parent = groupedPoints.find(
          (g) => g.key.replace(/[^a-zA-Z0-9-_]/g, "_") === d.parentKey
        )!;
        const positions = calculateExpandedPositions(
          parent,
          TOPIC_CONFIG.point.radius
        );
        return positions[d.index].y - TOPIC_CONFIG.point.radius;
      })
      .attr("width", (d: ChildPoint) => {
        const isDateRange = Array.isArray(d.realTime);

        if (isDateRange) {
          // For date range child nodes, calculate width spanning the date range
          const realTimeArray = d.realTime as [Date, Date];
          const startX = xScale(realTimeArray[0]);
          const endX = xScale(realTimeArray[1]);
          return Math.max(
            endX - startX + TOPIC_CONFIG.point.radius * 2,
            TOPIC_CONFIG.point.radius * 2
          );
        } else {
          // For single date child nodes, use standard width
          return TOPIC_CONFIG.point.radius * 2;
        }
      })
      .attr("height", TOPIC_CONFIG.point.radius * 2)
      .attr("rx", TOPIC_CONFIG.point.radius)
      .attr("ry", TOPIC_CONFIG.point.radius)
      .attr("fill", (d: ChildPoint) => getNodetColor(d))
      .attr("stroke", (d: ChildPoint) =>
        isEventMarked(d.event.index) ? TOPIC_CONFIG.highlight.color : "black"
      )
      .attr("stroke-width", (d: ChildPoint) =>
        isEventMarked(d.event.index) ? 3 : TOPIC_CONFIG.point.strokeWidth
      )
      .attr("stroke-dasharray", (d: ChildPoint) =>
        Array.isArray(d.realTime) ? "none" : "none"
      )
      .style("cursor", "pointer")
      .attr("data-parent-key", (d: ChildPoint) => d.parentKey)
      .attr("data-event-index", (d: ChildPoint) => d.event.index)
      .attr("data-has-real-time", (d: ChildPoint) => Array.isArray(d.realTime));

    // Handle hover events for parent nodes
    parentNodes
      .on("mouseover", function (event: MouseEvent, d: GroupedPoint) {
        handleNodeInteraction.mouseOver.call(this, event, d);
      })
      .on("mouseout", function (event: MouseEvent, d: GroupedPoint) {
        handleNodeInteraction.mouseOut.call(this, event, d);
      });

    // Add event listeners
    parentNodes
      .selectAll("rect.parent-point")
      .on("mouseover", handleNodeInteraction.mouseOver)
      .on("mouseout", handleNodeInteraction.mouseOut)
      .on("click", handleNodeInteraction.click);

    childNodes
      .selectAll("rect.child-point-rect")
      .on("mouseover", handleNodeInteraction.mouseOver)
      .on("mouseout", handleNodeInteraction.mouseOut)
      .on("click", handleNodeInteraction.click);

    // Restore expanded states (only for multi-child groups)
    currentExpandedStates.forEach((state, key) => {
      if (state.isExpanded) {
        const parentNode = d3.select(`#${getParentNodeId(key)}`);
        if (!parentNode.empty()) {
          const parent = parentNode.datum() as GroupedPoint;

          // Only restore expanded state for multi-child groups
          if (parent.points.length > 1) {
            parent.isExpanded = true;
            pointStatesRef.current.set(key, state);

            // Restore expanded state visually
            const parentRect = parentNode.select("rect");
            const countText = parentNode.select("text");
            const children = parentNode.selectAll(".child-point");

            const x =
              parseFloat(parentRect.attr("x") || "0") +
              parseFloat(parentRect.attr("width") || "0") / 2;
            const y =
              parseFloat(parentRect.attr("y") || "0") +
              parseFloat(parentRect.attr("height") || "0") / 2;

            // Get collapsed dimensions to preserve width
            const collapsedDims = calculateCollapsedDimensions(parent);

            // Calculate expanded height based on child count
            const radius = TOPIC_CONFIG.point.radius;
            const verticalSpacing = radius * 2.5; // Same as in calculateExpandedPositions
            const childHeight =
              parent.points.length > 1
                ? (parent.points.length - 1) * verticalSpacing
                : 0;
            const expandedHeight = Math.max(
              radius * 3,
              childHeight + radius * 3
            );

            // Make width slightly wider when expanded to properly wrap child nodes
            const expandedWidth = collapsedDims.width + radius * 0.8; // Add padding

            // Raise expanded group to ensure it's above other groups
            parentNode.raise();

            // Calculate new position for expanded size
            const newRectX = x - expandedWidth / 2;
            const newRectY = y - expandedHeight / 2;

            // Set expanded state immediately (no animation for restoration)
            parentRect
              .attr("width", expandedWidth)
              .attr("height", expandedHeight)
              .attr("x", newRectX)
              .attr("y", newRectY)
              .attr("rx", collapsedDims.rx)
              .attr("ry", collapsedDims.ry)
              .style("opacity", 0.5)
              .style("cursor", "default")
              .style("pointer-events", "none");

            // Update count text position
            if (countText) {
              countText.attr("x", x).attr("y", y);
            }

            children
              .style("opacity", (d: any) => (d.total === 1 ? 1 : 1)) // All children visible when expanded
              .style("pointer-events", "all");
          }
        }
      }
    });

    // Reapply selection if exists
    if (currentSelection !== null && currentSelection !== undefined) {
      updateSelectedEventStyles(currentSelection, xScale);
    }
  }, [
    events,
    viewMode,
    focusedEventId,
    markedEventIds,
    isEventMarked,
    toggleMarkedEvent,
    getParentNodeId,
    getChildNodeId,
    handleBackgroundClick,
    calculateCollapsedDimensions,
  ]);

  // Setup resize observer
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        window.requestAnimationFrame(updateVisualization);
      }
    });

    resizeObserver.observe(containerRef.current);
    resizeObserverRef.current = resizeObserver;
    updateVisualization();

    return () => {
      resizeObserverRef.current?.disconnect();
    };
  }, [updateVisualization]);

  // Add effect to update visualization when marked events change
  useEffect(() => {
    if (svgRef.current) {
      updateVisualization();
    }
  }, [markedEventIds, updateVisualization]);

  // Handle visual effects when selected event changes
  useEffect(() => {
    if (!svgRef.current) return;

    // Update guide lines
    updateSelectedEventStyles(focusedEventId, undefined);

    if (focusedEventId !== null) {
      // Find the node for this event
      const allNodes = d3
        .select(svgRef.current)
        .selectAll(".parent-point, .child-point-rect");
      let targetNode: d3.Selection<any, any, any, any> | null = null;
      let targetData: any = null;
      let isParentNode = false;

      allNodes.each(function (d: any) {
        const eventIndex = d.event?.index || d.points?.[0]?.event?.index;
        if (eventIndex === focusedEventId) {
          targetNode = d3.select(this as any);
          targetData = d;
          isParentNode = (targetNode as any).classed("parent-point");
        }
      });

      if (targetNode && targetData) {
        // If it's a child node, we need to expand its parent (if it exists and has multiple children)
        if (!isParentNode && targetNode) {
          const parentKey = (targetNode as any).attr("data-parent-key");
          if (parentKey) {
            const parentGroup = d3.select(`#${getParentNodeId(parentKey)}`);
            if (!parentGroup.empty()) {
              const parentData = parentGroup.datum() as GroupedPoint;

              // Only expand if this is a multi-child group (single-child groups don't have visible parents)
              if (parentData.points.length > 1 && !parentData.isExpanded) {
                parentData.isExpanded = true;
                pointStatesRef.current.set(parentData.key, {
                  x: parentData.x,
                  y: parentData.y,
                  isExpanded: true,
                });

                const parent = parentGroup;
                const children = parent.selectAll(".child-point");
                const parentRect = parent.select("rect");
                const countText = parent.select("text");

                const x =
                  parseFloat(parentRect.attr("x") || "0") +
                  parseFloat(parentRect.attr("width") || "0") / 2;
                const y =
                  parseFloat(parentRect.attr("y") || "0") +
                  parseFloat(parentRect.attr("height") || "0") / 2;

                // Raise parent group to ensure it's above other groups
                parent.raise();

                // Get collapsed dimensions to preserve width
                const collapsedDims = calculateCollapsedDimensions(parentData);

                // Calculate expanded height based on child count
                const radius = TOPIC_CONFIG.point.radius;
                const verticalSpacing = radius * 2.5;
                const childHeight =
                  parentData.points.length > 1
                    ? (parentData.points.length - 1) * verticalSpacing
                    : 0;
                const expandedHeight = Math.max(
                  radius * 3,
                  childHeight + radius * 3
                );

                // Make width slightly wider when expanded
                const expandedWidth = collapsedDims.width + radius * 0.8;

                // Calculate new position for expanded size
                const newRectX = x - expandedWidth / 2;
                const newRectY = y - expandedHeight / 2;

                // Smooth transition for parent rectangle expansion
                parentRect
                  .transition()
                  .duration(200)
                  .attr("width", expandedWidth)
                  .attr("height", expandedHeight)
                  .attr("x", newRectX)
                  .attr("y", newRectY)
                  .attr("rx", collapsedDims.rx)
                  .attr("ry", collapsedDims.ry)
                  .style("opacity", 0.5)
                  .style("cursor", "default")
                  .style("pointer-events", "none");

                // Update count text position
                if (countText) {
                  countText
                    .transition()
                    .duration(200)
                    .attr("x", x)
                    .attr("y", y);
                }

                children
                  .transition()
                  .duration(200)
                  .style("opacity", 1)
                  .style("pointer-events", "all");
              }
            }
          }
        }

        // Raise the target node to front
        if (!isParentNode && targetNode) {
          const parentKey = (targetNode as any).attr("data-parent-key");
          if (parentKey) {
            // Raise the entire parent group to bring all children to front
            d3.select(`#${getParentNodeId(parentKey)}`).raise();
          }
        } else if (isParentNode && targetNode) {
          // For parent nodes, also raise to front
          const parentKey = (targetNode as any).attr("data-group-key");
          if (parentKey) {
            d3.select(`#${getParentNodeId(parentKey)}`).raise();
          }
        }
      }
    } else {
      // No event selected - collapse all expanded groups

      d3.select(svgRef.current)
        .selectAll(".point-group")
        .each(function (d: any) {
          // Only collapse multi-child groups (single-child groups don't have collapsible parents)
          if (d.isExpanded && d.points.length > 1) {
            d.isExpanded = false;
            pointStatesRef.current.set(d.key, {
              x: d.x,
              y: d.y,
              isExpanded: false,
            });

            const parent = d3.select(this);
            const children = parent.selectAll(".child-point");
            const parentRect = parent.select("rect");
            const countText = parent.select("text");

            // Use collapsed dimensions
            const collapsedDims = calculateCollapsedDimensions(d);

            // Smooth transition for parent rectangle collapse
            parentRect
              .transition()
              .duration(200)
              .attr("width", collapsedDims.width)
              .attr("height", collapsedDims.height)
              .attr("x", collapsedDims.rectX)
              .attr("y", collapsedDims.rectY)
              .attr("rx", collapsedDims.rx)
              .attr("ry", collapsedDims.ry)
              .style("opacity", 1)
              .style("cursor", "pointer")
              .style("pointer-events", "all");

            // Update count text position
            if (countText) {
              countText
                .transition()
                .duration(200)
                .attr("x", collapsedDims.x)
                .attr("y", collapsedDims.y);
            }

            children
              .transition()
              .duration(200)
              .style("opacity", (d: any) => (d.total === 1 ? 1 : 0)) // Keep single-child nodes visible
              .style("pointer-events", (d: any) =>
                d.total === 1 ? "all" : "none"
              ); // Keep single-child nodes interactive
          }
        });
    }
  }, [
    focusedEventId,
    updateSelectedEventStyles,
    getParentNodeId,
    calculateCollapsedDimensions,
  ]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-none bg-white sticky top-0 z-10 shadow-sm">
        <div
          ref={headerRef}
          style={{ height: `${TOPIC_CONFIG.header.height}px` }}
        />
      </div>
      <div
        ref={containerRef}
        className="flex-1 relative overflow-x-hidden"
        style={{
          scrollbarWidth: "thin", // For Firefox
          scrollbarGutter: "stable",
        }}
        onClick={(e) => {
          // Only trigger if clicking directly on the container or a direct child that's not the SVG
          const target = e.target as HTMLElement;
          if (
            target === containerRef.current ||
            (target.parentElement === containerRef.current &&
              target.tagName !== "svg")
          ) {
            handleBackgroundClick();
          }
        }}
      >
        <div className="absolute inset-0 z-0" />
        <svg ref={svgRef} className="w-full h-full relative z-10" />
      </div>
    </div>
  );
}
