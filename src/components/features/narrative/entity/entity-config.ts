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
    columnPadding: 0.1, // Padding within entity columns
    columnWidth: 50, // Width of entity columns
    columnGap: 10, // Gap between entity columns
  },
});
