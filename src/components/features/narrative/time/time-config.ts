import { merge } from "lodash";
import { SHARED_CONFIG } from "@/components/features/narrative/shared/visualization-config";

export const TIME_CONFIG = merge({}, SHARED_CONFIG, {
  margin: {
    left: 60, // Reduced left margin compared to shared config
    right: 20, // Reduced right margin compared to shared config
  },
});
