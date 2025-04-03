export const SHARED_CONFIG = {
  // Margin settings for all visualizations
  margin: {
    top: 30,
    right: 40,
    bottom: 20,
    left: 140,
  },
  // Axis configuration
  axis: {
    tickSize: 5, // Size of axis tick marks in pixels
    tickPadding: 8, // Distance between tick and label (standardized from values 5-10)
    labelOffset: 45, // Offset for axis labels
    fontSize: 12, // Font size for axis labels
    narrativeAxisTickGap: 1, // Controls gap between narrative y-axis ticks (1 = every integer)
  },
  //
  track: {
    strokeWidth: 6,
    opacity: 0.3,
    highlightOpacity: 0.8,
    highlightStrokeWidth: 2,
    dashArray: "3,3",
    color: "#94a3b8",
  },
  // Animation timing
  animation: {
    duration: 200, // Duration of transitions in milliseconds
  },
  highlight: {
    color: "#3b82f6",
  },
  // Header settings
  header: {
    height: 50, // Height of the header area in pixels
  },
  // Minimum height for visualizations
  minHeight: 800,
  // Point/node styling
  point: {
    radius: 6, // Default radius for points
    strokeWidth: 2, // Default stroke width for points
    hoverRadius: 9, // Radius when hovering
    hoverStrokeWidth: 3, // Stroke width when hovering
  },
  // Edge/connector styling
  edge: {
    strokeWidth: 1.5, // Width of connecting edges
    opacity: 0.4, // Default opacity for edges
    dashArray: "4,4", // Dash pattern for dashed lines
  },
  // Scale settings
  scale: {
    timeExponent: 3, // Power scale exponent for time distribution
  },
  // Responsive layout settings
  responsive: {
    // Content-based dimensions
    content: {
      minEntityWidth: 40, // Minimum width per entity
      entityGap: 10, // Gap between entities
      eventHeight: 40, // Height per event
      minEventGap: 5, // Minimum gap between events
    },
    // Container-based dimensions
    container: {
      minWidth: 600, // Minimum container width
      minHeight: 400, // Minimum container height
      maxWidth: 2000, // Maximum container width
      maxHeight: 2000, // Maximum container height
    },
  },
};
