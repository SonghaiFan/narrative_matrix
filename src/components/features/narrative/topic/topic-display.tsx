"use client";

import { NarrativeEvent } from "@/types/data";
import { VisualizationDisplay } from "@/components/features/narrative/shared/visualization-display";
import { NarrativeTopicVisual } from "./topic-visual";
import { useState } from "react";
import { SHARED_CONFIG } from "@/components/features/narrative/shared/visualization-config";

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
      title="Topic Stream"
      isEmpty={!events.length}
      headerContent={
        <div
          className="flex items-center gap-2"
          style={{ height: `${SHARED_CONFIG.header.height * 0.8}px` }}
        ></div>
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
