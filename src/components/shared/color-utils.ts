type SentimentPolarity = "positive" | "negative" | "neutral";

export function getSentimentColor(polarity: SentimentPolarity): string {
  // Use colorblind-friendly colors that match the blue theme
  const colors = {
    positive: "#4ade80", // Soft green
    negative: "#fdba74", // Soft orange
    neutral: "#ffffff", // White
  };

  return colors[polarity];
}
