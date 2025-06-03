import { merge } from "lodash";
import { SHARED_CONFIG } from "@/components/features/narrative/shared/visualization-config";

export const TIME_CONFIG = merge({}, SHARED_CONFIG, {
  margin: {
    left: 80, // Reduced left margin compared to shared config
    right: 40, // Reduced right margin compared to shared config
  },
  // Override minHeight to always use content-based height
  minHeight: 0,
});
