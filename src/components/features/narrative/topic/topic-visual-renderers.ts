import * as d3 from "d3";
import { TOPIC_CONFIG } from "./topic-config";
import { calculateGroupedPillMetrics } from "../shared/pill-component";
import { updateRectAndText } from "../shared/visualization-utils";

export interface PointState {
  x: number;
  y: number;
  isExpanded: boolean;
}

interface ApplySelectedEventStylesParams {
  svg: SVGSVGElement | null;
  selectedEventId: number | null;
  xScale?: any;
  showVerticalTimeGuides: boolean;
  getParentNodeId: (groupKey: string) => string;
}

export function applySelectedEventStyles({
  svg,
  selectedEventId,
  xScale,
  showVerticalTimeGuides,
  getParentNodeId,
}: ApplySelectedEventStylesParams) {
  if (!svg) return;

  d3.select(svg)
    .selectAll(".parent-point, .child-point-rect")
    .attr("stroke", "black")
    .attr("stroke-width", TOPIC_CONFIG.point.strokeWidth);

  const guideLine = d3.select(svg).select(".guide-lines");
  if (showVerticalTimeGuides) {
    guideLine.style("display", "none");
    guideLine.selectAll(".guide-line.vertical").style("display", "none");
    guideLine.selectAll(".guide-label").style("display", "none");
  }

  if (selectedEventId === null || selectedEventId === undefined) return;

  const highlightedParents = d3
    .select(svg)
    .selectAll(".parent-point")
    .filter(function () {
      return d3.select(this).attr("data-event-index") === String(selectedEventId);
    })
    .attr("stroke", TOPIC_CONFIG.highlight.color);

  const highlightedChildren = d3
    .select(svg)
    .selectAll(".child-point-rect")
    .filter(function () {
      return d3.select(this).attr("data-event-index") === String(selectedEventId);
    })
    .attr("stroke", TOPIC_CONFIG.highlight.color)
    .each(function () {
      const parentKey = d3.select(this).attr("data-parent-key");
      if (parentKey) {
        d3.select(`#${getParentNodeId(parentKey)}`)
          .select("rect")
          .attr("stroke", TOPIC_CONFIG.highlight.color);
      }
    });

  let selectedNode: SVGRectElement | null = null;
  if (!highlightedChildren.empty()) {
    selectedNode = highlightedChildren.node() as SVGRectElement;
  } else if (!highlightedParents.empty()) {
    selectedNode = highlightedParents.node() as SVGRectElement;
  }

  if (!showVerticalTimeGuides || !selectedNode || !xScale) return;

  const x = parseFloat(selectedNode.getAttribute("x") || "0");
  const width = parseFloat(selectedNode.getAttribute("width") || "0");
  const y = parseFloat(selectedNode.getAttribute("y") || "0");
  const height = parseFloat(selectedNode.getAttribute("height") || "0");
  const centerY = y + height / 2;
  const isDateRange = width > TOPIC_CONFIG.point.radius * 2 + 2;
  const rightEdgeX = isDateRange
    ? x + width - TOPIC_CONFIG.point.radius
    : x + width / 2;

  guideLine.style("display", "block");

  guideLine
    .select(".guide-line.horizontal")
    .style("display", "block")
    .attr("y1", centerY)
    .attr("y2", centerY);

  guideLine
    .select(".guide-line.vertical")
    .style("display", "block")
    .attr("x1", rightEdgeX)
    .attr("x2", rightEdgeX);

  const nodeData = d3.select(selectedNode).datum() as any;
  if (!nodeData) return;

  const startDate = nodeData.realTime || nodeData.points?.[0]?.realTime;
  if (!startDate || !xScale) return;

  if (Array.isArray(startDate)) {
    const [start, end] = startDate;
    const startX = xScale(start);
    const endX = xScale(end);

    guideLine
      .select(".guide-label.start")
      .style("display", "block")
      .attr("x", startX - 5)
      .text(start.toLocaleDateString());

    guideLine
      .select(".guide-label.end")
      .style("display", "block")
      .attr("x", endX + 5)
      .text(end.toLocaleDateString());

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
    const dateX = xScale(startDate);

    guideLine
      .select(".guide-label.start")
      .style("display", "block")
      .attr("x", dateX - 5)
      .text(startDate.toLocaleDateString());

    guideLine
      .select(".guide-line.vertical")
      .style("display", "block")
      .attr("x1", dateX)
      .attr("x2", dateX);
  }
}

interface CollapseExpandedGroupsParams {
  svg: SVGSVGElement | null;
  pointStates: Map<string, PointState>;
  getParentNodeId: (groupKey: string) => string;
}

export function collapseExpandedGroups({
  svg,
  pointStates,
  getParentNodeId,
}: CollapseExpandedGroupsParams) {
  if (!svg) return;

  d3.select(svg)
    .selectAll(".point-group")
    .each(function (d: any) {
      if (!d.isExpanded) return;

      d.isExpanded = false;

      if (d.key && pointStates.has(d.key)) {
        const state = pointStates.get(d.key);
        if (state) {
          pointStates.set(d.key, {
            ...state,
            isExpanded: false,
          });
        }
      }

      const parent = d3.select(this);
      const children = parent.selectAll(".child-point");
      const parentRect = parent.select("rect");
      const countText = parent.select("text");

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

      parentRect
        .style("pointer-events", "all")
        .style("cursor", "pointer");

      children
        .transition()
        .duration(200)
        .style("opacity", 0)
        .style("pointer-events", "none");
    });
}
