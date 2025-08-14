"use client";

import { NarrativeEvent } from "@/types/data";
import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import { TIME_CONFIG } from "./time-config";
import { SHARED_CONFIG } from "@/components/visualisation/shared/visualization-config";
import { useCenterControl } from "@/contexts/center-control-context";
import {
  processEvents,
  getSortedPoints,
  getScales,
  getTimeDimensions,
  createAxes,
  DataPoint,
} from "./time-visual.utils";
import { getNodetColor } from "@/components/visualisation/shared/color-utils";

const getXPosition = (data: any, scale: any) => (scale ? scale(data) : 0); // Placeholder function

interface TimeVisualProps {
  events: NarrativeEvent[];
  metadata: {
    publishDate: string;
  };
}

export function NarrativeTimeVisual({ events, metadata }: TimeVisualProps) {
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
  const selectedNodeRef = useRef<SVGRectElement | null>(null);

  // Function to update node styles based on focusedEventId and markedEventIds
  const updateSelectedEventStyles = useCallback(() => {
    if (!svgRef.current) return;

    // Reset all points to default style
    d3.select(svgRef.current)
      .selectAll(".point")
      .attr("stroke", (d: any) => {
        const eventIndex = d.event.index;
        return isEventMarked(eventIndex)
          ? TIME_CONFIG.highlight.color
          : "black";
      })
      .attr("stroke-width", (d: any) => {
        const eventIndex = d.event.index;
        return isEventMarked(eventIndex) ? 2 : TIME_CONFIG.point.strokeWidth;
      });

    // Get guide lines group
    const guideLines = d3.select(svgRef.current).select(".guide-lines");

    // Hide all guide elements initially
    guideLines.selectAll(".guide-line").style("display", "none");
    guideLines.selectAll(".guide-label").style("display", "none");

    // If we have a selected event, show guide lines
    if (focusedEventId !== null && focusedEventId !== undefined) {
      // Find points with matching event index
      const selectedPoints = d3
        .select(svgRef.current)
        .selectAll(`.point[data-event-index="${focusedEventId}"]`);

      if (!selectedPoints.empty()) {
        // Get the selected point's position
        const selectedPoint = selectedPoints.node() as SVGRectElement;
        const x = parseFloat(selectedPoint.getAttribute("x") || "0");
        const width = parseFloat(selectedPoint.getAttribute("width") || "0");
        const y = parseFloat(selectedPoint.getAttribute("y") || "0");
        const height = parseFloat(selectedPoint.getAttribute("height") || "0");

        // Find the center of the rect for horizontal guide
        const centerY = y + height / 2;

        // Show guide lines
        guideLines.style("display", "block");

        // Update horizontal guide line
        guideLines
          .select(".guide-line.horizontal")
          .style("display", "block")
          .attr("y1", centerY)
          .attr("y2", centerY);

        // Get the selected node's data to determine if it's a date range
        const nodeData = selectedPoints.datum() as DataPoint;
        if (nodeData && nodeData.hasRealTime && nodeData.realTime) {
          if (Array.isArray(nodeData.realTime)) {
            // Date range - show both start and end labels and lines
            const [startDate, endDate] = nodeData.realTime;

            // We need to get the xScale - let's find it from the current visualization
            const svg = d3.select(svgRef.current);
            const xAxisTicks = svg.selectAll(".x-axis .tick");

            // For now, calculate positions based on the rect positions
            const startX = x + TIME_CONFIG.point.radius; // Start of the actual date range
            const endX = x + width - TIME_CONFIG.point.radius; // End of the actual date range

            // Start date label
            guideLines
              .select(".guide-label.start")
              .style("display", "block")
              .attr("x", startX - 5)
              .text(startDate.toLocaleDateString());

            // End date label
            guideLines
              .select(".guide-label.end")
              .style("display", "block")
              .attr("x", endX + 5)
              .text(endDate.toLocaleDateString());

            // Show both vertical lines for date ranges
            guideLines
              .select(".guide-line.vertical.start")
              .style("display", "block")
              .attr("x1", startX)
              .attr("x2", startX);

            guideLines
              .select(".guide-line.vertical.end")
              .style("display", "block")
              .attr("x1", endX)
              .attr("x2", endX);
          } else {
            // Single date - show single label and line
            const centerX = x + width / 2;

            // Single date label
            guideLines
              .select(".guide-label.start")
              .style("display", "block")
              .attr("x", centerX - 5)
              .text(nodeData.realTime.toLocaleDateString());

            // Single vertical line
            guideLines
              .select(".guide-line.vertical")
              .style("display", "block")
              .attr("x1", centerX)
              .attr("x2", centerX);
          }
        } else {
          // No real time data - show single line at center
          const centerX = x + width / 2;

          guideLines
            .select(".guide-line.vertical")
            .style("display", "block")
            .attr("x1", centerX)
            .attr("x2", centerX);
        }

        // Store and scroll the selected node into view
        selectedNodeRef.current = selectedPoint;
        selectedNodeRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    } else {
      // Hide guide lines when no point is selected
      guideLines.style("display", "none");
    }
  }, [focusedEventId, markedEventIds, isEventMarked]);

  // Create and render guide lines
  const renderGuideLines = useCallback(
    (
      g: d3.Selection<SVGGElement, unknown, null, undefined>,
      width: number,
      height: number
    ) => {
      const guideLines = g
        .append("g")
        .attr("class", "guide-lines")
        .style("display", "none");

      // Add horizontal guide line
      guideLines
        .append("line")
        .attr("class", "guide-line horizontal")
        .attr("x1", -TIME_CONFIG.margin.left)
        .attr("x2", width + TIME_CONFIG.margin.right)
        .attr("stroke", "#3b82f6")
        .attr("stroke-width", 2);

      // Start date guide line
      guideLines
        .append("line")
        .attr("class", "guide-line vertical start")
        .attr("y1", -TIME_CONFIG.margin.top)
        .attr("y2", height + TIME_CONFIG.margin.bottom + 1000)
        .attr("stroke", "#3b82f6")
        .attr("stroke-width", 2);

      // End date guide line (for date ranges)
      guideLines
        .append("line")
        .attr("class", "guide-line vertical end")
        .attr("y1", -TIME_CONFIG.margin.top)
        .attr("y2", height + TIME_CONFIG.margin.bottom + 1000)
        .attr("stroke", "#3b82f6")
        .attr("stroke-width", 2)
        .style("display", "none");

      // Single vertical guide line (for backwards compatibility)
      guideLines
        .append("line")
        .attr("class", "guide-line vertical")
        .attr("y1", -TIME_CONFIG.margin.top)
        .attr("y2", height + TIME_CONFIG.margin.bottom + 1000)
        .attr("stroke", "#3b82f6")
        .attr("stroke-width", 2);

      // Start date label
      guideLines
        .append("text")
        .attr("class", "guide-label start")
        .attr("y", -TIME_CONFIG.margin.top + 12)
        .attr("fill", "#3b82f6")
        .attr("font-size", "12px")
        .attr("font-weight", "500")
        .attr("text-anchor", "end")
        .style("display", "none");

      // End date label
      guideLines
        .append("text")
        .attr("class", "guide-label end")
        .attr("y", -TIME_CONFIG.margin.top + 12)
        .attr("fill", "#3b82f6")
        .attr("font-size", "12px")
        .attr("font-weight", "500")
        .attr("text-anchor", "start")
        .style("display", "none");

      return guideLines;
    },
    []
  );

  // Handle point interactions
  const handlePointInteractions = useCallback(
    (
      pointsGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
      dataPoints: DataPoint[],
      labelsGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
      xScale: any,
      yScale: d3.ScaleLinear<number, number>,
      publishX: number
    ) => {
      // Define node interaction handlers
      const handleNodeInteraction = {
        // Mouse enter handler - now triggers selection
        mouseEnter(this: any, event: MouseEvent, d: any) {
          const node = d3.select(this);
          const currentHeight = TIME_CONFIG.point.hoverRadius * 2;
          const currentWidth = node.attr("width");
          const originalWidth = parseFloat(currentWidth);

          // Calculate the increase factor and new width
          const scaleFactor =
            TIME_CONFIG.point.hoverRadius / TIME_CONFIG.point.radius;
          let newWidth = originalWidth;

          // For date ranges, only scale the caps while preserving the time span
          if (d.hasRealTime && Array.isArray(d.realTime)) {
            // Only increase the caps (add additional radius to both sides)
            const timeSpanWidth = xScale(d.realTime[1]) - xScale(d.realTime[0]);
            newWidth = timeSpanWidth + TIME_CONFIG.point.hoverRadius * 2;
          } else {
            // For single points, scale the entire width
            newWidth = TIME_CONFIG.point.hoverRadius * 2;
          }

          // Calculate new x position to maintain center alignment
          const originalX = parseFloat(node.attr("x"));
          const originalCenterX = originalX + originalWidth / 2;
          const newX = originalCenterX - newWidth / 2;

          node
            .raise() // Bring to front
            .transition()
            .duration(150)
            .attr("height", currentHeight)
            .attr("width", newWidth)
            .attr("x", newX)
            .attr("y", yScale(d.narrativeTime) - TIME_CONFIG.point.hoverRadius)
            .attr("rx", TIME_CONFIG.point.hoverRadius)
            .attr("ry", TIME_CONFIG.point.hoverRadius);

          // Set focused event on hover
          setfocusedEventId(d.event.index);
        },
        // Mouse leave handler - now clears selection
        mouseLeave(this: any, event: MouseEvent, d: any) {
          const node = d3.select(this);
          const originalWidth =
            d.hasRealTime && Array.isArray(d.realTime)
              ? Math.max(
                  xScale(d.realTime[1]) -
                    xScale(d.realTime[0]) +
                    TIME_CONFIG.point.radius * 2,
                  TIME_CONFIG.point.radius * 2
                )
              : TIME_CONFIG.point.radius * 2;

          // Calculate proper x position to maintain center alignment
          const hoverX = parseFloat(node.attr("x"));
          const hoverWidth = parseFloat(node.attr("width"));
          const centerX = hoverX + hoverWidth / 2;
          const newX = centerX - originalWidth / 2;

          node
            .transition()
            .duration(150)
            .attr("height", TIME_CONFIG.point.radius * 2)
            .attr("width", originalWidth)
            .attr("x", newX)
            .attr("y", yScale(d.narrativeTime) - TIME_CONFIG.point.radius)
            .attr("rx", TIME_CONFIG.point.radius)
            .attr("ry", TIME_CONFIG.point.radius);

          if (d.hasRealTime) {
            const label = labelsGroup.select(`.label-container-${d.index}`);
            if (!label.empty()) {
              label
                .select(".label-background")
                .transition()
                .duration(150)
                .attr("filter", "drop-shadow(0 1px 1px rgba(0,0,0,0.05))")
                .attr("stroke", "#94a3b8");

              label
                .select(".connector")
                .transition()
                .duration(150)
                .attr("stroke", "#94a3b8")
                .attr("stroke-width", 1);
            }
          }

          // Clear focused event on mouse leave
          setfocusedEventId(null);
        },

        // Click handler - now toggles marking
        click(this: any, event: MouseEvent, d: any) {
          event.preventDefault();
          toggleMarkedEvent(d.event.index);
        },
      };

      pointsGroup
        .selectAll(".point")
        .data(dataPoints)
        .enter()
        .append("rect")
        .attr("class", (d) => `point point-${d.index}`)
        .attr("x", (d) => {
          if (d.hasRealTime) {
            if (Array.isArray(d.realTime)) {
              // For date ranges: Position at the start date
              return xScale(d.realTime[0]) - TIME_CONFIG.point.radius;
            }
            // For single date: Center the rectangle on the point
            return xScale(d.realTime!) - TIME_CONFIG.point.radius;
          }
          // For no dates: Center the rectangle on the publish line
          return publishX - TIME_CONFIG.point.radius;
        })
        .attr("y", (d) => yScale(d.narrativeTime) - TIME_CONFIG.point.radius)
        .attr("width", (d) => {
          if (d.hasRealTime && Array.isArray(d.realTime)) {
            // For date ranges: Calculate width + add radius on both ends to create circular caps
            return Math.max(
              xScale(d.realTime[1]) -
                xScale(d.realTime[0]) +
                TIME_CONFIG.point.radius * 2,
              TIME_CONFIG.point.radius * 2 // Minimum size
            );
          }
          // For single dates or no dates, use constant size
          return TIME_CONFIG.point.radius * 2;
        })
        .attr("height", TIME_CONFIG.point.radius * 2)
        .attr("rx", TIME_CONFIG.point.radius)
        .attr("ry", TIME_CONFIG.point.radius)
        .attr("fill", (d) => getNodetColor(d))
        .attr("stroke", (d) =>
          isEventMarked(d.event.index) ? TIME_CONFIG.highlight.color : "black"
        )
        .attr("stroke-width", (d) =>
          isEventMarked(d.event.index) ? 2 : TIME_CONFIG.point.strokeWidth
        )
        .attr("stroke-dasharray", (d) => (d.hasRealTime ? "none" : "2,2"))
        .style("cursor", "pointer")
        .attr("data-event-index", (d) => d.event.index)
        .attr("data-has-real-time", (d) => d.hasRealTime)
        .on("mouseenter", handleNodeInteraction.mouseEnter)
        .on("mouseleave", handleNodeInteraction.mouseLeave)
        .on("click", handleNodeInteraction.click);
    },
    [
      focusedEventId,
      setfocusedEventId,
      markedEventIds,
      toggleMarkedEvent,
      isEventMarked,
    ]
  );

  // Function to handle background click
  const handleBackgroundClick = useCallback(() => {
    // Deselect any selected event
    setfocusedEventId(null);
  }, [setfocusedEventId]);

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

    // Process data points
    const { dataPoints } = processEvents(events);
    const sortedPoints = getSortedPoints(dataPoints);

    // Calculate dimensions - get the main container height (the one with overflow-auto)
    const mainContainer = containerRef.current.closest(
      ".overflow-auto"
    ) as HTMLElement;
    const availableHeight = mainContainer
      ? mainContainer.clientHeight - TIME_CONFIG.header.height
      : window.innerHeight - TIME_CONFIG.header.height - 100; // fallback with some margin

    const { containerWidth, containerHeight, width, height } =
      getTimeDimensions(
        containerRef.current.clientWidth,
        availableHeight,
        events.length
      );

    // Create scales
    const publishDate = new Date(metadata.publishDate);
    const { xScale, yScale } = getScales(dataPoints, width, height);
    const publishX = xScale(publishDate);

    // Setup SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", containerWidth)
      .attr("height", containerHeight);

    // Add arrow marker definition
    const defs = svg.append("defs");
    defs
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", SHARED_CONFIG.arrow.viewBox)
      .attr("refX", SHARED_CONFIG.arrow.refX)
      .attr("refY", SHARED_CONFIG.arrow.refY)
      .attr("markerWidth", SHARED_CONFIG.arrow.width)
      .attr("markerHeight", SHARED_CONFIG.arrow.height)
      .attr("orient", "auto")
      .append("path")
      .attr("d", SHARED_CONFIG.arrow.path)
      .attr("fill", TIME_CONFIG.track.color)
      .attr("opacity", TIME_CONFIG.track.opacity);

    // Create header
    const headerContainer = d3
      .select(headerRef.current)
      .style("width", `${containerWidth}px`);

    const headerContent = headerContainer
      .append("div")
      .style("margin-left", `${TIME_CONFIG.margin.left}px`)
      .style("width", `${width}px`);

    // Create axes
    const { xAxis, yAxis } = createAxes(xScale, yScale);

    // Add x-axis to header
    const headerSvg = headerContent
      .append("svg")
      .attr("width", width + TIME_CONFIG.margin.right)
      .attr("height", "40")
      .style("overflow", "visible");

    headerSvg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,30)`)
      .call(xAxis)
      .style("font-size", `${TIME_CONFIG.axis.fontSize}px`)
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke", "#94a3b8"));

    headerSvg
      .append("text")
      .attr("class", "x-axis-label")
      .attr("x", -TIME_CONFIG.margin.left + 50)
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .attr("fill", "#64748b")
      .style("font-size", "12px")
      .style("font-weight", "500")
      .text("Real Time →");

    // Create main group with proper margins
    const g = svg
      .append("g")
      .attr(
        "transform",
        `translate(${TIME_CONFIG.margin.left},${TIME_CONFIG.margin.top})`
      );

    // Add square grid background aligned with y-axis ticks and square cells
    const gridGroup = g.append("g").attr("class", "background-grid");
    const yTicks = yScale.ticks();
    // Draw horizontal grid lines at y-axis ticks
    yTicks.forEach((tick) => {
      const y = yScale(tick);
      gridGroup
        .append("line")
        .attr("x1", 0)
        .attr("y1", y)
        .attr("x2", width)
        .attr("y2", y)
        .attr("stroke", "#e5e7eb")
        .attr("stroke-width", 1);
    });
    // Calculate y-tick pixel spacing for square grid
    let yTickSpacing = 0;
    if (yTicks.length > 1) {
      yTickSpacing = Math.abs(yScale(yTicks[1]) - yScale(yTicks[0]));
    }
    // Draw vertical grid lines at intervals matching y-tick spacing
    if (yTickSpacing > 0) {
      for (let x = 0; x <= width; x += yTickSpacing) {
        gridGroup
          .append("line")
          .attr("x1", x)
          .attr("y1", 0)
          .attr("x2", x)
          .attr("y2", height)
          .attr("stroke", "#e5e7eb")
          .attr("stroke-width", 1);
      }
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
    renderGuideLines(g, width, height);

    // Add y-axis
    g.append("g")
      .attr("class", "y-axis")
      .call(yAxis)
      .style("font-size", `${TIME_CONFIG.axis.fontSize}px`)
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke", "#94a3b8"))
      .append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -60)
      .attr("fill", "#64748b")
      .attr("text-anchor", "middle")
      .text("← Paragraph");

    // Helper function to calculate shortened line endpoints
    const getPointPosition = (point: DataPoint) => {
      const x = point.hasRealTime
        ? getXPosition(xScale, point.realTime)
        : publishX;
      const y = yScale(point.narrativeTime);
      return { x, y };
    };

    const shortenLineToNode = (
      start: { x: number; y: number },
      end: { x: number; y: number },
      endRadius: number
    ) => {
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= endRadius) return { x: start.x, y: start.y };

      const shortenDistance = endRadius + 3; // Stop 3px before the node edge
      const ratio = (distance - shortenDistance) / distance;

      return {
        x: start.x + dx * ratio,
        y: start.y + dy * ratio,
      };
    };

    // Add narrative line segments with smart arrow positioning
    const lineGroup = g.append("g").attr("class", "line-group");

    // Helper to get the latest date (end) for a point
    function getLatestDate(point: DataPoint) {
      if (point.hasRealTime && Array.isArray(point.realTime)) {
        return point.realTime[1];
      }
      return point.realTime;
    }
    // Helper to get the earliest date (start) for a point
    function getEarliestDate(point: DataPoint) {
      if (point.hasRealTime && Array.isArray(point.realTime)) {
        return point.realTime[0];
      }
      return point.realTime;
    }

    // Create individual segments between consecutive points
    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const startPoint = sortedPoints[i];
      const endPoint = sortedPoints[i + 1];

      // Use latest date for start, earliest date for end
      const latestDate = getLatestDate(startPoint);
      const earliestDate = getEarliestDate(endPoint);
      const start = {
        x:
          startPoint.hasRealTime && latestDate instanceof Date
            ? xScale(latestDate)
            : publishX,
        y: yScale(startPoint.narrativeTime),
      };
      const end = {
        x:
          endPoint.hasRealTime && earliestDate instanceof Date
            ? xScale(earliestDate)
            : publishX,
        y: yScale(endPoint.narrativeTime),
      };

      // Calculate shortened end position to avoid covering the target node
      const nodeRadius = TIME_CONFIG.point.radius;
      const shortenedEnd = shortenLineToNode(start, end, nodeRadius);

      lineGroup
        .append("line")
        .attr("class", `narrative-line-segment segment-${i}`)
        .attr("x1", start.x)
        .attr("y1", start.y)
        .attr("x2", shortenedEnd.x)
        .attr("y2", shortenedEnd.y)
        .attr("stroke", TIME_CONFIG.track.color)
        .attr("stroke-width", TIME_CONFIG.track.strokeWidth)
        .attr("stroke-opacity", TIME_CONFIG.track.opacity)
        .attr("stroke-linecap", "round")
        .attr("marker-end", "url(#arrow)");
    }

    // Create labels group
    const labelsGroup = g.append("g").attr("class", "labels");

    // Create points group
    const pointsGroup = g.append("g").attr("class", "points-group");

    // Add points with interactions
    handlePointInteractions(
      pointsGroup,
      dataPoints,
      labelsGroup,
      xScale,
      yScale,
      publishX
    );

    // Add background click handler
    svg.on("click", function (e) {
      // Check if the click was on the background (not on any event node)
      const target = e.target as SVGElement;
      if (target.tagName === "svg" || target.classList.contains("background")) {
        handleBackgroundClick();
      }
    });

    // Apply selection if it exists
    if (focusedEventId !== null && focusedEventId !== undefined) {
      updateSelectedEventStyles();
    }
  }, [
    events,
    metadata,
    focusedEventId,
    setfocusedEventId,
    markedEventIds,
    isEventMarked,
    toggleMarkedEvent,
    updateSelectedEventStyles,
    renderGuideLines,
    handlePointInteractions,
    handleBackgroundClick,
  ]);

  // Apply selection styles when selection changes
  useEffect(() => {
    if (svgRef.current) {
      updateSelectedEventStyles();
    }
  }, [focusedEventId, updateSelectedEventStyles]);

  // Initial setup and resize handling
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(updateVisualization);
    });

    resizeObserver.observe(containerRef.current);
    resizeObserverRef.current = resizeObserver;

    updateVisualization();

    return () => {
      resizeObserverRef.current?.disconnect();
    };
  }, [updateVisualization]);

  return (
    <div className="w-full h-full overflow-hidden">
      <div className="min-w-fit">
        <div
          ref={headerRef}
          style={{ height: `${TIME_CONFIG.header.height}px` }}
          className="bg-white sticky top-0 z-10 shadow-sm"
        />
      </div>
      <div ref={containerRef} className="flex-1 relative">
        <svg ref={svgRef} className="min-w-full min-h-full" />
      </div>
    </div>
  );
}
