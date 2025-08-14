"use client";

import { NarrativeEvent } from "@/types/data";
import { VisualizationDisplay } from "@/components/visualisation/shared/visualization-display";
import { NarrativeTimeVisual } from "./time-visual";

interface TimeDisplayProps {
  events: NarrativeEvent[];
  metadata: {
    publishDate: string;
  };
}

export function TimeDisplay({ events, metadata }: TimeDisplayProps) {
  return (
    <VisualizationDisplay title="Story Curve" isEmpty={!events.length}>
      <NarrativeTimeVisual events={events} metadata={metadata} />
    </VisualizationDisplay>
  );
}
