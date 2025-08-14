"use client";

import { TimeDisplay } from "@/components/features/narrative/time/time-display";
import { EntityDisplay } from "@/components/features/narrative/entity/entity-display";
import { TopicDisplay } from "@/components/features/narrative/topic/topic-display";
import { PureTextDisplay } from "@/components/features/narrative/pure-text/pure-text-display";
import { ResizableGrid } from "@/components/ui/resizable-grid";
import { SimpleScenarioLayout } from "@/components/ui/simple-scenario-layout";

function VisualizationScenario() {
  return (
    <SimpleScenarioLayout title="Text + Visualization">
      {({ metadata, events }) => {
        const renderPanel = (content: React.ReactNode) => (
          <div className="h-full bg-white border border-gray-200 shadow-sm">
            <div className="h-full overflow-auto">{content}</div>
          </div>
        );

        return (
          <div className="w-full h-full overflow-hidden p-4">
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
        );
      }}
    </SimpleScenarioLayout>
  );
}

export default function VisualizationPage() {
  return <VisualizationScenario />;
}
