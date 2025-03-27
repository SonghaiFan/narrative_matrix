export const SHARED_CONFIG = {
  margin: {
    top: 30,
    right: 40,
    bottom: 20,
    left: 120,
  },
  axis: {
    tickSize: 5,
    tickPadding: 10,
    labelOffset: 45,
    fontSize: 12,
  },
  animation: {
    duration: 200,
  },
  header: {
    height: 40,
  },
  minHeight: 800,
  point: {
    radius: 6,
    strokeWidth: 2,
    hoverRadius: 9,
    hoverStrokeWidth: 3,
  },
  edge: {
    strokeWidth: 1.5,
    opacity: 0.4,
    dashArray: "4,4",
  },
  scale: {
    timeExponent: 3.6, // Power scale exponent for time distribution
  },
  responsive: {
    // Content-based dimensions
    content: {
      minEntityWidth: 40, // Minimum width per entity
      entityGap: 10, // Gap between entities
      eventHeight: 20, // Height per event
      minEventGap: 5, // Minimum gap between events
    },
    // Container-based dimensions
    container: {
      minWidth: 600, // Minimum container width
      minHeight: 400, // Minimum container height
      maxWidth: 2000, // Maximum container width
      maxHeight: 2000, // Maximum container height
    },
    // Alignment settings
    alignment: {
      entityTimeGap: 20, // Gap between entity and time visualizations
      timeTopicGap: 20, // Gap between time and topic visualizations
      sharedYScale: true, // Whether to share y-scale between entity and time
      sharedXScale: true, // Whether to share x-scale between time and topic
    },
  },
};
