"use client";

import { PureTextDisplay } from "@/components/features/narrative/pure-text/pure-text-display";
import { TaskPanel } from "@/components/features/task/task-panel";
import { ScenarioPageFactory } from "@/components/features/scenario/scenario-page-factory";

function PureTextTrainingScenario() {
  return (
    <ScenarioPageFactory
      title="Text - Training"
      is_training={true}
      renderContent={({ data, user, is_training }) => {
        return (
          <div className="h-full grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            <div className="md:col-span-2 bg-white rounded-lg shadow-sm overflow-auto">
              <PureTextDisplay events={data.events} metadata={data.metadata} />
            </div>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <TaskPanel
                events={data.events}
                metadata={data.metadata}
                userRole={user?.role as "domain" | "normal"}
                is_training={is_training}
              />
            </div>
          </div>
        );
      }}
    />
  );
}

export default function PureTextTrainingPage() {
  return <PureTextTrainingScenario />;
}
