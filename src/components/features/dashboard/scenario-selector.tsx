"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCenterControl } from "@/contexts/center-control-context";
import { ScenarioCard } from "./scenario-card";
import { ScenarioType } from "@/types/scenario";

export function ScenarioSelector() {
  const router = useRouter();
  const { data, selectedScenario, setSelectedScenario } = useCenterControl();
  const [isLoading, setIsLoading] = useState(false);

  const handleScenarioSelect = (scenario: ScenarioType) => {
    setSelectedScenario(scenario);
  };

  const handleContinue = () => {
    if (selectedScenario) {
      // Map scenario types to their introduction routes
      const routeMap: Record<string, string> = {
        "pure-text": "/pure-text/introduction",
        "text-visual": "/text-visual/introduction",
        "text-chat": "/text-chat/introduction",
        mixed: "/mixed/introduction",
      };

      router.push(routeMap[selectedScenario]);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[600px] bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-neutral-300 border-t-neutral-600 rounded-full animate-spin mb-2"></div>
        <div className="text-neutral-600 text-sm">Loading data...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[600px] bg-gray-50 flex items-center justify-center">
        <div className="text-neutral-500 text-sm">No data available</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-1">
          Scenario Selection
        </h2>
        <p className="text-xs text-gray-500">
          Choose how you'd like to explore the narrative data
        </p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <ScenarioCard
            title="Text"
            description="Display events in narrative order like a normal news article."
            imageSrc="/images/pure-text-preview.svg"
            onClick={() => handleScenarioSelect("pure-text")}
            isSelected={selectedScenario === "pure-text"}
          />
          <ScenarioCard
            title="Text + Visual"
            description="Interactive mixed with topic flow, entity relationships, and timeline views."
            imageSrc="/images/text-visual-preview.svg"
            onClick={() => handleScenarioSelect("text-visual")}
            isSelected={selectedScenario === "text-visual"}
          />
          <ScenarioCard
            title="Text + AI chat"
            description="Read text narrative with AI assistant to ask questions about the data."
            imageSrc="/images/text-chat-preview.svg"
            onClick={() => handleScenarioSelect("text-chat")}
            isSelected={selectedScenario === "text-chat"}
          />
          <ScenarioCard
            title="Hybrid"
            description="Combines visual analytics, narrative text and AI chat assistant."
            imageSrc="/images/hybrid-preview.svg"
            onClick={() => handleScenarioSelect("mixed")}
            isSelected={selectedScenario === "mixed"}
          />
        </div>
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50">
        <div className="flex justify-end">
          <button
            onClick={handleContinue}
            disabled={!selectedScenario}
            className={`px-6 py-2 rounded-md text-white text-sm font-medium transition-colors ${
              selectedScenario
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
