"use client";

import { NarrativeEvent } from "@/types/data";
import { VisualizationDisplay } from "@/components/visualisation/shared/visualization-display";
import { NarrativeTopicVisual } from "./topic-visual";
import { useState } from "react";
import { SHARED_CONFIG } from "@/components/visualisation/shared/visualization-config";

interface TopicDisplayProps {
  events: NarrativeEvent[];
  metadata: {
    publishDate: string;
  };
}

type TopicViewMode = "main" | "sub" | "sentiment";

export function TopicDisplay({ events, metadata }: TopicDisplayProps) {
  const [viewMode] = useState<TopicViewMode>("main");
  const useSemanticAxis = false; // Default to semantic axis

  return (
    <VisualizationDisplay title="Topic Stream" isEmpty={!events.length}>
      <NarrativeTopicVisual
        events={events}
        viewMode={viewMode}
        useSemanticAxis={useSemanticAxis}
        metadata={metadata}
      />
    </VisualizationDisplay>
  );
}
