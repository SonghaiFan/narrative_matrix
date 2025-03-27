import { merge } from "lodash";
import { SHARED_CONFIG } from "@/components/features/narrative/shared/visualization-config";

export const TOPIC_CONFIG = merge({}, SHARED_CONFIG, {
  edge: {
    strokeWidth: 2,
    opacity: 0.4,
    dashArray: "3,3",
    minOpacity: 0.2,
    maxOpacity: 0.8,
  },
  topic: {
    lineStrokeWidth: 6,
    lineOpacity: 0.3,
    lineHighlightOpacity: 0.8,
    lineHighlightStrokeWidth: 2,
    lineDashArray: "3,3",
    lineColor: "#94a3b8",
  },
});
