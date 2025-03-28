import { merge } from "lodash";
import { SHARED_CONFIG } from "@/components/features/narrative/shared/visualization-config";

export const TOPIC_CONFIG = merge({}, SHARED_CONFIG, {
  // Topic-specific edge styling
  edge: {
    strokeWidth: 2, // Width of edges in topic visualization
    opacity: 0.4, // Default opacity for edges
    dashArray: "3,3", // Dash pattern for topic visualization edges
    minOpacity: 0.2, // Minimum opacity for edges
    maxOpacity: 0.8, // Maximum opacity for edges when highlighted
  },
  // Topic line styling
  topic: {
    lineStrokeWidth: 6, // Width of topic horizontal guide lines
    lineOpacity: 0.3, // Default opacity for topic lines
    lineHighlightOpacity: 0.8, // Opacity for highlighted topic lines
    lineHighlightStrokeWidth: 2, // Stroke width for highlighted lines
    lineDashArray: "3,3", // Dash pattern for topic lines
    lineColor: "#94a3b8", // Default color for topic lines
  },
});
