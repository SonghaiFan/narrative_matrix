"use client";

import { NarrativeEvent } from "@/types/narrative/lite";
import { VisualizationDisplay } from "@/components/shared/visualization-display";
import { NarrativeTopicVisual } from "./topic-visual";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { SHARED_CONFIG } from "@/components/shared/visualization-config";

interface TopicDisplayProps {
  events: NarrativeEvent[];
}

type TopicViewMode = "main" | "sub";

export function TopicDisplay({ events }: TopicDisplayProps) {
  const [viewMode, setViewMode] = useState<TopicViewMode>("main");

  return (
    <VisualizationDisplay
      title="Topic Flow"
      isEmpty={!events.length}
      headerContent={
        <div
          className="flex items-center gap-2"
          style={{ height: `${SHARED_CONFIG.header.height * 0.8}px` }}
        >
          <Select
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
          </Select>
        </div>
      }
    >
      <NarrativeTopicVisual events={events} viewMode={viewMode} />
    </VisualizationDisplay>
  );
}
