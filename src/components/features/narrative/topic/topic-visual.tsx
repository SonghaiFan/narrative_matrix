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
        .selectAll(".parent-point, .child-point-circle")
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
        .selectAll(".child-point-circle")
        .filter(function () {
          return (
            d3.select(this).attr("data-event-index") === String(newSelectedId)
          );
        });

      // Update guide line based on selected node
      if (!parentNode.empty()) {
        parentNode.attr("stroke", getHighlightColor());
        const cx = parseFloat(parentNode.attr("cx") || "0");
        guideLine
          .style("display", "block")
          .select(".vertical")
          .attr("x1", cx)
          .attr("x2", cx);
      } else if (!childNode.empty()) {
        childNode
          .attr("stroke", getHighlightColor())
          .attr("stroke-width", TOPIC_CONFIG.point.strokeWidth * 1.5);

        const parentKey = childNode.attr("data-parent-key");
        if (parentKey) {
          const parentNodeId = getParentNodeId(parentKey);
          const parentCircle = d3.select(`#${parentNodeId}`).select("circle");
          parentCircle.attr("stroke", getHighlightColor());

          const cx = parseFloat(parentCircle.attr("cx") || "0");
          guideLine
            .style("display", "block")
            .select(".vertical")
            .attr("x1", cx)
            .attr("x2", cx);
        }
      }
    },
    [getParentNodeId]
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

    // Add parent circles
    parentNodes
      .append("circle")
      .attr("class", "parent-point")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", (d) =>
        d.points.length > 1
          ? TOPIC_CONFIG.point.radius * 1.2
          : TOPIC_CONFIG.point.radius
      )
      .attr("fill", getParentSentimentColor)
      .attr("stroke", "black")
      .attr("stroke-width", TOPIC_CONFIG.point.strokeWidth)
      .style("cursor", (d) => (d.points.length > 1 ? "pointer" : "default"))
      .attr("data-group-key", (d) => d.key.replace(/[^a-zA-Z0-9-_]/g, "_"))
      .attr("data-event-index", (d) => d.points[0].event.index)
      .attr("data-point-count", (d) => d.points.length)
      .each(function (d: GroupedPoint) {
        if (d.points.length > 1) {
          d3.select(this.parentElement)
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
      .attr("data-parent-key", (d: ChildPoint) => d.parentKey)
      .attr("data-event-index", (d: ChildPoint) => d.event.index);

    // Node interaction handlers
    const handleNodeInteraction = {
      // Highlight node on hover
      highlightNode(node: d3.Selection<any, any, any, any>, isParent: boolean) {
        node
          .transition()
          .duration(150)
          .attr("r", TOPIC_CONFIG.point.hoverRadius);

        if (!isParent) {
          const parentKey = node.attr("data-parent-key");
          if (parentKey) {
            d3.select(`#${getParentNodeId(parentKey)}`)
              .select("circle")
              .transition()
              .duration(150)
              .attr("r", TOPIC_CONFIG.point.hoverRadius);
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

        node.transition().duration(150).attr("r", radius);

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

              parentGroup
                .select("circle")
                .transition()
                .duration(150)
                .attr("r", parentRadius);
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
          TOPIC_CONFIG.topic.lineHighlightOpacity
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
          .attr("opacity", TOPIC_CONFIG.topic.lineOpacity)
          .attr("stroke-width", TOPIC_CONFIG.topic.lineStrokeWidth);

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
        const parentCircle = parent.select("circle");
        const countText = parent.select("text");

        if (isExpanded) {
          parent.raise();
          parentCircle
            .transition()
            .duration(200)
            .attr("r", TOPIC_CONFIG.point.radius * 0.8)
            .style("opacity", 0.5)
            .style("cursor", "pointer");

          countText?.style("opacity", 0);

          children
            .transition()
            .duration(200)
            .style("opacity", 1)
            .style("pointer-events", "all");
        } else {
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

          countText?.style("opacity", 1);

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
      .selectAll("circle.parent-point")
      .on("mouseover", handleNodeInteraction.mouseOver)
      .on("mouseout", handleNodeInteraction.mouseOut)
      .on("mousemove", handleNodeInteraction.mouseMove);

    childNodes
      .selectAll("circle.child-point-circle")
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
          const parentCircle = parentNode.select("circle");
          const countText = parentNode.select("text");
          const children = parentNode.selectAll(".child-point");

          parentCircle
            .attr("r", TOPIC_CONFIG.point.radius * 0.8)
            .style("opacity", 0.5);

          countText?.style("opacity", 0);
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
      >
        <svg ref={svgRef} className="w-full h-full" />
      </div>
    </div>
  );
}
