import { merge } from "lodash";
import { SHARED_CONFIG } from "@/components/shared/visualization-config";

export const ENTITY_CONFIG = merge({}, SHARED_CONFIG, {
  margin: {
    left: 60,
    right: 20,
  },
  entity: {
    labelFontSize: 14,
    lineStrokeWidth: 6,
    columnPadding: 0.2,
    columnWidth: 40,
    columnGap: 10,
  },
  event: {
    nodeRadius: 6,
    nodeStrokeWidth: 2,
    connectorStrokeWidth: 3,
    labelFontSize: 8,
  },
});
