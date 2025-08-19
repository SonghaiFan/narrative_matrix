import { merge } from "lodash";
import { SHARED_CONFIG } from "@/components/features/narrative/shared/visualization-config";

// Extend shared config with topic-specific grouping parameters so they are adjustable centrally.
// gapPx: maximum horizontal gap (in px) between spans to merge into one parent group (all modes)
// proximityThreshold: legacy/general threshold (still available if needed elsewhere)
export const TOPIC_CONFIG = merge({}, SHARED_CONFIG, {
  grouping: {
    proximityThreshold: 18,
    main: { gapPx: 25 },
    sub: { gapPx: 25 },
    sentiment: { gapPx: 10 },
  },
});
