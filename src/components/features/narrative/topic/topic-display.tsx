"use client";

import { NarrativeEvent } from "@/types/narrative/lite";
import { VisualizationDisplay } from "@/components/features/narrative/shared/visualization-display";
import { NarrativeTopicVisual } from "./topic-visual";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SHARED_CONFIG } from "@/components/features/narrative/shared/visualization-config";
import { getSentimentColor } from "@/components/features/narrative/shared/color-utils";

interface TopicDisplayProps {
  events: NarrativeEvent[];
  metadata: {
    publishDate: string;
  };
}

type TopicViewMode = "main" | "sub";

export function TopicDisplay({ events, metadata }: TopicDisplayProps) {
  const [viewMode] = useState<TopicViewMode>("sub");

  return (
    <VisualizationDisplay
      title="Topic Flow"
      isEmpty={!events.length}
      headerContent={
        <div
          className="flex items-center gap-2"
          style={{ height: `${SHARED_CONFIG.header.height * 0.8}px` }}
        >
          {/* <Select
            value={viewMode}
            onValueChange={(value: TopicViewMode) => setViewMode(value)}
          >
            <SelectTrigger
              className="text-xs w-[140px] min-h-0"
              style={{ height: `${SHARED_CONFIG.header.height * 0.7}px` }}
            >
              <SelectValue placeholder="Select view mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="main" className="text-xs py-1">
                Main Topics
              </SelectItem>
              <SelectItem value="sub" className="text-xs py-1">
                Subtopics
              </SelectItem>
            </SelectContent>
          </Select> */}

          {/* Sentiment Legend */}
          <div className="flex items-center ml-4 text-xs">
            <span className="font-medium mr-2">Sentiment:</span>
            <div className="flex items-center mr-3">
              <div
                className="w-3 h-3 rounded-full mr-1"
                style={{ backgroundColor: getSentimentColor("positive") }}
              />
              <span>Positive</span>
            </div>
            <div className="flex items-center mr-3">
              <div
                className="w-3 h-3 rounded-full mr-1"
                style={{ backgroundColor: getSentimentColor("negative") }}
              />
              <span>Negative</span>
            </div>
            <div className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-1"
                style={{ backgroundColor: getSentimentColor("neutral") }}
              />
              <span>Neutral</span>
            </div>
          </div>
        </div>
      }
    >
      <NarrativeTopicVisual
        events={events}
        viewMode={viewMode}
        metadata={metadata}
      />
    </VisualizationDisplay>
  );
}
