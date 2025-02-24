export const SHARED_CONFIG = {
  margin: {
    top: 30,
    right: 40,
    bottom: 20,
    left: 40,
  },
  axis: {
    tickSize: 5,
    tickPadding: 5,
    labelOffset: 40,
    fontSize: 12,
  },
  animation: {
    duration: 200,
  },
  header: {
    height: 40,
  },
  minHeight: 800,
};

export const ENTITY_COLORS = {
  agent: "#2563eb", // blue-600
  patient: "#dc2626", // red-600
  protagonist: "#059669", // emerald-600
  antagonist: "#9333ea", // purple-600
  secondary: "#ca8a04", // yellow-600
  expert: "#0891b2", // cyan-600
};

export const ENTITY_CONFIG = {
  ...SHARED_CONFIG,
  entity: {
    labelFontSize: 14,
    lineStrokeWidth: 6,
    columnPadding: 0.2,
  },
  event: {
    nodeRadius: 6,
    nodeStrokeWidth: 2,
    connectorStrokeWidth: 3,
    labelFontSize: 12,
  },
};

export const TIME_CONFIG = {
  margin: {
    top: 30,
    right: 40,
    bottom: 20,
    left: 40,
  },
  minHeight: 800,
  header: {
    height: 40,
  },
  point: {
    radius: 6,
    strokeWidth: 2,
    hoverRadius: 9,
    hoverStrokeWidth: 3,
    positiveFill: "#ffffff",
    negativeFill: "#f3f3f3",
    neutralFill: "#ffffff",
    positiveStroke: "#000000",
    negativeStroke: "#666666",
    neutralStroke: "#999999",
  },
  axis: {
    tickSize: 5,
    tickPadding: 5,
    fontSize: 12,
    labelOffset: 40,
  },
  curve: {
    strokeWidth: 6,
    opacity: 0.2,
  },
};
