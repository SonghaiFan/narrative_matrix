"use client";

import { NarrativeEvent } from "@/types/narrative/lite";
import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import { TOPIC_CONFIG } from "./topic-config";
import { useTooltip } from "@/contexts/tooltip-context";
import { useCenterControl } from "@/contexts/center-control-context";
import {
  getSentimentColor,
  getHighlightColor,
} from "@/components/features/narrative/shared/color-utils";
import {
  processEvents,
  getTopicCounts,
  getTopTopics,
  getScales,
  createAxes,
  groupOverlappingPoints,
  calculateExpandedPositions,
  type DataPoint,
  type GroupedPoint,
} from "./topic-visual.utils";

interface TopicVisualProps {
  events: NarrativeEvent[];
  viewMode: "main" | "sub";
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
  metadata,
}: TopicVisualProps) {
  const { selectedEventId, setSelectedEventId } = useCenterControl();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const pointStatesRef = useRef<Map<string, PointState>>(new Map());
  const { showTooltip, hideTooltip, updatePosition } = useTooltip();

  // Function to generate unique IDs for nodes
  const getParentNodeId = useCallback((groupKey: string) => {
    // Create a safe ID by replacing invalid characters with underscores
    const safeKey = groupKey.replace(/[^a-zA-Z0-9-_]/g, "_");
    return `parent-node-${safeKey}`;
  }, []);

  const getChildNodeId = useCallback((eventIndex: number) => {
    return `child-node-${eventIndex}`;
  }, []);

  // Function to update node styles based on selectedEventId
  const updateSelectedEventStyles = useCallback(
    (newSelectedId: number | null) => {
      if (!svgRef.current) return;

      // Reset all nodes to default stroke style
      d3.select(svgRef.current)
        .selectAll(".parent-point, .child-point-circle")
        .attr("stroke", "black")
        .attr("stroke-width", TOPIC_CONFIG.point.strokeWidth);

      // Get guide line group
      const guideLine = d3.select(svgRef.current).select(".guide-lines");

      // If we have a selected event, highlight it
      if (newSelectedId !== null) {
        // Try to find and highlight the parent node first
        const parentNode = d3
          .select(svgRef.current)
          .selectAll(".parent-point")
          .filter(function () {
            return (
              d3.select(this).attr("data-event-index") === String(newSelectedId)
            );
          });

        if (!parentNode.empty()) {
          // Update node style
          parentNode.attr("stroke", getHighlightColor());

          // Get the parent node's position
          const cx = parseFloat(parentNode.attr("cx") || "0");

          // Update guide line position and show it
          guideLine
            .style("display", "block")
            .select(".vertical")
            .attr("x1", cx)
            .attr("x2", cx);
        }

        // Try to find and highlight the child node
        const childNode = d3
          .select(svgRef.current)
          .selectAll(".child-point-circle")
          .filter(function () {
            return (
              d3.select(this).attr("data-event-index") === String(newSelectedId)
            );
          });

        if (!childNode.empty()) {
          // Highlight the child node
          childNode
            .attr("stroke", getHighlightColor())
            .attr("stroke-width", TOPIC_CONFIG.point.strokeWidth * 1.5);

          // Also highlight its parent node
          const parentKey = childNode.attr("data-parent-key");
          if (parentKey) {
            const parentNodeId = getParentNodeId(parentKey);
            const parentCircle = d3.select(`#${parentNodeId}`).select("circle");
            parentCircle.attr("stroke", getHighlightColor());

            // Get the parent node's position
            const cx = parseFloat(parentCircle.attr("cx") || "0");

            // Update guide line position and show it
            guideLine
              .style("display", "block")
              .select(".vertical")
              .attr("x1", cx)
              .attr("x2", cx);
          }
        }
      } else {
        // Hide guide line when no node is selected
        guideLine.style("display", "none");
      }
    },
    [getParentNodeId]
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

    // Store current expanded states before clearing
    const currentExpandedStates = new Map(pointStatesRef.current);

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();
    d3.select(headerRef.current).selectAll("*").remove();

    // Process data points
    const dataPoints = processEvents(events, viewMode);
    const topicCounts = getTopicCounts(dataPoints, viewMode);
    const topTopics = getTopTopics(topicCounts, viewMode);

    // Get the current container dimensions
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    // Calculate the usable width and height accounting for margins
    const width = Math.max(
      0,
      containerWidth - TOPIC_CONFIG.margin.left - TOPIC_CONFIG.margin.right
    );
    const height = Math.max(
      0,
      containerHeight - TOPIC_CONFIG.margin.top - TOPIC_CONFIG.margin.bottom
    );

    // Create scales with the actual available height
    const publishDate = new Date(metadata.publishDate);
    const { xScale, yScale } = getScales(
      dataPoints,
      topTopics,
      width,
      height,
      viewMode,
      publishDate
    );

    // Create axes
    const { xAxis, yAxis } = createAxes(xScale, yScale);

    // Create fixed header for x-axis
    const headerContainer = d3
      .select(headerRef.current)
      .style("width", `${containerWidth}px`)
      .style("margin-left", "0")
      .style("background-color", "white");

    // Create header content container
    const headerContent = headerContainer
      .append("div")
      .style("margin-left", `${TOPIC_CONFIG.margin.left}px`)
      .style("width", `${width}px`);

    // Add x-axis to header
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

    // Create SVG with responsive dimensions
    const svg = d3
      .select(svgRef.current)
      .attr("width", containerWidth)
      .attr("height", containerHeight)
      .style("display", "block")
      .style("overflow", "visible");

    // Create main group with proper margins
    const g = svg
      .append("g")
      .attr(
        "transform",
        `translate(${TOPIC_CONFIG.margin.left},${TOPIC_CONFIG.margin.top})`
      );

    // Add guide line group first (so it's underneath everything)
    const guideLine = g
      .append("g")
      .attr("class", "guide-lines")
      .style("display", "none");

    // Add vertical guide line
    guideLine
      .append("line")
      .attr("class", "guide-line vertical")
      .attr("y1", -TOPIC_CONFIG.margin.top)
      .attr("y2", height + TOPIC_CONFIG.margin.bottom + 1000)
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2);

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

    // Add horizontal lines for each topic (similar to entity-visual)
    // Only draw lines for topics that have nodes
    topTopics.forEach((topic) => {
      // Skip if topic is not in the yScale domain (could happen if we filtered out some topics)
      if (!yScale(topic)) return;

      const y = yScale(topic)! + yScale.bandwidth() / 2;

      g.append("line")
        .attr("class", `topic-line-${topic.replace(/\s+/g, "-")}`)
        .attr("x1", 0)
        .attr("y1", y)
        .attr("x2", width)
        .attr("y2", y)
        .attr("stroke", TOPIC_CONFIG.topic.lineColor)
        .attr("stroke-width", TOPIC_CONFIG.topic.lineStrokeWidth)
        .attr("opacity", TOPIC_CONFIG.topic.lineOpacity);
    });

    // Group overlapping points
    const groupedPoints = groupOverlappingPoints(
      dataPoints,
      xScale,
      yScale,
      viewMode
    );

    // Add points group
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

    // Add parent circles
    parentNodes
      .append("circle")
      .attr("class", "parent-point")
      .attr("cx", (d: GroupedPoint) => d.x)
      .attr("cy", (d: GroupedPoint) => d.y)
      .attr("r", (d: GroupedPoint) =>
        d.points.length > 1
          ? TOPIC_CONFIG.point.radius * 1.2
          : TOPIC_CONFIG.point.radius
      )
      .attr("fill", (d: GroupedPoint) => {
        // For parent nodes with multiple points, use the average sentiment
        if (d.points.length > 1) {
          // Calculate average sentiment intensity
          const avgIntensity =
            d.points.reduce((sum, p) => sum + p.sentiment, 0) / d.points.length;

          // Determine dominant polarity
          const polarityCounts = {
            positive: 0,
            negative: 0,
            neutral: 0,
          };

          d.points.forEach((p) => {
            polarityCounts[p.sentimentPolarity]++;
          });

          let dominantPolarity: "positive" | "negative" | "neutral" = "neutral";
          if (
            polarityCounts.positive > polarityCounts.negative &&
            polarityCounts.positive > polarityCounts.neutral
          ) {
            dominantPolarity = "positive";
          } else if (
            polarityCounts.negative > polarityCounts.positive &&
            polarityCounts.negative > polarityCounts.neutral
          ) {
            dominantPolarity = "negative";
          }

          return getSentimentColor(dominantPolarity);
        } else {
          // For single points, use the point's sentiment
          return getSentimentColor(d.points[0].sentimentPolarity);
        }
      })
      .attr("stroke", "black")
      .attr("stroke-width", TOPIC_CONFIG.point.strokeWidth)
      .style("cursor", (d: GroupedPoint) =>
        d.points.length > 1 ? "pointer" : "default"
      )
      // Add data attributes for easy selection later
      .attr("data-group-key", (d: GroupedPoint) => {
        // Create a safe data attribute value
        return d.key.replace(/[^a-zA-Z0-9-_]/g, "_");
      })
      .attr("data-event-index", (d: GroupedPoint) => d.points[0].event.index)
      .attr("data-point-count", (d: GroupedPoint) => d.points.length)
      .each(function (d: GroupedPoint) {
        if (d.points.length > 1) {
          const parentNode = d3.select(this.parentElement);
          if (parentNode) {
            parentNode
              .append("text")
              .attr("x", d.x)
              .attr("y", d.y)
              .attr("dy", "0.35em")
              .attr("text-anchor", "middle")
              .style("font-size", "10px")
              .style("fill", "black")
              .style("pointer-events", "none")
              .text(d.points.length);
          }
        }
      });

    // Add child nodes (initially hidden)
    const childNodes = parentNodes
      .selectAll(".child-point")
      .data((d: GroupedPoint) =>
        d.points.map((p: DataPoint, i: number) => ({
          ...p,
          parentKey: d.key.replace(/[^a-zA-Z0-9-_]/g, "_"), // Use safe key
          index: i,
          total: d.points.length,
        }))
      )
      .enter()
      .append("g")
      .attr("class", "child-point")
      .style("opacity", 0)
      .style("pointer-events", "none");

    childNodes
      .append("circle")
      .attr("class", "child-point-circle")
      .attr("id", (d: ChildPoint) => getChildNodeId(d.event.index))
      .attr("cx", (d: ChildPoint) => {
        const parent = groupedPoints.find(
          (g) => g.key.replace(/[^a-zA-Z0-9-_]/g, "_") === d.parentKey
        )!;
        const positions = calculateExpandedPositions(
          parent,
          TOPIC_CONFIG.point.radius
        );
        return positions[d.index].x;
      })
      .attr("cy", (d: ChildPoint) => {
        const parent = groupedPoints.find(
          (g) => g.key.replace(/[^a-zA-Z0-9-_]/g, "_") === d.parentKey
        )!;
        const positions = calculateExpandedPositions(
          parent,
          TOPIC_CONFIG.point.radius
        );
        return positions[d.index].y;
      })
      .attr("r", TOPIC_CONFIG.point.radius)
      .attr("fill", (d: ChildPoint) => getSentimentColor(d.sentimentPolarity))
      .attr("stroke", "black")
      .attr("stroke-width", TOPIC_CONFIG.point.strokeWidth)
      .style("cursor", "pointer")
      // Add data attributes for easy selection later
      .attr("data-parent-key", (d: ChildPoint) => d.parentKey)
      .attr("data-event-index", (d: ChildPoint) => d.event.index);

    // Handle click events for parent nodes
    parentNodes.on("click", function (event: MouseEvent, d: GroupedPoint) {
      // If it's a group with multiple points, prioritize expand/collapse
      if (d.points.length > 1) {
        const isExpanded = !d.isExpanded;
        d.isExpanded = isExpanded;
        pointStatesRef.current.set(d.key, { x: d.x, y: d.y, isExpanded });

        const parent = d3.select(this);
        const children = parent.selectAll(".child-point");
        const parentCircle = parent.select("circle");
        const countText = parent.select("text");

        // Raise this group to the front when expanded
        if (isExpanded) {
          // Raise the parent group to the front
          parent.raise();

          // Expand animation
          parentCircle
            .transition()
            .duration(200)
            .attr("r", TOPIC_CONFIG.point.radius * 0.8)
            .style("opacity", 0.5)
            .style("cursor", "pointer");
          // Note: We don't change the fill color, preserving the sentiment color

          if (countText.node()) {
            countText.style("opacity", 0);
          }

          children
            .transition()
            .duration(200)
            .style("opacity", 1)
            .style("pointer-events", "all");
        } else {
          // Collapse animation
          parentCircle
            .transition()
            .duration(200)
            .attr(
              "r",
              d.points.length > 1
                ? TOPIC_CONFIG.point.radius * 1.2
                : TOPIC_CONFIG.point.radius
            )
            .style("opacity", 1)
            .style("cursor", "pointer");
          // Note: We don't change the fill color, preserving the sentiment color

          if (countText.node()) {
            countText.style("opacity", 1);
          }

          children
            .transition()
            .duration(200)
            .style("opacity", 0)
            .style("pointer-events", "none");
        }
      } else {
        // If it's a single point (not a group), handle selection
        const eventData = d.points[0].event;
        setSelectedEventId(
          eventData.index === selectedEventId ? null : eventData.index
        );
      }
    });

    // Define event handlers
    const handleNodeInteraction = {
      // Common highlight function for hover
      highlight(node: d3.Selection<any, any, any, any>, isParent: boolean) {
        // Only change size on hover, not color
        node
          .transition()
          .duration(150)
          .attr("r", TOPIC_CONFIG.point.hoverRadius);

        // If this is a child node, also highlight its parent
        if (!isParent) {
          const parentKey = node.attr("data-parent-key");
          if (parentKey) {
            const parentNodeId = getParentNodeId(parentKey);
            // Only change size on hover, not color
            d3.select(`#${parentNodeId}`)
              .select("circle")
              .transition()
              .duration(150)
              .attr("r", TOPIC_CONFIG.point.hoverRadius);
          }
        }
      },

      // Common reset function
      reset(node: d3.Selection<any, any, any, any>, d: any, isParent: boolean) {
        const pointCount = isParent && d.points ? d.points.length : 1;

        // Only reset size, not color
        node
          .transition()
          .duration(150)
          .attr(
            "r",
            isParent && pointCount > 1
              ? TOPIC_CONFIG.point.radius * 1.2
              : TOPIC_CONFIG.point.radius
          );

        // Reset parent for child nodes
        if (!isParent) {
          const parentKey = node.attr("data-parent-key");
          if (parentKey) {
            const parentNodeId = getParentNodeId(parentKey);
            const parentGroup = d3.select(`#${parentNodeId}`);

            if (!parentGroup.empty()) {
              // Only reset size, not color
              parentGroup
                .select("circle")
                .transition()
                .duration(150)
                .attr(
                  "r",
                  d.points && d.points.length > 1
                    ? TOPIC_CONFIG.point.radius * 1.2
                    : TOPIC_CONFIG.point.radius
                );
            }
          }
        }
      },

      // Mouse over handler
      mouseOver(this: any, event: MouseEvent, d: any) {
        const node = d3.select(this);
        const isParent = node.classed("parent-point");

        // Raise the node group to the front
        if (isParent) {
          // If it's a parent node, raise its parent group
          d3.select(this.parentNode).raise();
        } else {
          // If it's a child node, raise its parent group
          const parentKey = node.attr("data-parent-key");
          if (parentKey) {
            const parentNodeId = getParentNodeId(parentKey);
            d3.select(`#${parentNodeId}`).raise();
          }
        }

        handleNodeInteraction.highlight(node, isParent);

        // Show tooltip
        const eventData = d.event || d.points[0].event;
        showTooltip(eventData, event.pageX, event.pageY, "topic");

        // Highlight the topic line
        const topic = d.mainTopic || d.points[0].mainTopic;
        g.select(`.topic-line-${topic.replace(/\s+/g, "-")}`).attr(
          "opacity",
          TOPIC_CONFIG.topic.lineHighlightOpacity
        );
      },

      // Mouse out handler
      mouseOut(this: any, event: MouseEvent, d: any) {
        const node = d3.select(this);
        const isParent = node.classed("parent-point");

        // Always reset size on mouseout, regardless of selection state
        const pointCount = isParent && d.points ? d.points.length : 1;

        // Only reset the size, not the color
        node
          .transition()
          .duration(150)
          .attr(
            "r",
            isParent && pointCount > 1
              ? TOPIC_CONFIG.point.radius * 1.2
              : TOPIC_CONFIG.point.radius
          );

        // If this is a child node, also reset its parent size
        if (!isParent) {
          const parentKey = node.attr("data-parent-key");
          if (parentKey) {
            const parentNodeId = getParentNodeId(parentKey);
            const parentGroup = d3.select(`#${parentNodeId}`);

            if (!parentGroup.empty()) {
              // Only reset size, not color
              parentGroup
                .select("circle")
                .transition()
                .duration(150)
                .attr(
                  "r",
                  d.points && d.points.length > 1
                    ? TOPIC_CONFIG.point.radius * 1.2
                    : TOPIC_CONFIG.point.radius
                );
            }
          }
        }

        // Reset the topic line
        const topic = d.mainTopic || d.points[0].mainTopic;
        g.select(`.topic-line-${topic.replace(/\s+/g, "-")}`)
          .attr("opacity", TOPIC_CONFIG.topic.lineOpacity)
          .attr("stroke-width", TOPIC_CONFIG.topic.lineStrokeWidth);

        // Always hide tooltip
        hideTooltip();
      },

      // Mouse move handler
      mouseMove(event: MouseEvent) {
        updatePosition(event.pageX, event.pageY);
      },

      // Child node click handler
      childClick(this: any, event: MouseEvent, d: any) {
        const eventData = d.event;
        const isDeselecting = eventData.index === selectedEventId;

        // Hide tooltip when clicking
        hideTooltip();

        // Raise the parent group to the front
        const parentKey = d3.select(this).attr("data-parent-key");
        if (parentKey) {
          const parentNodeId = getParentNodeId(parentKey);
          d3.select(`#${parentNodeId}`).raise();
        }

        setSelectedEventId(isDeselecting ? null : eventData.index);
        event.stopPropagation();
      },
    };

    // Add event listeners to parent circles
    parentNodes
      .selectAll("circle.parent-point")
      .on("mouseover", handleNodeInteraction.mouseOver)
      .on("mouseout", handleNodeInteraction.mouseOut)
      .on("mousemove", handleNodeInteraction.mouseMove);

    // Add event listeners to child circles
    childNodes
      .selectAll("circle.child-point-circle")
      .on("mouseover", handleNodeInteraction.mouseOver)
      .on("mouseout", handleNodeInteraction.mouseOut)
      .on("mousemove", handleNodeInteraction.mouseMove)
      .on("click", handleNodeInteraction.childClick);

    // After visualization is complete, restore expanded states
    currentExpandedStates.forEach((state, key) => {
      if (state.isExpanded) {
        const parentNode = d3.select(`#${getParentNodeId(key)}`);
        if (!parentNode.empty()) {
          const parent = parentNode.datum() as GroupedPoint;
          parent.isExpanded = true;
          pointStatesRef.current.set(key, state);

          // Restore expanded state visually
          const parentCircle = parentNode.select("circle");
          const countText = parentNode.select("text");
          const children = parentNode.selectAll(".child-point");

          parentCircle
            .attr("r", TOPIC_CONFIG.point.radius * 0.8)
            .style("opacity", 0.5);

          if (countText.node()) {
            countText.style("opacity", 0);
          }

          children.style("opacity", 1).style("pointer-events", "all");
        }
      }
    });

    // Do NOT reapply selection here - it will be handled by the separate effect
  }, [events, getParentNodeId, viewMode]);

  // Keep selection handling in a separate effect
  useEffect(() => {
    if (svgRef.current && selectedEventId !== undefined) {
      updateSelectedEventStyles(selectedEventId);
    }
  }, [selectedEventId, updateSelectedEventStyles]);

  // Initial setup and cleanup with resize observer
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === containerRef.current) {
          window.requestAnimationFrame(() => {
            updateVisualization();
          });
        }
      }
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
    <div className="w-full h-full flex flex-col">
      <div className="flex-none bg-white sticky top-0 z-10 shadow-sm">
        <div
          ref={headerRef}
          style={{ height: `${TOPIC_CONFIG.header.height}px` }}
        />
      </div>
      <div
        ref={containerRef}
        className="flex-1 relative"
        style={{
          overflowX: "hidden",
          overflowY: "scroll", // Always show vertical scrollbar
          scrollbarGutter: "stable", // Reserves space for the scrollbar
        }}
      >
        <svg
          ref={svgRef}
          className="absolute inset-0"
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            overflow: "visible",
            minWidth: "100%", // Ensures scrollbar shows even when content fits
          }}
        />
      </div>
    </div>
  );
}
