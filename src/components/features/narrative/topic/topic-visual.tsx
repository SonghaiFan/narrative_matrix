"use client";
import { useCenterControl } from "@/contexts/center-control-context";
import { useTooltip } from "@/contexts/tooltip-context";
import * as d3 from "d3";
import { useRef, useCallback, useEffect } from "react";
import { getSentimentColor } from "../shared/color-utils";
import { TOPIC_CONFIG } from "./topic-config";
import { NarrativeEvent } from "@/types/lite";
import {
  processEvents,
  getTopicCounts,
  getTopTopics,
  getScales,
  createAxes,
  groupPointsByDistance,
  type GroupedPoint,
  type DataPoint,
  calculateExpandedPositions,
} from "./topic-visual-utils";
import {
  calculatePillDimensions,
  calculateCenterPoint,
  updateRectAndText,
} from "../shared/visualization-utils";
import {
  applyPillGeometry,
  createSinglePillHandlers,
  calculateGroupedPillMetrics,
} from "../shared/pill-component";
import {
  applySelectedEventStyles,
  collapseExpandedGroups,
  type PointState,
} from "./topic-visual-renderers";

export interface TopicVisualProps {
  events: NarrativeEvent[];
  viewMode: "main" | "sub" | "sentiment";
  metadata: {
    publishDate: string;
  };
}

