import { merge } from "lodash";
import { SHARED_CONFIG } from "@/components/features/narrative/shared/visualization-config";

export const TIME_CONFIG = merge({}, SHARED_CONFIG, {
  // Time visualization specific curve settings
  curve: {
    strokeWidth: 6, // Width of the narrative timeline curve
    opacity: 0.2, // Opacity of the narrative timeline curve
  },
});
