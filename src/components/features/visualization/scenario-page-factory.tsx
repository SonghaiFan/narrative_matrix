"use client";

import { ReactNode } from "react";
import { ScenarioLayout } from "@/components/features/visualization/scenario-layout";
import { useAuth } from "@/contexts/auth-context";
// Import specific types needed
import { NarrativeEvent, DatasetMetadata } from "@/types/data";
import { Quiz } from "@/components/features/task/quiz-types";

interface ScenarioPageFactoryProps {
  title: string;
  is_training?: boolean;
  showColourLegend?: boolean;
  // Accept metadata and events directly
  metadata: DatasetMetadata | null;
  events: NarrativeEvent[] | null;
  isLoading: boolean;
  error: string | null;
  quiz?: Quiz;
  onStageCompleted?: () => void;
  renderContent: (props: {
    // Pass metadata and events to renderContent
    metadata: DatasetMetadata | null;
    events: NarrativeEvent[] | null;
    userId: string;
    scenarioId: string;
    role: string;
    is_training?: boolean;
    quiz?: Quiz;
    onStageCompleted?: () => void;
  }) => ReactNode;
}

/**
 * Factory component for creating scenario pages - relies on data passed via props.
 */
export function ScenarioPageFactory({
  title,
  is_training = false,
  showColourLegend = true,
  metadata,
  events,
  isLoading,
  error,
  quiz,
  onStageCompleted,
  renderContent,
}: ScenarioPageFactoryProps) {
  const { userId, scenarioId, role } = useAuth();

  if (error) {
    return (
      <ScenarioLayout
        title={title}
        isLoading={false}
        isTraining={is_training}
        showColourLegend={showColourLegend}
      >
        <div className="h-full flex flex-col items-center justify-center p-4">
          <div className="text-red-500 mb-2">Error:</div>
          <div className="text-gray-700 mb-4 text-center max-w-md">
            {error || "Failed to load data"}
          </div>
        </div>
      </ScenarioLayout>
    );
  }

  // Check isLoading OR if metadata/events are null/undefined
  if (isLoading || !metadata || !events) {
    return (
      <ScenarioLayout
        title={title}
        isLoading={true}
        isTraining={is_training}
        showColourLegend={showColourLegend}
      >
        <div className="h-full flex items-center justify-center">
          <div className="text-gray-500">Loading content...</div>
        </div>
      </ScenarioLayout>
    );
  }

  return (
    <ScenarioLayout
      title={title}
      isLoading={false}
      isTraining={is_training}
      showColourLegend={showColourLegend}
    >
      {/* Pass metadata, events, userId, scenarioId, role, and is_training to renderContent */}
      {renderContent({
        metadata,
        events,
        userId,
        scenarioId,
        role,
        is_training,
        quiz,
        onStageCompleted,
      })}
    </ScenarioLayout>
  );
}
