import { merge } from "lodash";
import { SHARED_CONFIG } from "@/components/features/narrative/shared/visualization-config";

export const ENTITY_CONFIG = merge({}, SHARED_CONFIG, {
  // Entity visualization specific margins
  margin: {
    left: 60, // Reduced left margin compared to shared config
    right: 20, // Reduced right margin compared to shared config
  },
  // Entity column styling
  entity: {
    columnPadding: 0.1, // Padding within entity columns
    columnWidth: 50, // Width of entity columns
    columnGap: 10, // Gap between entity columns
  },
  event: {
    connectorStrokeWidth: 6,
    hoverConnectorStrokeWidth: 18, // Stroke width when hovering
    innerConnectorScale: 0.85, // Scale factor for inner connector
  },
  // Metro track styling
  metro: {
    cornerRadius: 4, // Multiplier for point radius
    gridSize: 20, // Size of the grid for snapping
    minSegmentLength: 3, // Multiplier for corner radius
    preferredAngles: [0, 45, 90, 135, 180], // Preferred angles for track segments
    smoothing: true, // Whether to apply smoothing to corners
    curveScale: 1.2, // Scale factor for curve radius
    maxCurveRatio: 0.8, // Maximum ratio of curve radius to segment length
  },
});
