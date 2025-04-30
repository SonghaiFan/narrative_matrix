"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  getAvailableScenarios,
  getAvailableScenariosSync,
} from "@/lib/client/scenario-metadata";
import { useProlificStore } from "@/store/prolific-store";
import { getLocalStorage } from "@/utils/local-storage";
import { ScenarioType, parseScenarioId } from "@/types/scenario";
import { ScenarioMetadata } from "@/types/lite";

export function ScenarioSelector() {
  const { user } = useAuth();
  const router = useRouter();
  const { setProlificParams } = useProlificStore();

  // Get initial scenarios from sync function to avoid flash of no content
  const [availableScenarios, setAvailableScenarios] = useState<
    ScenarioMetadata[]
  >(getAvailableScenariosSync());

  // Fetch scenarios asynchronously
  useEffect(() => {
    async function loadScenarios() {
      const scenarios = await getAvailableScenarios();
      setAvailableScenarios(scenarios);
    }
    loadScenarios();
  }, []);

  const [selectedScenario, setSelectedScenario] = useState<ScenarioType | null>(
    (availableScenarios[0]?.id as ScenarioType) || null
  );

  // Update selected scenario when available scenarios change
  useEffect(() => {
    if (availableScenarios.length > 0 && !selectedScenario) {
      setSelectedScenario(availableScenarios[0].id as ScenarioType);
    }
  }, [availableScenarios, selectedScenario]);

  // Start the selected scenario
  const startScenario = () => {
    if (!selectedScenario) return;

    try {
      // Use the parseScenarioId utility to safely split the scenario ID
      const { studyId, sessionId } = parseScenarioId(selectedScenario);

      // Update Prolific store with the scenario ID
      setProlificParams({
        prolificId: user?.id || null,
        studyId,
        sessionId: sessionId.toString(),
      });

      // --- Check Completion Status ---
      const introKey = `hasCompletedIntro-${selectedScenario}`;
      const trainingKey = `hasCompletedTraining-${selectedScenario}`;
      const hasCompletedIntro = getLocalStorage(introKey) === "true";
      const hasCompletedTraining = getLocalStorage(trainingKey) === "true";

      // --- Determine Target Route ---
      let targetRoute = `/${studyId}/${sessionId}`;

      // If intro not completed, go to intro
      if (!hasCompletedIntro) {
        targetRoute = `${targetRoute}/intro`;
      }
      // If intro completed but training not completed, go to training
      else if (!hasCompletedTraining) {
        targetRoute = `${targetRoute}/training`;
      }

      // Navigate to the appropriate route
      router.push(targetRoute);
    } catch (error) {
      console.error("Error starting scenario:", error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Select Scenario
          </h2>
          <p className="text-sm text-gray-500">
            Choose a scenario to begin your session
          </p>
        </div>

        <div className="p-4">
          <select
            value={selectedScenario || ""}
            onChange={(e) =>
              setSelectedScenario(e.target.value as ScenarioType)
            }
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableScenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name}
              </option>
            ))}
          </select>

          <div className="mt-4">
            <button
              onClick={startScenario}
              disabled={!selectedScenario}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Scenario
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
