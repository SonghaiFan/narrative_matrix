import { merge } from "lodash";
import { SHARED_CONFIG } from "@/components/visualisation/shared/visualization-config";

export const TOPIC_CONFIG = merge({}, SHARED_CONFIG, {
  margin: {
    right: 60, // Reduced right margin compared to shared config
  },
});
