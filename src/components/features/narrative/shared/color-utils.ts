type SentimentPolarity = "positive" | "negative" | "neutral";

const ACCESSIBLE_COLORS = {
  positive: "white", // Green - for positive sentiment
  negative: "white", // Yellow - for negative sentiment
  neutral: "white", // Light gray - works for all vision types
} as const;

export function getSentimentColor(polarity: SentimentPolarity): string {
  return ACCESSIBLE_COLORS[polarity];
}
