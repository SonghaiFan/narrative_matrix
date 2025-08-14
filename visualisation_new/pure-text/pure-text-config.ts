import { merge } from "lodash";
import { SHARED_CONFIG } from "@/visualisation_new/shared/visualization-config";

// Merge with SHARED_CONFIG but don't override header settings
export const PURE_TEXT_CONFIG = merge({}, SHARED_CONFIG, {
  // Override margins for text view
  margin: {
    top: 16, // Reduced top margin for text view
    bottom: 16, // Reduced bottom margin for text view
  },
  // Text-specific styling
  text: {
    cardSpacing: 0, // Spacing between text cards
    cardPadding: 12, // Padding within text cards
    maxWidth: 500, // Maximum width for text content
    // Font sizes for different text elements
    fontSize: {
      title: 18, // Size for titles
      content: 17, // Size for main content
      meta: 12, // Size for metadata
    },
    // Color scheme for text view
    colors: {
      mainTopic: "#1d4ed8", // Color for main topics
      subTopic: "#4b5563", // Color for subtopics
      selected: "#eff6ff", // Background for selected items
      hover: "#f8fafc", // Background for hover state
      entityHighlight: "#374151", // Color for highlighted entities
      // Topic tag styling
      topicTag: {
        background: "#1d4ed8", // Background for topic tags
        text: "#ffffff", // Text color for topic tags
        backgroundHover: "#1e40af", // Background for topic tags on hover
      },
    },
    iconSize: 14, // Size for icons
    // Topic tag dimensions
    topicTag: {
      width: 70, // Width of topic tags
      height: 22, // Height of topic tags
    },
  },
});
