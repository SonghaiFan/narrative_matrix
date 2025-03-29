"use client";

import { PureTextDisplay } from "@/components/features/narrative/pure-text/pure-text-display";
import { ChatInterface } from "@/components/features/chat/chat-interface";
import { TaskPanel } from "@/components/features/task/task-panel";
import { ResizableTwoRowCol } from "@/components/ui/resizable-two-row-col";
import { ScenarioPageFactory } from "@/components/features/dashboard/scenario-page-factory";

function PureTextChatScenario() {
  return (
    <ScenarioPageFactory
      title="Text + AI Chat"
      renderContent={({ data, user }) => {
        return (
          <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <PureTextDisplay events={data.events} />
            </div>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <ResizableTwoRowCol
                firstComponent={<ChatInterface events={data.events} />}
                secondComponent={
                  <TaskPanel
                    events={data.events}
                    metadata={data.metadata}
                    userRole={user?.role as "domain" | "normal"}
                  />
                }
                defaultFirstSize={50}
                defaultSecondSize={50}
                direction="vertical"
              />
            </div>
          </div>
        );
      }}
    />
  );
}

export default function PureTextChatPage() {
  return <PureTextChatScenario />;
}
