"use client";

import { PureTextDisplay } from "@/components/features/narrative/pure-text/pure-text-display";
import { ChatInterface } from "@/components/features/chat/chat-interface";
import { SimpleScenarioLayout } from "@/components/ui/simple-scenario-layout";

function PureTextChatScenario() {
  return (
    <SimpleScenarioLayout title="Text + AI Chat">
      {({ events }) => {
        return (
          <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <PureTextDisplay events={events} />
            </div>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <ChatInterface events={events} />
            </div>
          </div>
        );
      }}
    </SimpleScenarioLayout>
  );
}

export default function PureTextChatPage() {
  return <PureTextChatScenario />;
}
