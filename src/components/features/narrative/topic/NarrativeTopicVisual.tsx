"use client";
import { useCenterControl } from "@/contexts/center-control-context";
import { useTooltip } from "@/contexts/tooltip-context";
import * as d3 from "d3";
import { useRef, useCallback, useEffect } from "react";
import { getSentimentColor } from "../shared/color-utils";
import { TOPIC_CONFIG } from "./topic-config";
import { TopicVisualProps, PointState, ChildPoint } from "./topic-visual";
import {
  processEvents,
  getTopicCounts,
  getTopTopics,
  getScales,
  createAxes,
  groupPointsByDistance,
  type GroupedPoint,
  calculateCenterPoint,
  type DataPoint,
  calculateExpandedPositions,
  updateRectAndText,
} from "./topic-visual-utils";

export function NarrativeTopicVisual({ events, viewMode }: TopicVisualProps) {
  // Feature flag: disable x (vertical) guideline per request
  // We keep vertical time guide lines (date markers) but disable horizontal guideline.
  const SHOW_VERTICAL_TIME_GUIDES = true;
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

  const getCollapsedParentMetrics = useCallback((group: GroupedPoint) => {
    const radius = TOPIC_CONFIG.point.radius;
    const baseHeight = radius * 2;
    const baseWidth = radius * 3;
    const hasRange =
      group.minX !== undefined &&
      group.maxX !== undefined &&
      group.maxX > group.minX + 0.5;

    let spanWidth = baseWidth;
    if (hasRange) {
      spanWidth = Math.max(group.maxX! - group.minX! + radius * 4, baseWidth);
    }

    const centerX = group.x;
    const centerY = group.y;
    const rectX = centerX - spanWidth / 2;
    const rectY = centerY - baseHeight / 2;
    const cornerRadius = baseHeight / 2;

    return {
      rectX,
      rectY,
      width: spanWidth,
      height: baseHeight,
      rx: cornerRadius,
      ry: cornerRadius,
      centerX,
      centerY,
      hasRange,
    };
  }, []);

  // Update node styles based on selectedEventId
  const updateSelectedEventStyles = useCallback(
    (newSelectedId: number | null, xScale?: any) => {
      if (!svgRef.current) return;

      // Reset all nodes to default stroke style
      d3.select(svgRef.current)
        .selectAll(".parent-point, .child-point-rect")
        .attr("stroke", "black")
        .attr("stroke-width", TOPIC_CONFIG.point.strokeWidth);

      const guideLine = d3.select(svgRef.current).select(".guide-lines");
      if (SHOW_VERTICAL_TIME_GUIDES) {
        // Reset visibility (they will be re-shown for selected node)
        guideLine.style("display", "none");
        guideLine.selectAll(".guide-line.vertical").style("display", "none");
        guideLine.selectAll(".guide-label").style("display", "none");
      }

      if (newSelectedId === null) return;

      const highlightedParents = d3
        .select(svgRef.current)
        .selectAll(".parent-point")
        .filter(function () {
          return (
            d3.select(this).attr("data-event-index") === String(newSelectedId)
          );
        })
        .attr("stroke", TOPIC_CONFIG.highlight.color);

      const highlightedChildren = d3
        .select(svgRef.current)
        .selectAll(".child-point-rect")
        .filter(function () {
          return (
            d3.select(this).attr("data-event-index") === String(newSelectedId)
          );
        })
        .attr("stroke", TOPIC_CONFIG.highlight.color)
        .each(function () {
          const parentKey = d3.select(this).attr("data-parent-key");
          if (parentKey) {
            d3
              .select(`#${getParentNodeId(parentKey)}`)
              .select("rect")
              .attr("stroke", TOPIC_CONFIG.highlight.color);
          }
        });

      // Show guide lines for the selected node
      let selectedNode: SVGRectElement | null = null;
      if (!highlightedChildren.empty()) {
        selectedNode = highlightedChildren.node() as SVGRectElement;
      } else if (!highlightedParents.empty()) {
        selectedNode = highlightedParents.node() as SVGRectElement;
      }

      if (SHOW_VERTICAL_TIME_GUIDES && selectedNode && xScale) {
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

          if (startDate && xScale) {
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
    const dataPoints = processEvents(events);
    const topicCounts = getTopicCounts(dataPoints, viewMode);
    let topTopics = getTopTopics(topicCounts);
    if (viewMode === "sentiment") {
      const sentimentOrder = ["positive", "neutral", "negative"];
      topTopics = sentimentOrder.filter((s) => topicCounts.has(s));
    }

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

    // Add guide lines
    const guideLine = g
      .append("g")
      .attr("class", "guide-lines")
      .style("display", SHOW_VERTICAL_TIME_GUIDES ? "none" : "none");

    if (SHOW_VERTICAL_TIME_GUIDES) {
      guideLine
        .append("line")
        .attr("class", "guide-line vertical start")
        .attr("y1", -TOPIC_CONFIG.margin.top)
        .attr("y2", height + TOPIC_CONFIG.margin.bottom + 1000)
        .attr("stroke", "#3b82f6")
        .attr("stroke-width", 2);
      guideLine
        .append("line")
        .attr("class", "guide-line vertical end")
        .attr("y1", -TOPIC_CONFIG.margin.top)
        .attr("y2", height + TOPIC_CONFIG.margin.bottom + 1000)
        .attr("stroke", "#3b82f6")
        .attr("stroke-width", 2)
        .style("display", "none");
      guideLine
        .append("line")
        .attr("class", "guide-line vertical")
        .attr("y1", -TOPIC_CONFIG.margin.top)
        .attr("y2", height + TOPIC_CONFIG.margin.bottom + 1000)
        .attr("stroke", "#3b82f6")
        .attr("stroke-width", 2);
      guideLine
        .append("text")
        .attr("class", "guide-label start")
        .attr("y", -TOPIC_CONFIG.margin.top + 12)
        .attr("fill", "#3b82f6")
        .attr("font-size", "12px")
        .attr("font-weight", "500")
        .attr("text-anchor", "end")
        .style("display", "none");
      guideLine
        .append("text")
        .attr("class", "guide-label end")
        .attr("y", -TOPIC_CONFIG.margin.top + 12)
        .attr("fill", "#3b82f6")
        .attr("font-size", "12px")
        .attr("font-weight", "500")
        .attr("text-anchor", "start")
        .style("display", "none");
    }

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
    const groupedPoints = groupPointsByDistance(
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
        const { rectX, rectY, width, height, rx, ry, hasRange } =
          getCollapsedParentMetrics(d);

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
          .attr("data-point-count", d.points.length)
          .attr("data-has-real-time", hasRange ? "true" : "false");

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
      .attr("fill", (d: ChildPoint) => getSentimentColor(d.sentimentPolarity))
      .attr("stroke", "black")
      .attr("stroke-width", TOPIC_CONFIG.point.strokeWidth)
      .style("cursor", "pointer")
      .attr("data-parent-key", (d: ChildPoint) => d.parentKey)
      .attr("data-event-index", (d: ChildPoint) => d.event.index)
      .attr("data-has-real-time", (d: ChildPoint) => Array.isArray(d.realTime));

    // Node interaction handlers
    const handleNodeInteraction = {
      // Mouse over handler
      mouseOver(this: any, event: MouseEvent, d: any) {
        const node = d3.select(this);
        const isParent = node.classed("parent-point");
        const isExpanded = isParent && d.isExpanded;

        // Skip hover effects if parent is expanded
        if (isExpanded) {
          return;
        }

        // Raise node to front
        if (isParent) {
          d3.select(this.parentNode).raise();
        } else {
          const parentKey = node.attr("data-parent-key");
          if (parentKey) {
            d3.select(`#${getParentNodeId(parentKey)}`).raise();
          }
        }

        // Show tooltip
        const eventData = d.event || d.points[0].event;
        showTooltip(eventData, event.pageX, event.pageY, "topic");
      },

      // Mouse out handler
      mouseOut(this: any, event: MouseEvent, d: any) {
        const node = d3.select(this);
        const isParent = node.classed("parent-point");
        const isExpanded = isParent && d.isExpanded;

        // Skip reset if parent is expanded
        if (isExpanded) {
          return;
        }

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

        // Hide tooltip before toggling expansion
        hideTooltip();

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

          // Preserve original width (date range pill or sized circle) and only grow height
          const originalWidth = parseFloat(parentRect.attr("width") || "0");
          const originalHeight = parseFloat(parentRect.attr("height") || "0");
          const rxCurrent = parseFloat(
            parentRect.attr("rx") || `${TOPIC_CONFIG.point.radius}`
          );
          const ryCurrent = parseFloat(
            parentRect.attr("ry") || `${TOPIC_CONFIG.point.radius}`
          );

          const verticalSpacing = TOPIC_CONFIG.point.radius * 2.5; // must match calculateExpandedPositions
          const neededHeight =
            (d.points.length - 1) * verticalSpacing +
            TOPIC_CONFIG.point.radius * 3; // padding
          const expandedHeight = Math.max(originalHeight, neededHeight);

          updateRectAndText(
            parentRect,
            countText,
            x,
            y,
            originalWidth, // unchanged width
            expandedHeight,
            rxCurrent,
            ryCurrent,
            200,
            0.5,
            "default"
          );

          // Disable mouse events on parent when expanded
          parentRect.style("pointer-events", "none").style("cursor", "default");

          // Remove mouse event handlers from parent
          parentRect
            .on("mouseover", null)
            .on("mouseout", null)
            .on("mousemove", null);

          children
            .transition()
            .duration(200)
            .style("opacity", 1)
            .style("pointer-events", "all");
        } else {
          const collapsed = getCollapsedParentMetrics(d);

          updateRectAndText(
            parentRect,
            countText,
            collapsed.centerX,
            collapsed.centerY,
            collapsed.width,
            collapsed.height,
            collapsed.rx,
            collapsed.ry,
            200,
            1,
            "pointer"
          );

          parentRect.attr("data-has-real-time", collapsed.hasRange ? "true" : "false");

          // Re-enable mouse events on parent when collapsed
          parentRect.style("pointer-events", "all").style("cursor", "pointer");

          // Re-add mouse event handlers to parent
          parentRect
            .on("mouseover", handleNodeInteraction.mouseOver)
            .on("mouseout", handleNodeInteraction.mouseOut)
            .on("mousemove", handleNodeInteraction.mouseMove);

          children
            .transition()
            .duration(200)
            .style("opacity", 0)
            .style("pointer-events", "none");
        }
      } else {
        // For parent nodes with no children, behave like a child node
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

          const originalWidth = parseFloat(parentRect.attr("width") || "0");
          const originalHeight = parseFloat(parentRect.attr("height") || "0");
          const rxCurrent = parseFloat(
            parentRect.attr("rx") || `${TOPIC_CONFIG.point.radius}`
          );
          const ryCurrent = parseFloat(
            parentRect.attr("ry") || `${TOPIC_CONFIG.point.radius}`
          );
          const verticalSpacing = TOPIC_CONFIG.point.radius * 2.5;
          const neededHeight =
            (parent.points.length - 1) * verticalSpacing +
            TOPIC_CONFIG.point.radius * 3;
          const expandedHeight = Math.max(originalHeight, neededHeight);

          updateRectAndText(
            parentRect,
            countText,
            x,
            y,
            originalWidth,
            expandedHeight,
            rxCurrent,
            ryCurrent,
            0,
            0.5
          );

          // Disable mouse events on parent when expanded
          parentRect.style("pointer-events", "none").style("cursor", "default");

          children.style("opacity", 1).style("pointer-events", "all");
        }
      }
    });

    // Auto-expand group if a selected child belongs to a collapsed multi-child group
    if (currentSelection !== null && currentSelection !== undefined) {
      const targetGroup = groupedPoints.find(
        (gp) =>
          gp.points.length > 1 &&
          gp.points.some((p) => p.event.index === currentSelection)
      );
      if (targetGroup && !targetGroup.isExpanded) {
        // Mark expanded in state map
        targetGroup.isExpanded = true;
        pointStatesRef.current.set(targetGroup.key, {
          x: targetGroup.x,
          y: targetGroup.y,
          isExpanded: true,
        });

        const parentNode = d3.select(`#${getParentNodeId(targetGroup.key)}`);
        if (!parentNode.empty()) {
          const parentRect = parentNode.select("rect");
          const countText = parentNode.select("text");
          const children = parentNode.selectAll(".child-point");

          const x =
            parseFloat(parentRect.attr("x") || "0") +
            parseFloat(parentRect.attr("width") || "0") / 2;
          const y =
            parseFloat(parentRect.attr("y") || "0") +
            parseFloat(parentRect.attr("height") || "0") / 2;

          // Preserve width, only grow height (same logic as manual expand)
          const originalWidth = parseFloat(parentRect.attr("width") || "0");
          const originalHeight = parseFloat(parentRect.attr("height") || "0");
          const rxCurrent = parseFloat(
            parentRect.attr("rx") || `${TOPIC_CONFIG.point.radius}`
          );
          const ryCurrent = parseFloat(
            parentRect.attr("ry") || `${TOPIC_CONFIG.point.radius}`
          );
          const verticalSpacing = TOPIC_CONFIG.point.radius * 2.5;
          const neededHeight =
            (targetGroup.points.length - 1) * verticalSpacing +
            TOPIC_CONFIG.point.radius * 3;
          const expandedHeight = Math.max(originalHeight, neededHeight);

          updateRectAndText(
            parentRect,
            countText,
            x,
            y,
            originalWidth,
            expandedHeight,
            rxCurrent,
            ryCurrent,
            0,
            0.5,
            "default"
          );

          parentRect.style("pointer-events", "none").style("cursor", "default");
          children.style("opacity", 1).style("pointer-events", "all");
        }
      }
    }

    // Reapply selection if exists
    if (currentSelection !== null && currentSelection !== undefined) {
      updateSelectedEventStyles(currentSelection, xScale);
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
      // We need to access xScale from the latest render
      // Since we don't have direct access here, let's call updateVisualization which will handle it
      updateVisualization();
    }
  }, [selectedEventId, updateVisualization]);

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

            const collapsed = getCollapsedParentMetrics(d);

            updateRectAndText(
              parentRect,
              countText,
              collapsed.centerX,
              collapsed.centerY,
              collapsed.width,
              collapsed.height,
              collapsed.rx,
              collapsed.ry,
              200,
              1,
              "pointer"
            );

            parentRect.attr("data-has-real-time", collapsed.hasRange ? "true" : "false");

            // Re-enable mouse events on parent when collapsed
            parentRect
              .style("pointer-events", "all")
              .style("cursor", "pointer");

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
