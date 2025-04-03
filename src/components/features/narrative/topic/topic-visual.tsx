"use client";

import { NarrativeEvent } from "@/types/lite";
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
  calculateRectDimensions,
  calculateRectPosition,
  calculateCenterPoint,
  updateRectAndText,
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

export function NarrativeTopicVisual({ events, viewMode }: TopicVisualProps) {
  const { selectedEventId, setSelectedEventId } = useCenterControl();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const pointStatesRef = useRef<Map<string, PointState>>(new Map());
  const { showTooltip, hideTooltip, updatePosition } = useTooltip();

  // Generate unique IDs for nodes
  const getParentNodeId = useCallback((groupKey: string) => {
    const safeKey = groupKey.replace(/[^a-zA-Z0-9-_]/g, "_");
    return `parent-node-${safeKey}`;
  }, []);

  const getChildNodeId = useCallback((eventIndex: number) => {
    return `child-node-${eventIndex}`;
  }, []);

  // Update node styles based on selectedEventId
  const updateSelectedEventStyles = useCallback(
    (newSelectedId: number | null) => {
      if (!svgRef.current) return;

      // Reset all nodes to default stroke style
      d3.select(svgRef.current)
        .selectAll(".parent-point, .child-point-rect")
        .attr("stroke", "black")
        .attr("stroke-width", TOPIC_CONFIG.point.strokeWidth);

      const guideLine = d3.select(svgRef.current).select(".guide-lines");
      guideLine.style("display", "none");

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

      childNode.attr("stroke", getHighlightColor());

      // Update guide line based on selected node
      if (!parentNode.empty()) {
        parentNode.attr("stroke", getHighlightColor());
        const x = parseFloat(parentNode.attr("x") || "0");
        const width = parseFloat(parentNode.attr("width") || "0");
        const centerX = x + width / 2;

        guideLine
          .style("display", "block")
          .select(".vertical")
          .attr("x1", centerX)
          .attr("x2", centerX);
      } else if (!childNode.empty()) {
        const parentKey = childNode.attr("data-parent-key");
        if (parentKey) {
          const parentNodeId = getParentNodeId(parentKey);
          const parentRect = d3.select(`#${parentNodeId}`).select("rect");
          parentRect.attr("stroke", getHighlightColor());

          const x = parseFloat(parentRect.attr("x") || "0");
          const width = parseFloat(parentRect.attr("width") || "0");
          const centerX = x + width / 2;

          guideLine
            .style("display", "block")
            .select(".vertical")
            .attr("x1", centerX)
            .attr("x2", centerX);
        }
      }
    },
    []
  );

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
    const currentSelection = selectedEventId;
    const currentExpandedStates = new Map(pointStatesRef.current);

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();
    d3.select(headerRef.current).selectAll("*").remove();

    // Process data
    const dataPoints = processEvents(events, viewMode);
    const topicCounts = getTopicCounts(dataPoints, viewMode);
    const topTopics = getTopTopics(topicCounts, viewMode);

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
    const { xScale, yScale } = getScales(dataPoints, topTopics, width, height);
    const { xAxis, yAxis } = createAxes(xScale, yScale);

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

    // Add guide line
    const guideLine = g
      .append("g")
      .attr("class", "guide-lines")
      .style("display", "none");

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

    // Add topic lines
    topTopics.forEach((topic) => {
      if (!yScale(topic)) return;
      const y = yScale(topic)! + yScale.bandwidth() / 2;

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

    // Group overlapping points
    const groupedPoints = groupOverlappingPoints(
      dataPoints,
      xScale,
      yScale,
      viewMode
    );

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

    // Helper function for sentiment color
    const getParentSentimentColor = (d: GroupedPoint) => {
      if (d.points.length <= 1) {
        return getSentimentColor(d.points[0].sentimentPolarity);
      }

      const avgIntensity =
        d.points.reduce((sum, p) => sum + p.sentiment, 0) / d.points.length;

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
    };

    // Add parent rectangles
    parentNodes
      .append("rect")
      .attr("class", "parent-point")
      .each(function (d: GroupedPoint) {
        const { width, height, rx, ry } = calculateRectDimensions(
          d.points.length,
          TOPIC_CONFIG.point.radius
        );
        const { rectX, rectY } = calculateRectPosition(d.x, d.y, width, height);

        d3.select(this)
          .attr("x", rectX)
          .attr("y", rectY)
          .attr("width", width)
          .attr("height", height)
          .attr("rx", rx)
          .attr("ry", ry)
          .attr("fill", getParentSentimentColor(d))
          .attr("stroke", "black")
          .attr("stroke-width", TOPIC_CONFIG.point.strokeWidth)
          .style("cursor", d.points.length > 1 ? "pointer" : "default")
          .attr("data-group-key", d.key.replace(/[^a-zA-Z0-9-_]/g, "_"))
          .attr("data-event-index", d.points[0].event.index)
          .attr("data-point-count", d.points.length);

        if (d.points.length > 1) {
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
        }
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
      .style("opacity", 0)
      .style("pointer-events", "none");

    childNodes
      .append("rect")
      .attr("class", "child-point-rect")
      .attr("id", (d: ChildPoint) => getChildNodeId(d.event.index))
      .attr("x", (d: ChildPoint) => {
        const parent = groupedPoints.find(
          (g) => g.key.replace(/[^a-zA-Z0-9-_]/g, "_") === d.parentKey
        )!;
        const positions = calculateExpandedPositions(
          parent,
          TOPIC_CONFIG.point.radius
        );
        return positions[d.index].x - TOPIC_CONFIG.point.radius;
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
      .attr("width", TOPIC_CONFIG.point.radius * 2)
      .attr("height", TOPIC_CONFIG.point.radius * 2)
      .attr("rx", TOPIC_CONFIG.point.radius)
      .attr("ry", TOPIC_CONFIG.point.radius)
      .attr("fill", (d: ChildPoint) => getSentimentColor(d.sentimentPolarity))
      .attr("stroke", "black")
      .attr("stroke-width", TOPIC_CONFIG.point.strokeWidth)
      .style("cursor", "pointer")
      .attr("data-parent-key", (d: ChildPoint) => d.parentKey)
      .attr("data-event-index", (d: ChildPoint) => d.event.index);

    // Node interaction handlers
    const handleNodeInteraction = {
      // Highlight node on hover
      highlightNode(node: d3.Selection<any, any, any, any>, isParent: boolean) {
        const d = node.datum();
        const pointCount = isParent && d.points ? d.points.length : 1;
        const x =
          parseFloat(node.attr("x") || "0") +
          parseFloat(node.attr("width") || "0") / 2;
        const y =
          parseFloat(node.attr("y") || "0") +
          parseFloat(node.attr("height") || "0") / 2;

        const { width, height, rx, ry } = calculateRectDimensions(
          pointCount,
          TOPIC_CONFIG.point.hoverRadius,
          false,
          true
        );

        updateRectAndText(node, null, x, y, width, height, rx, ry);

        if (!isParent) {
          const parentKey = node.attr("data-parent-key");
          if (parentKey) {
            const parentNode = d3
              .select(`#${getParentNodeId(parentKey)}`)
              .select("rect");
            const parentData = parentNode.datum() as GroupedPoint;

            if (parentData) {
              const parentX =
                parseFloat(parentNode.attr("x") || "0") +
                parseFloat(parentNode.attr("width") || "0") / 2;
              const parentY =
                parseFloat(parentNode.attr("y") || "0") +
                parseFloat(parentNode.attr("height") || "0") / 2;

              const {
                width: parentWidth,
                height: parentHeight,
                rx: parentRx,
                ry: parentRy,
              } = calculateRectDimensions(
                parentData.points.length,
                TOPIC_CONFIG.point.hoverRadius,
                false,
                true
              );

              updateRectAndText(
                parentNode,
                null,
                parentX,
                parentY,
                parentWidth,
                parentHeight,
                parentRx,
                parentRy
              );
            }
          }
        }
      },

      // Reset node highlighting
      resetNode(
        node: d3.Selection<any, any, any, any>,
        d: any,
        isParent: boolean
      ) {
        const pointCount = isParent && d.points ? d.points.length : 1;
        const radius =
          isParent && pointCount > 1
            ? TOPIC_CONFIG.point.radius * 1.2
            : TOPIC_CONFIG.point.radius;

        const x =
          parseFloat(node.attr("x") || "0") +
          parseFloat(node.attr("width") || "0") / 2;
        const y =
          parseFloat(node.attr("y") || "0") +
          parseFloat(node.attr("height") || "0") / 2;

        const { width, height, rx, ry } = calculateRectDimensions(
          pointCount,
          radius
        );

        updateRectAndText(node, null, x, y, width, height, rx, ry);

        if (!isParent) {
          const parentKey = node.attr("data-parent-key");
          if (parentKey) {
            const parentGroup = d3.select(`#${getParentNodeId(parentKey)}`);
            if (!parentGroup.empty()) {
              const parentData = parentGroup.datum() as GroupedPoint;
              const parentRadius =
                parentData.points.length > 1
                  ? TOPIC_CONFIG.point.radius * 1.2
                  : TOPIC_CONFIG.point.radius;

              const parentRect = parentGroup.select("rect");
              const parentX =
                parseFloat(parentRect.attr("x") || "0") +
                parseFloat(parentRect.attr("width") || "0") / 2;
              const parentY =
                parseFloat(parentRect.attr("y") || "0") +
                parseFloat(parentRect.attr("height") || "0") / 2;

              const {
                width: parentWidth,
                height: parentHeight,
                rx: parentRx,
                ry: parentRy,
              } = calculateRectDimensions(
                parentData.points.length,
                parentRadius
              );

              updateRectAndText(
                parentRect,
                null,
                parentX,
                parentY,
                parentWidth,
                parentHeight,
                parentRx,
                parentRy
              );
            }
          }
        }
      },

      // Mouse over handler
      mouseOver(this: any, event: MouseEvent, d: any) {
        const node = d3.select(this);
        const isParent = node.classed("parent-point");

        // Raise node to front
        if (isParent) {
          d3.select(this.parentNode).raise();
        } else {
          const parentKey = node.attr("data-parent-key");
          if (parentKey) {
            d3.select(`#${getParentNodeId(parentKey)}`).raise();
          }
        }

        handleNodeInteraction.highlightNode(node, isParent);

        // Show tooltip
        const eventData = d.event || d.points[0].event;
        showTooltip(eventData, event.pageX, event.pageY, "topic");

        // Highlight topic line
        const topic = d.mainTopic || d.points[0].mainTopic;
        g.select(`.topic-line-${topic.replace(/\s+/g, "-")}`).attr(
          "opacity",
          TOPIC_CONFIG.track.highlightOpacity
        );
      },

      // Mouse out handler
      mouseOut(this: any, event: MouseEvent, d: any) {
        const node = d3.select(this);
        const isParent = node.classed("parent-point");

        handleNodeInteraction.resetNode(node, d, isParent);

        // Reset topic line
        const topic = d.mainTopic || d.points[0].mainTopic;
        g.select(`.topic-line-${topic.replace(/\s+/g, "-")}`)
          .attr("opacity", TOPIC_CONFIG.track.opacity)
          .attr("stroke-width", TOPIC_CONFIG.track.strokeWidth);

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

        hideTooltip();

        // Raise parent group
        const parentKey = d3.select(this).attr("data-parent-key");
        if (parentKey) {
          d3.select(`#${getParentNodeId(parentKey)}`).raise();
        }

        setSelectedEventId(isDeselecting ? null : eventData.index);
        event.stopPropagation();
      },
    };

    // Handle click events for parent nodes
    parentNodes.on("click", function (event: MouseEvent, d: GroupedPoint) {
      if (d.points.length > 1) {
        const isExpanded = !d.isExpanded;
        d.isExpanded = isExpanded;
        pointStatesRef.current.set(d.key, { x: d.x, y: d.y, isExpanded });

        const parent = d3.select(this);
        const children = parent.selectAll(".child-point");
        const parentRect = parent.select("rect");
        const countText = parent.select("text");

        const x =
          parseFloat(parentRect.attr("x") || "0") +
          parseFloat(parentRect.attr("width") || "0") / 2;
        const y =
          parseFloat(parentRect.attr("y") || "0") +
          parseFloat(parentRect.attr("height") || "0") / 2;

        if (isExpanded) {
          parent.raise();

          const { width, height, rx, ry } = calculateRectDimensions(
            d.points.length,
            TOPIC_CONFIG.point.radius,
            true
          );

          updateRectAndText(
            parentRect,
            countText,
            x,
            y,
            width,
            height,
            rx,
            ry,
            200,
            0.5,
            "pointer"
          );

          children
            .transition()
            .duration(200)
            .style("opacity", 1)
            .style("pointer-events", "all");
        } else {
          const { width, height, rx, ry } = calculateRectDimensions(
            d.points.length,
            TOPIC_CONFIG.point.radius
          );

          updateRectAndText(
            parentRect,
            countText,
            x,
            y,
            width,
            height,
            rx,
            ry,
            200,
            1,
            "pointer"
          );

          children
            .transition()
            .duration(200)
            .style("opacity", 0)
            .style("pointer-events", "none");
        }
      } else {
        const eventData = d.points[0].event;
        setSelectedEventId(
          eventData.index === selectedEventId ? null : eventData.index
        );
      }
    });

    // Add event listeners
    parentNodes
      .selectAll("rect.parent-point")
      .on("mouseover", handleNodeInteraction.mouseOver)
      .on("mouseout", handleNodeInteraction.mouseOut)
      .on("mousemove", handleNodeInteraction.mouseMove);

    childNodes
      .selectAll("rect.child-point-rect")
      .on("mouseover", handleNodeInteraction.mouseOver)
      .on("mouseout", handleNodeInteraction.mouseOut)
      .on("mousemove", handleNodeInteraction.mouseMove)
      .on("click", handleNodeInteraction.childClick);

    // Restore expanded states
    currentExpandedStates.forEach((state, key) => {
      if (state.isExpanded) {
        const parentNode = d3.select(`#${getParentNodeId(key)}`);
        if (!parentNode.empty()) {
          const parent = parentNode.datum() as GroupedPoint;
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

          const { width, height, rx, ry } = calculateRectDimensions(
            parent.points.length,
            TOPIC_CONFIG.point.radius,
            true
          );

          updateRectAndText(
            parentRect,
            countText,
            x,
            y,
            width,
            height,
            rx,
            ry,
            0,
            0.5
          );

          children.style("opacity", 1).style("pointer-events", "all");
        }
      }
    });

    // Reapply selection if exists
    if (currentSelection !== null && currentSelection !== undefined) {
      updateSelectedEventStyles(currentSelection);
    }
  }, [
    events,
    getParentNodeId,
    viewMode,
    selectedEventId,
    updateSelectedEventStyles,
  ]);

  // Handle selection changes
  useEffect(() => {
    if (svgRef.current && selectedEventId !== undefined) {
      updateSelectedEventStyles(selectedEventId);
    }
  }, [selectedEventId, updateSelectedEventStyles]);

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

  // Handle background click to deselect
  const handleBackgroundClick = useCallback(() => {
    // Deselect any selected event
    setSelectedEventId(null);
    hideTooltip();

    // Close all expanded parent nodes
    if (svgRef.current) {
      // Reset all parent nodes to collapsed state
      d3.select(svgRef.current)
        .selectAll(".point-group")
        .each(function (d: any) {
          if (d.isExpanded) {
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

            const x =
              parseFloat(parentRect.attr("x") || "0") +
              parseFloat(parentRect.attr("width") || "0") / 2;
            const y =
              parseFloat(parentRect.attr("y") || "0") +
              parseFloat(parentRect.attr("height") || "0") / 2;

            const { width, height, rx, ry } = calculateRectDimensions(
              d.points.length,
              TOPIC_CONFIG.point.radius
            );

            updateRectAndText(
              parentRect,
              countText,
              x,
              y,
              width,
              height,
              rx,
              ry,
              200,
              1,
              "pointer"
            );

            children
              .transition()
              .duration(200)
              .style("opacity", 0)
              .style("pointer-events", "none");
          }
        });
    }
  }, [setSelectedEventId, hideTooltip]);

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
        className="flex-1 relative overflow-y-scroll"
        style={{
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
