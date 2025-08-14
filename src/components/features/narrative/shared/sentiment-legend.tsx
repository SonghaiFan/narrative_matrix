"use client";
import { getSentimentColor } from "@/components/features/narrative/shared/color-utils";

const sentiments: { key: "positive"|"negative"|"neutral"; label: string; desc: string }[] = [
  { key: "positive", label: "Positive", desc: "Favorable / supportive tone" },
  { key: "negative", label: "Negative", desc: "Critical / opposing tone" },
  { key: "neutral", label: "Neutral", desc: "Objective / mixed tone" },
];

export function SentimentLegend() {
  return (
    <div className="flex items-center gap-4 px-4 py-1 text-xs text-slate-600 select-none">
      {sentiments.map(s => (
        <div key={s.key} className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-full ring-1 ring-slate-400"
            style={{ backgroundColor: getSentimentColor(s.key) }}
            aria-label={`${s.label} sentiment color`}
          />
          <span className="font-medium">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
