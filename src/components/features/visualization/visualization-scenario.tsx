"use client";

import { TimeDisplay } from "@/components/features/narrative/time/time-display";
import { EntityDisplay } from "@/components/features/narrative/entity/entity-display";
import { TopicDisplay } from "@/components/features/narrative/topic/topic-display";
import { PureTextDisplay } from "@/components/features/narrative/pure-text/pure-text-display";
import { TaskPanel } from "@/components/features/task/task-panel";
import { ResizableTwoColRow } from "@/components/ui/resizable-two-col-row";
import { ScenarioPageFactory } from "@/components/features/dashboard/scenario-page-factory";
import { useTaskStore } from "@/store/task-store";
import { QuizVisual } from "@/components/features/task/quiz-types";
import { NarrativeEvent, NarrativeMetadata } from "@/types/lite";
import { Suspense } from "react";

interface VisualizationContentProps {
  events: NarrativeEvent[];
  metadata: NarrativeMetadata;
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
  metadata: NarrativeMetadata | null;
  events: NarrativeEvent[] | null;
  isLoading: boolean;
  error: string | null;
}

export function VisualizationScenario({
  title,
  is_training = false,
  metadata,
  events,
  isLoading,
  error,
}: VisualizationScenarioProps) {
  const currentTask = useTaskStore((state) => state.currentTask);
  const visual = currentTask?.visual || null;

  return (
    <ScenarioPageFactory
      title={title}
      is_training={is_training}
      metadata={metadata}
      events={events}
      isLoading={isLoading}
      error={error}
      renderContent={({
        metadata: factoryMetadata,
        events: factoryEvents,
        user,
        is_training: factoryIsTraining,
      }) => {
        if (!factoryMetadata || !factoryEvents) {
          return <div>Loading data for content...</div>;
        }

        return (
          <div className="w-full h-full relative grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            <div className="md:col-span-2 bg-white rounded-lg shadow-sm overflow-hidden">
              <Suspense
                fallback={
                  <div className="h-full flex items-center justify-center">
                    Loading visualization...
                  </div>
                }
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
                userRole={user?.role as "domain" | "normal"}
                is_training={factoryIsTraining}
              />
            </div>
          </div>
        );
      }}
    />
  );
}
