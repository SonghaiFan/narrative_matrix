"use client";

import { getSentimentColor } from "./color-utils";

const ITEMS: {
  label: string;
  polarity: "positive" | "negative" | "neutral";
}[] = [
  { label: "Positive", polarity: "positive" },
  { label: "Negative", polarity: "negative" },
  { label: "Neutral", polarity: "neutral" },
];

export function SentimentLegend({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3 select-none">
      {ITEMS.map((item) => (
        <div key={item.polarity} className="flex items-center gap-1.5">
          <span
            className="inline-block rounded-full border border-gray-300"
            style={{
              background: getSentimentColor(item.polarity),
              width: compact ? 10 : 14,
              height: compact ? 10 : 14,
            }}
          />
          <span className="text-xs text-gray-600 leading-none">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default SentimentLegend;