export interface ChildPoint extends DataPoint {
  parentKey: string;
  index: number;
  total: number;
  centerY?: number;
}

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


  // Handle background click to deselect
  const handleBackgroundClick = useCallback(() => {
    setSelectedEventId(null);
    hideTooltip();

    collapseExpandedGroups({
      svg: svgRef.current,
      pointStates: pointStatesRef.current,
      getParentNodeId,
    });

    applySelectedEventStyles({
      svg: svgRef.current,
      selectedEventId: null,
      showVerticalTimeGuides: SHOW_VERTICAL_TIME_GUIDES,
      getParentNodeId,
    });
  }, [setSelectedEventId, hideTooltip, getParentNodeId]);

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

    // Calculate date range for each grouped point
    groupedPoints.forEach((group) => {
      const childDates = group.points
        .map((point) => point.event.temporal_anchoring.real_time)
        .filter((date) => date !== null)
        .map((date) => {
          if (Array.isArray(date)) {
            return [new Date(date[0]), new Date(date[1])];
          } else {
            return new Date(date);
          }
        });

      if (childDates.length > 0) {
        if (childDates.length === 1) {
          const firstDate = childDates[0];
          group.realTime = Array.isArray(firstDate)
            ? (firstDate as [Date, Date])
            : firstDate;
        } else {
          const allDates = childDates.flat();
          const minDate = new Date(
            Math.min(...allDates.map((d) => d.getTime()))
          );
          const maxDate = new Date(
            Math.max(...allDates.map((d) => d.getTime()))
          );
          group.realTime = [minDate, maxDate];
        }
      } else {
        group.realTime = null;
      }
    });

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
        const metrics = calculateGroupedPillMetrics({
          x: d.x,
          y: d.y,
          radius: TOPIC_CONFIG.point.radius,
          minX: d.minX,
          maxX: d.maxX,
          realTime: d.realTime ?? null,
        });

        const parentRect = d3
          .select(this)
          .attr("x", metrics.rectX)
          .attr("y", metrics.rectY)
          .attr("width", metrics.width)
          .attr("height", metrics.height)
          .attr("rx", metrics.rx)
          .attr("ry", metrics.ry)
          .attr("fill", getParentSentimentColor(d))
          .attr("stroke", "black")
          .attr("stroke-width", TOPIC_CONFIG.point.strokeWidth)
          .style("cursor", d.points.length > 1 ? "pointer" : "default")
          .attr("data-group-key", d.key.replace(/[^a-zA-Z0-9-_]/g, "_"))
          .attr("data-event-index", d.points[0].event.index)
          .attr("data-point-count", d.points.length)
          .attr("data-has-real-time", metrics.hasRange ? "true" : "false");

        // If this group only has a single child, hide the parent pill
        if (d.points.length === 1) {
          parentRect.style("opacity", 0).style("pointer-events", "none");
          return;
        }

        // Multi-child group: show count label on parent
        const { centerX, centerY } = calculateCenterPoint(
          metrics.rectX,
          metrics.rectY,
          metrics.width,
          metrics.height
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
      .data((d: GroupedPoint) => {
        const positions = calculateExpandedPositions(
          d,
          TOPIC_CONFIG.point.radius
        );
        return d.points.map((p: DataPoint, i: number) => ({
          ...p,
          parentKey: d.key.replace(/[^a-zA-Z0-9-_]/g, "_"),
          index: i,
          total: d.points.length,
          centerY: positions[i].y,
        }));
      })
      .enter()
      .append("g")
      .attr("class", "child-point")
      // Show child immediately when group has only one child; otherwise hide until expanded
      .style("opacity", (d: any) => (d.total === 1 ? 1 : 0))
      .style("pointer-events", (d: any) => (d.total === 1 ? "all" : "none"));

    childNodes
      .append("rect")
      .attr("class", "child-point-rect")
      .attr("id", (d: ChildPoint) => getChildNodeId(d.event.index))
      .each(function (d: ChildPoint) {
        applyPillGeometry(d3.select(this), {
          realTime: d.realTime,
          xScale,
          radius: TOPIC_CONFIG.point.radius,
          baseY: d.centerY!,
        });
      })
      .attr("fill", (d: ChildPoint) => getSentimentColor(d.sentimentPolarity))
      .attr("stroke", "black")
      .attr("stroke-width", TOPIC_CONFIG.point.strokeWidth)
      .style("cursor", "pointer")
      .attr("data-parent-key", (d: ChildPoint) => d.parentKey)
      .attr("data-event-index", (d: ChildPoint) => d.event.index);

    const childPillHandlers = createSinglePillHandlers<ChildPoint>({
      radius: TOPIC_CONFIG.point.radius,
      hoverRadius: TOPIC_CONFIG.point.hoverRadius,
      xScale,
      getBaseY: (d) => d.centerY!,
      showTooltip: (d, event) =>
        showTooltip(d.event, event.pageX, event.pageY, "topic"),
      hideTooltip,
      updatePosition,
      onMouseEnterExtra: (_node, _event, d) => {
        const parentNode = d3.select(`#${getParentNodeId(d.parentKey)}`);
        if (!parentNode.empty()) {
          parentNode.raise();
        }
      },
      onClick: (_node, event, d) => {
        hideTooltip();
        const parentNode = d3.select(`#${getParentNodeId(d.parentKey)}`);
        if (!parentNode.empty()) {
          parentNode.raise();
        }

        const isDeselecting = d.event.index === selectedEventId;
        setSelectedEventId(isDeselecting ? null : d.event.index);
        event.stopPropagation();
      },
    });

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

        // Only apply hover scaling if the parent is not expanded
        const isExpanded = isParent && d.isExpanded;
        // Preserve pill length for date range groups: detect via stored realTime range and width > base
        if (!isExpanded) {
          // For parent nodes, preserve the date range span but apply hover styling
          const hasRealTimeRange = Array.isArray(d.realTime);
          const originalWidth = parseFloat(node.attr("width") || "0");
          const baseWidth = TOPIC_CONFIG.point.radius * 2;
          const isRangePill = hasRealTimeRange && originalWidth > baseWidth + 2;

          if (isRangePill) {
            // Keep width for date range pills; only subtly thicken height for emphasis
            const newHeight = baseWidth * 1.2;
            const rx = TOPIC_CONFIG.point.hoverRadius;
            const ry = TOPIC_CONFIG.point.hoverRadius;
            updateRectAndText(
              node,
              null,
              x,
              y,
              originalWidth, // unchanged width
              newHeight,
              rx,
              ry,
              150
            );
          } else {
            // For non-range parent pills, use standard hover dimensions
            const { width, height, rx, ry } = calculatePillDimensions(
              d.realTime || null,
              xScale,
              TOPIC_CONFIG.point.hoverRadius,
              pointCount,
              false, // isExpanded
              true // isHovered
            );
            updateRectAndText(node, null, x, y, width, height, rx, ry, 150);
          }
        }

        if (!isParent) {
          const parentKey = node.attr("data-parent-key");
          if (parentKey) {
            const parentNode = d3
              .select(`#${getParentNodeId(parentKey)}`)
              .select("rect");
            const parentData = parentNode.datum() as GroupedPoint;

            if (parentData && !parentData.isExpanded) {
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
              } = calculatePillDimensions(
                parentData.realTime || null,
                xScale,
                TOPIC_CONFIG.point.hoverRadius,
                parentData.points.length,
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
                parentRy,
                150
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
        const radius = TOPIC_CONFIG.point.radius;

        const x =
          parseFloat(node.attr("x") || "0") +
          parseFloat(node.attr("width") || "0") / 2;
        const y =
          parseFloat(node.attr("y") || "0") +
          parseFloat(node.attr("height") || "0") / 2;

        // Only reset if the parent is not expanded
        const isExpanded = isParent && d.isExpanded;
        if (!isExpanded) {
          if (isParent) {
            // For parent (group) nodes, reset using the same system as initialization
            const collapsed = calculateGroupedPillMetrics({
              x: d.x,
              y: d.y,
              radius: TOPIC_CONFIG.point.radius,
              minX: d.minX,
              maxX: d.maxX,
              realTime: d.realTime ?? null,
            });

            updateRectAndText(
              node,
              null,
              collapsed.centerX,
              collapsed.centerY,
              collapsed.width,
              collapsed.height,
              collapsed.rx,
              collapsed.ry
            );
          } else {
            // Child nodes reset via the same pill dimension logic as initialization
            const datum: any = node.datum();
            const hasRealTimeRange = Array.isArray(datum?.realTime);
            const originalWidth = parseFloat(node.attr("width") || "0");
            const baseWidth = TOPIC_CONFIG.point.radius * 2;
            const isRangePill =
              hasRealTimeRange && originalWidth > baseWidth + 2;
            if (isRangePill) {
              updateRectAndText(
                node,
                null,
                x,
                y,
                originalWidth,
                baseWidth,
                TOPIC_CONFIG.point.radius,
                TOPIC_CONFIG.point.radius
              );
            } else {
              const { width, height, rx, ry } = calculatePillDimensions(
                d.realTime || null,
                xScale,
                radius,
                pointCount
              );
              updateRectAndText(node, null, x, y, width, height, rx, ry);
            }
          }
        }

        if (!isParent) {
          const parentKey = node.attr("data-parent-key");
          if (parentKey) {
            const parentGroup = d3.select(`#${getParentNodeId(parentKey)}`);
            if (!parentGroup.empty()) {
              const parentData = parentGroup.datum() as GroupedPoint;

              // Only reset parent if it's not expanded
              if (!parentData.isExpanded) {
                const parentRect = parentGroup.select("rect");
                const collapsed = calculateGroupedPillMetrics({
                  x: parentData.x,
                  y: parentData.y,
                  radius: TOPIC_CONFIG.point.radius,
                  minX: parentData.minX,
                  maxX: parentData.maxX,
                  realTime: parentData.realTime ?? null,
                });

                updateRectAndText(
                  parentRect,
                  null,
                  collapsed.centerX,
                  collapsed.centerY,
                  collapsed.width,
                  collapsed.height,
                  collapsed.rx,
                  collapsed.ry
                );
              }
            }
          }
        }
      },

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

        handleNodeInteraction.highlightNode(node, isParent);

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

        handleNodeInteraction.resetNode(node, d, isParent);

        hideTooltip();
      },

      // Mouse move handler
      mouseMove(event: MouseEvent) {
        updatePosition(event.pageX, event.pageY);
      },
    };

    // Handle click events for parent nodes
    parentNodes.on("click", function (event: MouseEvent, d: GroupedPoint) {
      if (d.points.length > 1) {
        const isExpanded = !d.isExpanded;

        // If expanding this node, collapse all other expanded nodes first
        if (isExpanded) {
          // Collapse all other expanded nodes
          d3.select(svgRef.current)
            .selectAll(".point-group")
            .each(function (otherD: any) {
              if (otherD.key !== d.key && otherD.isExpanded) {
                otherD.isExpanded = false;
                pointStatesRef.current.set(otherD.key, {
                  x: otherD.x,
                  y: otherD.y,
                  isExpanded: false,
                });

                // Update the visual state of the other node
                const otherParent = d3.select(this);
                const otherChildren = otherParent.selectAll(".child-point");
                const otherParentRect = otherParent.select("rect");
                const otherCountText = otherParent.select("text");

                // Use consistent pill system for collapsed state
                const collapsed = calculateGroupedPillMetrics({
                  x: otherD.x,
                  y: otherD.y,
                  radius: TOPIC_CONFIG.point.radius,
                  minX: otherD.minX,
                  maxX: otherD.maxX,
                  realTime: otherD.realTime ?? null,
                });

                updateRectAndText(
                  otherParentRect,
                  otherCountText,
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

                otherParentRect.attr(
                  "data-has-real-time",
                  collapsed.hasRange ? "true" : "false"
                );

                // Re-enable mouse events on parent when collapsed
                otherParentRect
                  .style("pointer-events", "all")
                  .style("cursor", "pointer");

                // Re-add mouse event handlers to parent
                otherParentRect
                  .on("mouseover", handleNodeInteraction.mouseOver)
                  .on("mouseout", handleNodeInteraction.mouseOut)
                  .on("mousemove", handleNodeInteraction.mouseMove);

                otherChildren
                  .transition()
                  .duration(200)
                  .style("opacity", 0)
                  .style("pointer-events", "none");
              }
            });
        }

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

          // Preserve original width and only grow height
          const originalWidth = parseFloat(parentRect.attr("width") || "0");
          const originalHeight = parseFloat(parentRect.attr("height") || "0");
          const rxCurrent = parseFloat(
            parentRect.attr("rx") || `${TOPIC_CONFIG.point.radius}`
          );
          const ryCurrent = parseFloat(
            parentRect.attr("ry") || `${TOPIC_CONFIG.point.radius}`
          );

          // Use consistent pill system for expanded state
          const expandedDimensions = calculatePillDimensions(
            d.realTime || null, // Use calculated date range from children
            xScale, // Use xScale for date-based sizing
            TOPIC_CONFIG.point.radius,
            d.points.length,
            true, // isExpanded
            false, // isHovered
            d.points.length // childCount
          );

          updateRectAndText(
            parentRect,
            countText,
            x,
            y,
            originalWidth,
            expandedDimensions.height,
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
          const collapsed = calculateGroupedPillMetrics({
            x: d.x,
            y: d.y,
            radius: TOPIC_CONFIG.point.radius,
            minX: d.minX,
            maxX: d.maxX,
            realTime: d.realTime ?? null,
          });

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

          parentRect.attr(
            "data-has-real-time",
            collapsed.hasRange ? "true" : "false"
          );

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
      .on("mouseenter", childPillHandlers.mouseEnter as any)
      .on("mouseleave", childPillHandlers.mouseLeave as any)
      .on("mousemove", childPillHandlers.mouseMove as any)
      .on("click", childPillHandlers.click as any);

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
        // First, collapse any other expanded nodes to maintain single-expand behavior
        d3.select(svgRef.current)
          .selectAll(".point-group")
          .each(function (otherD: any) {
            if (otherD.key !== targetGroup.key && otherD.isExpanded) {
              otherD.isExpanded = false;
              pointStatesRef.current.set(otherD.key, {
                x: otherD.x,
                y: otherD.y,
                isExpanded: false,
              });

              // Update the visual state of the other node
              const otherParent = d3.select(this);
              const otherChildren = otherParent.selectAll(".child-point");
              const otherParentRect = otherParent.select("rect");
              const otherCountText = otherParent.select("text");

              // Use consistent pill system for collapsed state
              const collapsed = calculateGroupedPillMetrics({
                x: otherD.x,
                y: otherD.y,
                radius: TOPIC_CONFIG.point.radius,
                minX: otherD.minX,
                maxX: otherD.maxX,
                realTime: otherD.realTime ?? null,
              });

              updateRectAndText(
                otherParentRect,
                otherCountText,
                collapsed.centerX,
                collapsed.centerY,
                collapsed.width,
                collapsed.height,
                collapsed.rx,
                collapsed.ry,
                0, // No transition for auto-collapse
                1,
                "pointer"
              );

              otherParentRect.attr(
                "data-has-real-time",
                collapsed.hasRange ? "true" : "false"
              );

              // Re-enable mouse events on parent when collapsed
              otherParentRect
                .style("pointer-events", "all")
                .style("cursor", "pointer");

              // Re-add mouse event handlers to parent
              otherParentRect
                .on("mouseover", handleNodeInteraction.mouseOver)
                .on("mouseout", handleNodeInteraction.mouseOut)
                .on("mousemove", handleNodeInteraction.mouseMove);

              otherChildren.style("opacity", 0).style("pointer-events", "none");
            }
          });

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

    applySelectedEventStyles({
      svg: svgRef.current,
      selectedEventId: currentSelection ?? null,
      xScale,
      showVerticalTimeGuides: SHOW_VERTICAL_TIME_GUIDES,
      getParentNodeId,
    });
  }, [
    events,
    getParentNodeId,
    viewMode,
    selectedEventId,
    getChildNodeId,
    showTooltip,
    hideTooltip,
    updatePosition,
    setSelectedEventId,
    handleBackgroundClick,
  ]);

  // Handle selection changes to keep expansion and highlight in sync
  useEffect(() => {
    if (svgRef.current && selectedEventId !== undefined) {
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
