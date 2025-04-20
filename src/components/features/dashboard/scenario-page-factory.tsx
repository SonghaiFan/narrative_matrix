"use client";

import { ReactNode } from "react";
import { ScenarioLayout } from "@/components/features/dashboard/scenario-layout";
import { useAuth } from "@/contexts/auth-context";
// Import specific types needed
import { NarrativeEvent, NarrativeMetadata } from "@/types/lite";
import { Quiz } from "@/components/features/task/quiz-types";

interface ScenarioPageFactoryProps {
  title: string;
  is_training?: boolean;
  showSentimentLegend?: boolean;
  // Accept metadata and events directly
  metadata: NarrativeMetadata | null;
  events: NarrativeEvent[] | null;
  isLoading: boolean;
  error: string | null;
  quiz?: Quiz;
  renderContent: (props: {
    // Pass metadata and events to renderContent
    metadata: NarrativeMetadata | null;
    events: NarrativeEvent[] | null;
    user: any;
    is_training?: boolean;
    quiz?: Quiz;
  }) => ReactNode;
}

/**
 * Factory component for creating scenario pages - relies on data passed via props.
 */
export function ScenarioPageFactory({
  title,
  is_training = false,
  showSentimentLegend = true,
  // Destructure new props
  metadata,
  events,
  isLoading,
  error,
  quiz,
  renderContent,
}: ScenarioPageFactoryProps) {
  const { user } = useAuth();

  if (error) {
    return (
      <ScenarioLayout
        title={title}
        isLoading={false}
        isTraining={is_training}
        showSentimentLegend={showSentimentLegend}
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
        showSentimentLegend={showSentimentLegend}
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
      showSentimentLegend={showSentimentLegend}
    >
      {/* Pass metadata, events, user, and is_training to renderContent */}
      {renderContent({ metadata, events, user, is_training, quiz })}
    </ScenarioLayout>
  );
}
