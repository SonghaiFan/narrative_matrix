type SentimentPolarity = "positive" | "negative" | "neutral";

const ACCESSIBLE_COLORS = {
  positive: "#4ade80", // Green - for positive sentiment
  negative: "#fbbf24", // Yellow - for negative sentiment
  neutral: "#EEEEEE", // Light gray - works for all vision types
} as const;

export function getNodetColor(polarity: SentimentPolarity): string {
  // return ACCESSIBLE_COLORS[polarity];
  return "white";
}
