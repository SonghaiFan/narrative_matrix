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
    labelFontSize: 14, // Font size for entity labels
    lineStrokeWidth: 6, // Width of entity vertical guide lines
    columnPadding: 0.2, // Padding within entity columns
    columnWidth: 40, // Width of entity columns
    columnGap: 10, // Gap between entity columns
  },
  // Event node styling
  event: {
    nodeRadius: 6, // Radius of event nodes
    nodeStrokeWidth: 2, // Stroke width of event nodes
    connectorStrokeWidth: 3, // Width of connectors between nodes
    labelFontSize: 8, // Font size for event labels
  },
});
