"use client";

import { Entity, NarrativeEvent } from "@/types/narrative/lite";
import { useEffect, useRef, useState } from "react";
import { formatDate } from "@/lib/utils";
import { TooltipPosition, VisualizationType } from "@/contexts/tooltip-context";
import { getSentimentColor } from "@/components/features/narrative/shared/color-utils";

interface NarrativeTooltipProps {
  event: NarrativeEvent | null;
  position: TooltipPosition | null;
  visible: boolean;
  type: VisualizationType;
}

export function NarrativeTooltip({
  event,
  position,
  visible,
  type,
}: NarrativeTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipStyle, setTooltipStyle] = useState({
    left: "0px",
    top: "0px",
    opacity: 0,
    pointerEvents: "none" as const,
  });

  useEffect(() => {
    if (!tooltipRef.current || !position || !visible) {
      setTooltipStyle((prev) => ({ ...prev, opacity: 0 }));
      return;
    }

    const tooltipWidth = tooltipRef.current.offsetWidth;
    const tooltipHeight = tooltipRef.current.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate position to ensure tooltip stays within viewport
    let left = position.x + 10;
    let top = position.y + 10;

    // Adjust horizontal position if needed
    if (left + tooltipWidth > viewportWidth - 20) {
      left = position.x - tooltipWidth - 10;
    }

    // Adjust vertical position if needed
    if (top + tooltipHeight > viewportHeight - 20) {
      top = position.y - tooltipHeight - 10;
    }

    setTooltipStyle({
      left: `${left}px`,
      top: `${top}px`,
      opacity: 1,
      pointerEvents: "none",
    });
  }, [position, visible]);

  if (!event || !visible) {
    return null;
  }

  // Check if narrative_phase exists on the event object
  const hasNarrativePhase = event && "narrative_phase" in event;
  // Check if source_name exists on the event object
  const hasSourceName = event && "source_name" in event;

  // Get sentiment color for background
  const sentimentColor = getSentimentColor(event.topic.sentiment.polarity);

  return (
    <div
      ref={tooltipRef}
      className="fixed z-50 rounded-md shadow-lg p-3 max-w-xs border border-gray-200 text-sm"
      style={{
        ...tooltipStyle,
        backgroundColor: sentimentColor,
        borderColor: sentimentColor === "#ffffff" ? "#e5e7eb" : "transparent",
      }}
    >
      {/* Temporal information - optional field */}
      {event.temporal_anchoring?.real_time && (
        <div className="text-gray-700 font-bold text-sm mb-2">
          {formatDate(event.temporal_anchoring.real_time)}
        </div>
      )}

      {/* Event text - guaranteed to exist */}
      <div className="font-medium text-gray-900">{event.text}</div>

      {/* Topic information - guaranteed to exist */}
      {event.topic && (
        <div className="mt-3">
          <div className="text-xs font-medium text-gray-500 mb-1">Topics</div>
          <div className="flex flex-wrap gap-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/90 text-gray-900 border border-gray-200 shadow-sm">
              {event.topic.main_topic}
            </span>
            {/* Sub-topics - may be empty array */}
            {event.topic.sub_topic &&
              event.topic.sub_topic.length > 0 &&
              event.topic.sub_topic.map((subTopic, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/70 text-gray-700 border border-gray-200"
                >
                  {subTopic}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Entity information - guaranteed to exist but may be empty array */}
      {event.entities && event.entities.length > 0 && (
        <div className="mt-2">
          <div className="text-xs font-medium text-gray-500 mb-1">Entities</div>
          <div className="flex flex-wrap gap-1">
            {event.entities.map((entity, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/80 text-gray-900 border border-gray-200"
              >
                {entity.name}
                {/* Social role - optional field */}
                {entity.social_role && (
                  <span className="ml-1 text-xs text-gray-600">
                    ({entity.social_role})
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Narrative phase - optional field */}
      {hasNarrativePhase && (event as any).narrative_phase && (
        <div className="mt-2 text-xs text-gray-600">
          Phase:{" "}
          <span className="font-medium">{(event as any).narrative_phase}</span>
        </div>
      )}

      {/* Source name - optional field */}
      {hasSourceName && (event as any).source_name && (
        <div className="mt-1 text-xs text-gray-600">
          Source:{" "}
          <span className="font-medium">{(event as any).source_name}</span>
        </div>
      )}
    </div>
  );
}
