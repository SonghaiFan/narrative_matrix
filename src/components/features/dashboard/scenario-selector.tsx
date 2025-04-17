"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ScenarioType } from "@/types/scenario";
import { useCenterControl } from "@/contexts/center-control-context";

export function ScenarioSelector() {
  const { user, availableScenarios, setUserScenario } = useAuth();
  const router = useRouter();
  const { selectedScenario: centerScenario, setSelectedScenario } =
    useCenterControl();
  const [isLoading, setIsLoading] = useState(false);
  const { setIsLoading: setDataLoading } = useCenterControl();

  // Get default scenario from user if available
  const getUserDefaultScenario = (): ScenarioType | undefined => {
    if (user && "defaultScenario" in user) {
      return user.defaultScenario;
    }
    return undefined;
  };

  // Selected scenario is the user's default or the first available one
  const [selectedScenario, setLocalSelectedScenario] = useState<ScenarioType>(
    getUserDefaultScenario() ||
      (availableScenarios.length > 0
        ? (availableScenarios[0].id as ScenarioType)
        : "text-visual-1")
  );

  // Keep local state in sync with context's selected scenario
  useEffect(() => {
    if (centerScenario) {
      setLocalSelectedScenario(centerScenario);
    }
  }, [centerScenario]);

  // Update selection in both local state and contexts
  const handleScenarioSelect = (scenarioId: ScenarioType) => {
    setLocalSelectedScenario(scenarioId);
    setSelectedScenario(scenarioId);
  };

  // Start the selected scenario
  const startScenario = () => {
    if (!selectedScenario) return;

    setIsLoading(true);

    // Trigger data reload by setting loading state
    // This will cause any components using useCenterControl to re-fetch data
    setDataLoading(true);

    // Update user's default scenario - this updates the auth context
    setUserScenario(selectedScenario);

    // Also update center context for consistency
    setSelectedScenario(selectedScenario);

    // Map scenario types to their introduction route - all go to the same page
    // The different scenario IDs only control quiz ordering
    router.push("/text-visual/introduction");
  };

  if (availableScenarios.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Loading available scenarios...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Quiz Ordering Variations
            </h2>
            <p className="text-xs text-gray-500">
              Select a variation to determine the order of quiz questions
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {availableScenarios.map((scenario) => (
            <div
              key={scenario.id}
              onClick={() => handleScenarioSelect(scenario.id as ScenarioType)}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedScenario === scenario.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <div className="flex flex-col h-full">
                <div
                  className="font-medium text-sm"
                  style={{ color: scenario.metadata.color }}
                >
                  {scenario.metadata.name}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Quiz order variation #
                  {scenario.id.replace("text-visual-", "")}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <button
            type="button"
            className="w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={startScenario}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Starting...
              </>
            ) : (
              "Start Selected Scenario"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
