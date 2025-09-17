"use client";

import { NarrativeEvent } from "@/types/lite";
import { useEffect, useRef, useCallback, useState } from "react";
import * as d3 from "d3";
import { ENTITY_CONFIG } from "./entity-config";
import { useTooltip } from "@/contexts/tooltip-context";
import { useCenterControl } from "@/contexts/center-control-context";
import {
  getEntityDimensions,
  calculateColumnLayout,
  createXScale,
  createYScale,
  createYAxis,
  addEventGroupHoverEffects,
  buildEntityColumnData,
  EntityColumn,
} from "./entity-visual-utils";
import { createEventNode } from "./entity-visual-utils";

export interface EntityVisualProps {
  events: NarrativeEvent[];
  selectedAttribute?: string;
}

export function EntityVisual({
  events,
  selectedAttribute = "name",
}: EntityVisualProps) {
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

      // Reset all nodes and connectors to default style
      d3.select(svgRef.current)
        .selectAll(".event-node")
        .attr("stroke", "black");

      d3.select(svgRef.current)
        .selectAll(".connector-outer")
        .attr("stroke", "#000");

      // Get guide lines group
      const guideLine = d3.select(svgRef.current).select(".guide-lines");

      // Hide guide line by default
      guideLine.style("display", "none");

      // If we have a selected event, highlight it and show guide line
      if (newSelectedId !== null) {
        const selectedGroup = d3
          .select(svgRef.current)
          .select(`.event-group-${newSelectedId}`);

        if (!selectedGroup.empty()) {
          // Update node style in the group
          selectedGroup
            .selectAll(".event-node")
            .attr("stroke", ENTITY_CONFIG.highlight.color);

          // Update outer connector style in the group
          selectedGroup
            .selectAll(".connector-outer")
            .attr("stroke", ENTITY_CONFIG.highlight.color);

          // Get the selected node
          const node = selectedGroup
            .select(".event-node")
            .node() as SVGCircleElement;
          let y = 0;

          // Determine absolute Y position by combining group translate and node position
          const groupTransform = selectedGroup.attr("transform") || "";
          const translateMatch = /translate\(\s*[^,]+,\s*([^)]+)\)/.exec(
            groupTransform
          );
          const groupY = translateMatch ? parseFloat(translateMatch[1]) : 0;
          const nodeY = parseFloat(node.getAttribute("cy") || "0");
          y = groupY + nodeY;

          // Update guide line position and show it
          guideLine
            .style("display", "block")
            .select(".horizontal")
            .attr("y1", y)
            .attr("y2", y);

          // Store the selected node in the ref
          selectedNodeRef.current = node;

          // Always scroll into view when an event is selected
          // This ensures that when selectedEventId changes, the view scrolls to the selected node
          selectedNodeRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }
    },
    []
  );

  // Function to update node styles based on selectedTrackId
  const updateSelectedTrackStyles = useCallback(
    (trackId: string | null, selectedEventId: number | null) => {
      if (!svgRef.current || trackId === null) return;

      // Find all nodes associated with the selected track using the data-entity-id attribute
      const selectedNodes = d3
        .select(svgRef.current)
        .selectAll(".event-node")
        .filter(function () {
          // Get the entity ID from the node
          const entityId = d3.select(this).attr("data-entity-id");
          return entityId === trackId;
        });

      // Apply highlight border to all nodes on the selected track
      // but skip the selected event node
      selectedNodes
        .filter(function () {
          const eventIndex = d3.select(this).attr("data-event-index");
          return eventIndex !== String(selectedEventId);
        })
        .attr("stroke", ENTITY_CONFIG.highlight.color)
        .attr("stroke-width", ENTITY_CONFIG.point.strokeWidth * 1.5);
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
    const currentTrackSelection = selectedTrackId;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();
    const { containerHeight, height } = getEntityDimensions(
      containerRef.current.clientWidth,
      events.length
    );

    const { columns, rows } = buildEntityColumnData(events, selectedAttribute);

    const activeTrackKey =
      currentTrackSelection !== null &&
      columns.some((column) => column.key === currentTrackSelection)
        ? currentTrackSelection
        : null;

    if (activeTrackKey === null && currentTrackSelection !== null) {
      setSelectedTrackId(null);
    }

    const { totalColumnsWidth } = calculateColumnLayout(
      containerRef.current.clientWidth,
      columns.length
    );

    const xScale = createXScale(columns, totalColumnsWidth);
    const yScale = createYScale(events, height);
    const yAxis = createYAxis(yScale);

    const headerWidth =
      totalColumnsWidth +
      ENTITY_CONFIG.margin.left +
      ENTITY_CONFIG.margin.right;

    const headerContainer = d3
      .select(headerRef.current)
      .style("width", `${headerWidth}px`)
      .style("height", `${ENTITY_CONFIG.header.height}px`);

    if (!headerContainer.select("div.entity-header-content").node()) {
      headerContainer.selectAll("*").remove();
    }

    const headerContent = headerContainer
      .selectAll<HTMLDivElement, null>("div.entity-header-content")
      .data([null])
      .join("div")
      .attr("class", "entity-header-content relative")
      .style("position", "relative")
      .style("margin-left", `${ENTITY_CONFIG.margin.left}px`)
      .style("width", `${totalColumnsWidth}px`)
      .style("height", `${ENTITY_CONFIG.header.height}px`);

    const computeLabelLeft = (columnKey: string) =>
      (xScale(columnKey) || 0) + xScale.bandwidth() / 2;

    const getColumnTitle = (column: EntityColumn) => {
      if (!selectedAttribute || selectedAttribute === "name") {
        return column.label;
      }
      const names = Array.from(
        new Set(
          column.entities
            .map((entity) => entity.name || entity.id)
            .filter(Boolean)
        )
      );
      if (names.length === 0) {
        return column.label;
      }
      const preview = names.slice(0, 5).join(", ");
      return `${column.label} (${names.length}) - ${
        names.length > 5 ? `${preview}…` : preview
      }`;
    };

    const labelTextClass = (columnKey: string) =>
      [
        "entity-label-text",
        "font-semibold",
        "text-xs",
        activeTrackKey === columnKey ? "text-blue-600" : "text-gray-700",
        "text-center",
        "break-words",
        "leading-tight",
        "line-clamp-3",
        "transition-colors",
        "duration-200",
        "hover:text-blue-600",
      ].join(" ");

    const labels = headerContent
      .selectAll<HTMLDivElement, EntityColumn>("div.entity-label")
      .data(columns, (d: any) => d.key);

    labels.exit().transition().style("opacity", 0).remove();

    const labelsEnter = labels
      .enter()
      .append("div")
      .attr("class", "entity-label absolute -translate-x-1/2 cursor-pointer")
      .style("opacity", 0)
      .style("left", (d) => `${computeLabelLeft(d.key)}px`)
      .style("max-width", () => `${xScale.bandwidth()}px`);

    labelsEnter
      .append("div")
      .attr("class", (d) => labelTextClass(d.key))
      .attr("title", (d) => getColumnTitle(d))
      .text((d) => d.label);

    const labelsMerge = labelsEnter.merge(labels as any);

    labelsMerge
      .style("max-width", () => `${xScale.bandwidth()}px`)
      .on("click", (_event, column) => {
        setSelectedTrackId((prev) => (prev === column.key ? null : column.key));
      });

    labelsMerge
      .select<HTMLDivElement>("div.entity-label-text")
      .attr("class", (d) => labelTextClass(d.key))
      .attr("title", (d) => getColumnTitle(d))
      .text((d) => d.label);

    labelsMerge
      .transition()
      .duration(400)
      .ease(d3.easeCubicOut)
      .style("left", (d) => `${computeLabelLeft(d.key)}px`)
      .style("opacity", 1);

    const headerBarHeight = ENTITY_CONFIG.header.height * 0.7;
    const separatorTop = (ENTITY_CONFIG.header.height - headerBarHeight) / 2;

    const separators = headerContent
      .selectAll<HTMLDivElement, EntityColumn>("div.entity-separator")
      .data(columns.slice(0, -1), (d: any) => d.key);

    separators.exit().transition().style("opacity", 0).remove();

    const separatorsEnter = separators
      .enter()
      .append("div")
      .attr("class", "entity-separator absolute")
      .style("width", "1px")
      .style("opacity", 0)
      .style("background-color", "#cbd5e1")
      .style("pointer-events", "none");

    const separatorsMerge = separatorsEnter.merge(separators as any);

    separatorsMerge
      .style("top", `${separatorTop}px`)
      .style("height", `${headerBarHeight}px`)
      .style("pointer-events", "none")
      .transition()
      .duration(400)
      .ease(d3.easeCubicOut)
      .style("left", (d) => `${(xScale(d.key) || 0) + xScale.bandwidth()}px`)
      .style("opacity", 0.6);

    const svg = d3
      .select(svgRef.current)
      .attr("width", headerWidth)
      .attr("height", containerHeight)
      .style("overflow", "visible");

    const g = svg
      .append("g")
      .attr(
        "transform",
        `translate(${ENTITY_CONFIG.margin.left},${ENTITY_CONFIG.margin.top})`
      );

    columns.forEach((column) => {
      const xCenter = (xScale(column.key) || 0) + xScale.bandwidth() / 2;
      g.append("line")
        .attr("class", "entity-track")
        .attr("data-column-key", column.key)
        .attr("x1", xCenter)
        .attr("x2", xCenter)
        .attr("y1", 0)
        .attr("y2", height)
        .attr(
          "stroke",
          activeTrackKey === column.key
            ? ENTITY_CONFIG.highlight.color
            : ENTITY_CONFIG.track.color
        )
        .attr(
          "stroke-width",
          activeTrackKey === column.key
            ? ENTITY_CONFIG.track.strokeWidth * 1.5
            : ENTITY_CONFIG.track.strokeWidth
        )
        .attr("opacity", activeTrackKey === column.key ? 0.8 : 0.3);
    });

    const guideLine = g
      .append("g")
      .attr("class", "guide-lines")
      .style("display", "none");

    guideLine
      .append("line")
      .attr("class", "guide-line horizontal")
      .attr("x1", 0)
      .attr("x2", totalColumnsWidth)
      .attr("stroke", ENTITY_CONFIG.highlight.color)
      .attr("stroke-width", 2);

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
      .text("Paragraph Index");

    rows.forEach((row) => {
      if (row.nodes.length === 0) {
        return;
      }

      const eventY = yScale(row.event.temporal_anchoring.narrative_time);
      const eventGroup = g
        .append("g")
        .attr("class", `event-group event-group-${row.event.index}`)
        .attr("transform", `translate(0, ${eventY})`);

      const connectorSegments: Array<{ x1: number; x2: number }> = [];
      const connectorsGroup = eventGroup
        .append("g")
        .attr("class", "event-connectors")
        .style("pointer-events", "stroke");
      const nodesGroup = eventGroup.append("g").attr("class", "event-nodes");
      const connectorWidth = ENTITY_CONFIG.event.connectorStrokeWidth;
      const innerWidth =
        connectorWidth * ENTITY_CONFIG.event.innerConnectorScale;

      for (let i = 0; i < row.nodes.length - 1; i++) {
        const current = row.nodes[i];
        const next = row.nodes[i + 1];
        const x1 = (xScale(current.columnKey) || 0) + xScale.bandwidth() / 2;
        const x2 = (xScale(next.columnKey) || 0) + xScale.bandwidth() / 2;
        connectorSegments.push({ x1, x2 });

        connectorsGroup
          .append("line")
          .attr("class", "connector-outer")
          .attr("x1", x1)
          .attr("y1", 0)
          .attr("x2", x2)
          .attr("y2", 0)
          .attr("stroke", "#000")
          .attr("stroke-width", connectorWidth)
          .attr("stroke-linecap", "round");
      }

      connectorSegments.forEach(({ x1, x2 }) => {
        connectorsGroup
          .append("line")
          .attr("class", "connector-inner")
          .attr("x1", x1)
          .attr("y1", 0)
          .attr("x2", x2)
          .attr("y2", 0)
          .attr("stroke", "#fff")
          .attr("stroke-width", innerWidth)
          .attr("stroke-linecap", "round");
      });

      const firstNode = row.nodes[0];
      const lastNode = row.nodes[row.nodes.length - 1];
      const leftBound =
        (xScale(firstNode.columnKey) || 0) - xScale.bandwidth() * 0.15;
      const rightBound =
        (xScale(lastNode.columnKey) || 0) + xScale.bandwidth() * 1.15;

      eventGroup
        .insert("rect", ":first-child")
        .attr("class", "event-hit-area")
        .attr("x", leftBound)
        .attr("y", -ENTITY_CONFIG.point.radius * 1.8)
        .attr("width", rightBound - leftBound)
        .attr("height", ENTITY_CONFIG.point.radius * 3.6)
        .style("fill", "transparent");

      row.nodes.forEach((node) => {
        const xCenter = (xScale(node.columnKey) || 0) + xScale.bandwidth() / 2;

        createEventNode(
          nodesGroup,
          xCenter,
          0,
          row.event,
          selectedEventId,
          node.columnKey
        );

        if (node.count > 1) {
          nodesGroup
            .append("text")
            .attr("class", "event-node-count")
            .attr("x", xCenter)
            .attr("y", 0)
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .attr("fill", "#1f2933")
            .attr("font-size", "9px")
            .style("pointer-events", "none")
            .text(node.count);
        }
      });

      addEventGroupHoverEffects(
        eventGroup as d3.Selection<SVGGElement, unknown, null, undefined>,
        row.event,
        showTooltip,
        updatePosition,
        hideTooltip,
        setSelectedEventId,
        selectedEventId
      );
    });

    if (currentSelection !== null && currentSelection !== undefined) {
      updateSelectedEventStyles(currentSelection);
    }

    if (activeTrackKey !== null) {
      setSelectedTrackId(activeTrackKey);
      updateSelectedTrackStyles(activeTrackKey, currentSelection);
    }
  }, [
    events,
    selectedAttribute,
    showTooltip,
    hideTooltip,
    updatePosition,
    setSelectedEventId,
    selectedEventId,
    updateSelectedEventStyles,
    selectedTrackId,
    setSelectedTrackId,
    updateSelectedTrackStyles,
  ]);

  // Keep selection handling in a separate effect
  useEffect(() => {
    if (svgRef.current && selectedEventId !== undefined) {
      updateSelectedEventStyles(selectedEventId);

      // If a track is also selected, apply track styling after event styling
      if (selectedTrackId !== null) {
        updateSelectedTrackStyles(selectedTrackId, selectedEventId);
      }
    }
  }, [
    selectedEventId,
    updateSelectedEventStyles,
    selectedTrackId,
    updateSelectedTrackStyles,
  ]);

  // Add effect to highlight nodes on selected track
  useEffect(() => {
    if (!svgRef.current) return;

    // Reset all nodes to default stroke style
    d3.select(svgRef.current)
      .selectAll(".event-node")
      .attr("stroke", "black")
      .attr("stroke-width", ENTITY_CONFIG.point.strokeWidth);

    // If a track is selected, apply track styling
    if (selectedTrackId !== null) {
      updateSelectedTrackStyles(selectedTrackId, selectedEventId);
    }
  }, [selectedTrackId, selectedEventId, updateSelectedTrackStyles]);

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
      className="w-full h-full overflow-scroll"
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
