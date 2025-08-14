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
    strokeWidth: 4,
    opacity: 1,
    dashArray: "3,3",
    color: "#dee3ea",
  },
  // Arrow marker configuration
  arrow: {
    width: 3, // Width of arrow markers
    height: 3, // Height of arrow markers
    refX: 5, // Reference X position for arrow placement
    refY: 0, // Reference Y position for arrow placement
    viewBox: "0 -3 6 6", // ViewBox for arrow shape
    path: "M0,-3L6,0L0,3", // SVG path for arrow shape
  },

  highlight: {
    color: "#3b82f6",
  },
  // Header settings
  header: {
    height: 40, // Height of the header area in pixels
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
    timeExponent: 2, // Power scale exponent for time distribution
  },
};
