import { merge } from "lodash";
import { SHARED_CONFIG } from "@/visualisation_new/shared/visualization-config";

export const TIME_CONFIG = merge({}, SHARED_CONFIG, {
  margin: {
    left: 120, // Reduced left margin compared to shared config
    right: 80, // Reduced right margin compared to shared config
  },
  // Override minHeight to always use content-based height
  minHeight: 0,
});
