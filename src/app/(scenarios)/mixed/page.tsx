"use client";

import { TimeDisplay } from "@/components/features/narrative/time/time-display";
import { EntityDisplay } from "@/components/features/narrative/entity/entity-display";
import { TopicDisplay } from "@/components/features/narrative/topic/topic-display";
import { PureTextDisplay } from "@/components/features/narrative/pure-text/pure-text-display";
import { ChatInterface } from "@/components/features/chat/chat-interface";
import { ResizableGrid } from "@/components/ui/resizable-grid";
import { SimpleScenarioLayout } from "@/components/ui/simple-scenario-layout";

function VisualizationChatScenario() {
  return (
    <SimpleScenarioLayout title="Mixed">
      {({ metadata, events }) => {
        const renderPanel = (content: React.ReactNode) => (
          <div className="h-full bg-white border border-gray-200 shadow-sm">
            <div className="h-full overflow-auto">{content}</div>
          </div>
        );

        return (
          <div className="w-full h-full overflow-hidden p-4">
            <div className="h-full grid grid-cols-[3fr_1fr] gap-4">
              <div className="h-full w-full overflow-hidden relative">
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
                <ChatInterface events={events} />
              </div>
            </div>
          </div>
        );
      }}
    </SimpleScenarioLayout>
  );
}

export default function VisualizationChatPage() {
  return <VisualizationChatScenario />;
}
