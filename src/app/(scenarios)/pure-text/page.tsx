"use client";

import { PureTextDisplay } from "@/components/features/narrative/pure-text/pure-text-display";
import { SimpleScenarioLayout } from "@/components/ui/simple-scenario-layout";

function PureTextScenario() {
  return (
    <SimpleScenarioLayout title="Text">
      {({ events, metadata }) => {
        return (
          <div className="h-full p-4">
            <div className="bg-white rounded-lg shadow-sm overflow-auto h-full">
              <PureTextDisplay events={events} metadata={metadata} />
            </div>
          </div>
        );
      }}
    </SimpleScenarioLayout>
  );
}

export default function PureTextPage() {
  return <PureTextScenario />;
}
