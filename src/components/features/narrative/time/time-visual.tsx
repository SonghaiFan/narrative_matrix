"use client";

import { NarrativeEvent } from "@/types/narrative/lite";
import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import { TIME_CONFIG } from "./time-config";
import { useTooltip } from "@/contexts/tooltip-context";
import { useCenterControl } from "@/contexts/center-control-context";
import {
  LabelDatum,
  processEvents,
  getSortedPoints,
  getScales,
  createLabelData,
  createForceSimulation,
  calculateDimensions,
  createAxes,
  createLineGenerator,
} from "./time-visual.utils";
import {
  getSentimentColor,
  getHighlightColor,
} from "@/components/features/narrative/shared/color-utils";

interface TimeVisualProps {
  events: NarrativeEvent[];
  metadata: {
    publishDate: string;
  };
}

export function NarrativeTimeVisual({ events, metadata }: TimeVisualProps) {
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

      // Reset all points to default style
      d3.select(svgRef.current)
        .selectAll(".point")
        .each(function () {
          const point = d3.select(this);
          point
            .attr("stroke", "black")
            .attr("stroke-width", TIME_CONFIG.point.strokeWidth);
        });

      // Get guide lines group
      const guideLines = d3.select(svgRef.current).select(".guide-lines");

      // If we have a selected event, highlight it and show guide lines
      if (newSelectedId !== null && newSelectedId !== undefined) {
        // Use attribute selector to find all points with matching event index
        const selectedPoints = d3
          .select(svgRef.current)
          .selectAll(`.point[data-event-index="${newSelectedId}"]`);

        if (!selectedPoints.empty()) {
          // Update point style
          selectedPoints.attr("stroke", getHighlightColor());

          // Get the selected point's position
          const selectedPoint = selectedPoints.node() as SVGCircleElement;
          const cx = parseFloat(selectedPoint.getAttribute("cx") || "0");
          const cy = parseFloat(selectedPoint.getAttribute("cy") || "0");

          // Update guide lines position
          guideLines
            .style("display", "block")
            .select(".horizontal")
            .attr("y1", cy)
            .attr("y2", cy);

          guideLines.select(".vertical").attr("x1", cx).attr("x2", cx);

          // Store the selected node in the ref
          selectedNodeRef.current = selectedPoint;

          // Scroll the selected node into view
          if (selectedNodeRef.current) {
            selectedNodeRef.current.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }
      } else {
        // Hide guide lines when no point is selected
        guideLines.style("display", "none");
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

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();
    d3.select(headerRef.current).selectAll("*").remove();

    // Process data points
    const { dataPoints, leadTitlePoints } = processEvents(events);
    const sortedPoints = getSortedPoints(dataPoints);

    // Calculate dimensions
    const { containerWidth, containerHeight, width, height } =
      calculateDimensions(containerRef.current.clientWidth, events.length);

    // Create scales
    const publishDate = new Date(metadata.publishDate);
    const { xScale, yScale } = getScales(
      dataPoints,
      width,
      height,
      publishDate
    );

    // Create fixed header for x-axis
    const headerContainer = d3
      .select(headerRef.current)
      .style("width", `${containerWidth}px`)
      .style("margin-left", "0")
      .style("background-color", "white");

    // Create header content container
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

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", containerWidth)
      .attr("height", containerHeight);

    // Create main group with proper margins
    const g = svg
      .append("g")
      .attr(
        "transform",
        `translate(${TIME_CONFIG.margin.left},${TIME_CONFIG.margin.top})`
      );

    // Add vertical line for published date
    const publishX = xScale(publishDate);

    g.append("line")
      .attr("class", "publish-date-line")
      .attr("x1", publishX)
      .attr("x2", publishX)
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#64748b")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4,4")
      .attr("opacity", 0.6);

    // Add guide lines group first (so it's underneath everything)
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

    // Add vertical guide line
    guideLines
      .append("line")
      .attr("class", "guide-line vertical")
      .attr("y1", -TIME_CONFIG.margin.top)
      .attr("y2", height + TIME_CONFIG.margin.bottom + 1000)
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2);

    g.append("text")
      .attr("class", "publish-date-label")
      .attr("x", publishX)
      .attr("y", -8)
      .attr("text-anchor", "middle")
      .attr("fill", "#64748b")
      .attr("font-size", "10px")
      .text("Current");

    // Add y-axis
    g.append("g")
      .attr("class", "y-axis")
      .call(yAxis)
      .style("font-size", `${TIME_CONFIG.axis.fontSize}px`)
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke", "#94a3b8"));

    // Add lead titles
    const leadTitles = g
      .append("g")
      .attr("class", "lead-titles")
      .selectAll(".lead-title")
      .data(leadTitlePoints)
      .enter()
      .append("g")
      .attr("class", "lead-title-group");

    // Add dashed lines for lead titles
    leadTitles
      .append("line")
      .attr("class", "lead-title-line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", (d) => yScale(d.narrativeTime))
      .attr("y2", (d) => yScale(d.narrativeTime))
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4,4")
      .attr("opacity", 0.5);

    // Add lead title text with wrapping
    leadTitles.each(function (d) {
      const text = d3
        .select(this)
        .append("text")
        .attr("x", -TIME_CONFIG.margin.left + 10)
        .attr("y", yScale(d.narrativeTime))
        .attr("dy", "0.32em")
        .attr("text-anchor", "start")
        .attr("fill", "#64748b")
        .style("font-size", "12px")
        .style("font-weight", "500");

      const maxWidth = TIME_CONFIG.margin.left - 30;
      const words = (d.event.lead_title ?? "").split(/\s+/);
      let line: string[] = [];
      let lineNumber = 0;
      let tspan = text
        .append("tspan")
        .attr("x", -TIME_CONFIG.margin.left + 10)
        .attr("dy", 0);

      for (let word of words) {
        line.push(word);
        tspan.text(line.join(" "));

        if (tspan.node()!.getComputedTextLength() > maxWidth) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text
            .append("tspan")
            .attr("x", -TIME_CONFIG.margin.left + 10)
            .attr("dy", "1.1em")
            .text(word);
          lineNumber++;
        }
      }

      // Adjust vertical position to center multi-line text
      const totalHeight = lineNumber * 1.1;
      text
        .selectAll("tspan")
        .attr("dy", (_, i) => `${i === 0 ? -totalHeight / 2 : 1.1}em`);
    });

    // Create line generator
    const smoothLine = createLineGenerator(xScale, yScale);

    const lineGroup = g.append("g").attr("class", "line-group");

    // Add main line
    lineGroup
      .append("path")
      .datum(sortedPoints)
      .attr("class", "main-line")
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", TIME_CONFIG.curve.strokeWidth)
      .attr("stroke-opacity", TIME_CONFIG.curve.opacity)
      .attr("stroke-linecap", "round")
      .attr("d", smoothLine);

    // Create labels group first (so it's underneath)
    const labelsGroup = g.append("g").attr("class", "labels");

    // Create points group last (so it's on top)
    const pointsGroup = g.append("g").attr("class", "points-group");

    // Add points
    pointsGroup
      .selectAll(".point")
      .data(dataPoints)
      .enter()
      .append("circle")
      .attr("class", (d) => `point point-${d.index}`)
      .attr("cx", (d) => {
        if (d.hasRealTime) {
          if (Array.isArray(d.realTime)) {
            return xScale(d.realTime[0]);
          }
          return xScale(d.realTime!);
        }
        return publishX;
      })
      .attr("cy", (d) => yScale(d.narrativeTime))
      .attr("r", TIME_CONFIG.point.radius)
      .attr("fill", (d) => getSentimentColor(d.event.topic.sentiment.polarity))
      .attr("stroke", "black")
      .attr("stroke-width", TIME_CONFIG.point.strokeWidth)
      .attr("stroke-dasharray", (d) => (d.hasRealTime ? "none" : "2,2"))
      .style("cursor", "pointer")
      // Add data attributes for easy selection later - use the original event index
      .attr("data-event-index", (d) => d.event.index)
      .attr("data-has-real-time", (d) => d.hasRealTime)
      .on("mouseover", function (event, d) {
        // Only change size on hover, not color
        d3.select(this)
          .transition()
          .duration(150)
          .attr("r", TIME_CONFIG.point.hoverRadius);

        showTooltip(d.event, event.pageX, event.pageY, "time");
      })
      .on("mouseout", function (event, d) {
        const point = d3.select(this);
        // Only reset size on mouseout, not color
        point.transition().duration(150).attr("r", TIME_CONFIG.point.radius);

        // Only update label if point has real time
        if (d.hasRealTime) {
          // Find and reset corresponding label
          const label = labelsGroup.select(`.label-container-${d.index}`);

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

        // Hide tooltip
        hideTooltip();
      })
      .on("click", function (event, d) {
        // Toggle selection
        setSelectedEventId(
          d.event.index === selectedEventId ? null : d.event.index
        );
      });

    // Do NOT reapply selection here - it will be handled by the separate effect
  }, [events, metadata.publishDate]);

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
      window.requestAnimationFrame(() => {
        updateVisualization();
      });
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
    <div className="w-full h-full flex flex-col overflow-auto">
      <div className="flex-none bg-white sticky top-0 z-10 shadow-sm">
        <div
          ref={headerRef}
          style={{ height: `${TIME_CONFIG.header.height}px` }}
        />
      </div>
      <div ref={containerRef} className="flex-1 relative">
        <svg ref={svgRef} className="w-full h-full" />
      </div>
    </div>
  );
}
