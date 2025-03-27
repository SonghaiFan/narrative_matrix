type SentimentPolarity = "positive" | "negative" | "neutral";

// Define color constants with accessibility considerations
export const HIGHLIGHT_COLOR = "#3b82f6"; // Blue highlight color - accessible for most color vision types

const ACCESSIBLE_COLORS = {
  positive: "#4ade80", // Green - for positive sentiment
  negative: "#fbbf24", // Yellow - for negative sentiment
  neutral: "#EEEEEE", // Light gray - works for all vision types
} as const;

export function getSentimentColor(polarity: SentimentPolarity): string {
  return ACCESSIBLE_COLORS[polarity];
}

export function getHighlightColor(): string {
  return HIGHLIGHT_COLOR;
}
