import { merge } from "lodash";
import { SHARED_CONFIG } from "@/components/features/narrative/shared/visualization-config";

// Merge with SHARED_CONFIG but don't override header settings
export const PURE_TEXT_CONFIG = merge({}, SHARED_CONFIG, {
  margin: {
    top: 16,
    bottom: 16,
  },
  text: {
    cardSpacing: 0,
    cardPadding: 12,
    maxWidth: 720,
    fontSize: {
      title: 18,
      content: 15,
      meta: 12,
    },
    colors: {
      mainTopic: "#1d4ed8",
      subTopic: "#4b5563",
      selected: "#eff6ff",
      hover: "#f8fafc",
      entityHighlight: "#374151",
      topicTag: {
        background: "#1d4ed8",
        text: "#ffffff",
        backgroundHover: "#1e40af",
      },
    },
    iconSize: 14,
    topicTag: {
      width: 70,
      height: 22,
    },
  },
});
