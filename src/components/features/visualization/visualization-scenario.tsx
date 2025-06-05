"use client";

import { TimeDisplay } from "@/components/features/narrative/time/time-display";
import { EntityDisplay } from "@/components/features/narrative/entity/entity-display";
import { TopicDisplay } from "@/components/features/narrative/topic/topic-display";
import { PureTextDisplay } from "@/components/features/narrative/pure-text/pure-text-display";
import { TaskPanel } from "@/components/features/task/task-panel";
import { ResizableTwoColRow } from "@/components/ui/resizable-two-col-row";
import { ScenarioPageFactory } from "@/components/features/visualization/scenario-page-factory";
import { useTaskStore } from "@/store/task-store";
import { QuizVisual, Quiz } from "@/components/features/task/quiz-types";
import { NarrativeEvent, DatasetMetadata } from "@/types/data";
import { Suspense, useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useNavigationStore } from "@/store/navigation-store";

interface VisualizationContentProps {
  events: NarrativeEvent[];
  metadata: DatasetMetadata;
  visual: QuizVisual | null;
}

function VisualizationContent({
  events,
  metadata,
  visual,
}: VisualizationContentProps) {
  const renderPanel = (content: React.ReactNode) => (
    <div className="h-full bg-white border border-gray-200 shadow-sm">
      <div className="h-full overflow-auto">{content}</div>
    </div>
  );

  const getLeftComponent = () => {
    switch (visual) {
      case "entity":
        return renderPanel(<EntityDisplay events={events} />);
      case "topic":
        return renderPanel(
          <TopicDisplay events={events} metadata={metadata} />
        );
      case "time":
        return renderPanel(<TimeDisplay events={events} metadata={metadata} />);
      default:
        return null;
    }
  };

  return (
    <ResizableTwoColRow
      firstComponent={getLeftComponent()}
      secondComponent={renderPanel(<PureTextDisplay events={events} />)}
      defaultFirstSize={50}
      defaultSecondSize={50}
    />
  );
}

interface VisualizationScenarioProps {
  title: string;
  is_training?: boolean;
  metadata: DatasetMetadata | null;
  events: NarrativeEvent[] | null;
  isLoading: boolean;
  error: string | null;
  quiz?: Quiz;
  onComplete?: () => void;
}

export function VisualizationScenario({
  title,
  is_training = false,
  metadata,
  events,
  isLoading,
  error,
  quiz,
  onComplete,
}: VisualizationScenarioProps) {
  const currentTask = useTaskStore((state) => state.currentTask);
  const visual = currentTask?.visual || null;
  const { setCurrentScenario } = useNavigationStore();

  // Set the current scenario in the navigation store
  useEffect(() => {
    if (metadata?.studyType) {
      setCurrentScenario(metadata.studyType as any);

      // If there's a flowIndex in the metadata, we could use it for navigation state
      if (metadata.currentFlowIndex !== undefined) {
        // The current flow index is already set in the metadata by the data loader
        console.log(
          `Current flow index from metadata: ${metadata.currentFlowIndex}`
        );
      }
    }
  }, [metadata, setCurrentScenario]);

  return (
    <ScenarioPageFactory
      title={title}
      is_training={is_training}
      metadata={metadata}
      events={events}
      isLoading={isLoading}
      error={error}
      quiz={quiz}
      onComplete={onComplete}
      renderContent={({
        metadata: factoryMetadata,
        events: factoryEvents,
        role,
        is_training: factoryIsTraining,
        quiz: factoryQuiz,
        onComplete: factoryOnComplete,
      }) => {
        if (!factoryMetadata || !factoryEvents) {
          return <LoadingSpinner text="Loading data for content..." />;
        }

        return (
          <div className="w-full h-full relative grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            <div className="md:col-span-2 bg-white rounded-lg shadow-sm overflow-hidden">
              <Suspense
                fallback={<LoadingSpinner text="Loading visualization..." />}
              >
                <VisualizationContent
                  events={factoryEvents}
                  metadata={factoryMetadata}
                  visual={visual}
                />
              </Suspense>
            </div>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <TaskPanel
                events={factoryEvents}
                metadata={factoryMetadata}
                userRole={role as "domain" | "normal"}
                is_training={factoryIsTraining}
                quiz={factoryQuiz}
                onComplete={factoryOnComplete}
              />
            </div>
          </div>
        );
      }}
    />
  );
}
