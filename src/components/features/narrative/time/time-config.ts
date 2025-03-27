import { merge } from "lodash";
import { SHARED_CONFIG } from "@/components/features/narrative/shared/visualization-config";

export const TIME_CONFIG = merge({}, SHARED_CONFIG, {
  axis: {
    tickPadding: 5,
  },
  curve: {
    strokeWidth: 6,
    opacity: 0.2,
  },
});
