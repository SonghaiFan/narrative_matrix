"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCenterControl } from "@/contexts/center-control-context";
import { ProfileSection } from "./profile-section";
import { ScenarioCard } from "./scenario-card";
import { useAuth } from "@/contexts/auth-context";
import { ScenarioType } from "@/app/dashboard/page";

export function ScenarioSelector() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    data,
    setData,
    selectedScenario,
    setSelectedScenario,
    isLoading: contextIsLoading,
    setIsLoading: setContextIsLoading,
  } = useCenterControl();
  const [isLoading, setIsLoading] = useState(true);
  const [showStorageViewer, setShowStorageViewer] = useState(false);

  // Fetch initial data if not already loaded
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!data) {
        try {
          setIsLoading(true);
          setContextIsLoading(true);
          const response = await fetch("/default.json");
          if (!response.ok) {
            throw new Error("Failed to fetch data");
          }
          const NarrativeMatrixData = await response.json();
          setData(NarrativeMatrixData);
        } catch (error) {
          console.error("Failed to load initial data:", error);
        } finally {
          setIsLoading(false);
          setContextIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [data, setData, setContextIsLoading]);

  const handleScenarioSelect = (scenario: ScenarioType) => {
    setSelectedScenario(scenario);
  };

  const handleContinue = () => {
    if (selectedScenario) {
      // Map scenario types to their correct routes
      const routeMap: Record<string, string> = {
        "pure-text": "/pure-text",
        "text-visual": "/text-visual",
        "text-chat": "/text-chat",
        mixed: "/mixed",
      };

      router.push(routeMap[selectedScenario]);
    }
  };

  const handleBackToDashboard = () => {
    router.push("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-neutral-300 border-t-neutral-600 rounded-full animate-spin mb-2"></div>
        <div className="text-neutral-600 text-sm">Loading data...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-neutral-500 text-sm">No data available</div>
      </div>
    );
  }

  const { metadata, events } = data;

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

      <div className="flex flex-1 items-center overflow-auto p-3 sm:p-4 md:p-5">
        <div className="h-full w-full flex flex-col md:flex-row gap-4 lg:gap-5">
          {/* Left column - Profile Section */}
          <div className="md:w-2/5 bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
            <div className="h-full overflow-auto">
              <ProfileSection
                title={metadata.title || ""}
                description={metadata.description || ""}
                topic={metadata.topic || ""}
                author={metadata.author || ""}
                publishDate={metadata.publishDate || ""}
                imageUrl={metadata.imageUrl}
                events={events || []}
                onDataChange={setData}
              />
            </div>
          </div>

          {/* Right column - Scenario Selection */}
          <div className="md:w-3/5 flex flex-col h-full bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                Choose a exploration scenario
              </h2>
              <p className="text-xs text-gray-500">
                Select how you'd like to explore the narrative data
              </p>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Standard Views */}
                <div className="space-y-5">
                  <div className="text-xs font-medium text-gray-500 pl-1 flex items-center">
                    <span className="border-l-2 border-gray-300 pl-1.5">
                      Standard Views
                    </span>
                  </div>
                  <ScenarioCard
                    title="Text"
                    description="Display events in narrative order like a normal news article."
                    imageSrc="/images/pure-text-preview.svg"
                    onClick={() => handleScenarioSelect("pure-text")}
                    isSelected={selectedScenario === "pure-text"}
                  />
                  <ScenarioCard
                    title="Text + visual"
                    description="Interactive mixed with topic flow, entity relationships, and timeline views."
                    imageSrc="/images/visualization-preview.svg"
                    onClick={() => handleScenarioSelect("text-visual")}
                    isSelected={selectedScenario === "text-visual"}
                  />
                </div>

                {/* AI-Powered Views */}
                <div className="space-y-5">
                  <div className="text-xs font-medium text-gray-500 pl-1 flex items-center">
                    <span className="border-l-2 border-gray-300 pl-1.5">
                      AI-Powered Views
                    </span>
                  </div>
                  <ScenarioCard
                    title="Text + AI Chat"
                    description="Text view with an AI assistant that can answer questions about the narrative."
                    imageSrc="/images/text-chat-preview.svg"
                    onClick={() => handleScenarioSelect("text-chat")}
                    isSelected={selectedScenario === "text-chat"}
                  />
                  <ScenarioCard
                    title="mixed + AI Chat"
                    description="Interactive visualizations with an AI assistant to help interpret the data."
                    imageSrc="/images/mixed-preview.svg"
                    onClick={() => handleScenarioSelect("mixed")}
                    isSelected={selectedScenario === "mixed"}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between">
              <button
                type="button"
                className={`rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition-all ${
                  selectedScenario
                    ? "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
                disabled={!selectedScenario}
                onClick={handleContinue}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
