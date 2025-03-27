"use client";

import { NarrativeEvent } from "@/types/narrative/lite";
import { VisualizationDisplay } from "@/components/features/narrative/shared/visualization-display";
import { NarrativeTimeVisual } from "./time-visual";

interface TimeDisplayProps {
  events: NarrativeEvent[];
  metadata: {
    publishDate: string;
  };
}

export function TimeDisplay({ events, metadata }: TimeDisplayProps) {
  return (
    <VisualizationDisplay title="Time" isEmpty={!events.length}>
      <NarrativeTimeVisual events={events} metadata={metadata} />
    </VisualizationDisplay>
  );
}
