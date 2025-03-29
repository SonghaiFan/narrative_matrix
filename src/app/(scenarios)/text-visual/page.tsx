"use client";

import { TimeDisplay } from "@/components/features/narrative/time/time-display";
import { EntityDisplay } from "@/components/features/narrative/entity/entity-display";
import { TopicDisplay } from "@/components/features/narrative/topic/topic-display";
import { PureTextDisplay } from "@/components/features/narrative/pure-text/pure-text-display";
import { TaskPanel } from "@/components/features/task/task-panel";
import { ResizableGrid } from "@/components/ui/resizable-grid";
import { ScenarioPageFactory } from "@/components/features/dashboard/scenario-page-factory";

function VisualizationScenario() {
  return (
    <ScenarioPageFactory
      title="Text + Visualization"
      renderContent={({ data, user }) => {
        const { metadata, events } = data;

        const renderPanel = (content: React.ReactNode) => (
          <div className="h-full bg-white border border-gray-200 shadow-sm">
            <div className="h-full overflow-auto">{content}</div>
          </div>
        );

        return (
          <div className="w-full h-full overflow-hidden relative grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
            <div className="md:col-span-3 h-full">
              <ResizableGrid
                topLeft={renderPanel(<PureTextDisplay events={events} />)}
                topRight={renderPanel(
                  <TopicDisplay events={events} metadata={metadata} />
                )}
                bottomLeft={renderPanel(<EntityDisplay events={events} />)}
                bottomRight={renderPanel(
                  <TimeDisplay events={events} metadata={metadata} />
                )}
              />
            </div>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <TaskPanel
                events={events}
                metadata={metadata}
                userRole={user?.role as "domain" | "normal"}
              />
            </div>
          </div>
        );
      }}
    />
  );
}

export default function VisualizationPage() {
  return <VisualizationScenario />;
}
