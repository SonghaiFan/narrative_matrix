"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useCenterControl } from "@/contexts/center-control-context";
import { ScenarioType } from "@/types/scenario";
import { IntroductionFactory } from "@/components/features/introduction/introduction-factory";
import { useNavigationStore } from "@/store/navigation-store";

export default function VisualizationIntroductionPage() {
  // Get params using the hook
  const params = useParams<{ id: string }>();
  const { setCurrentScenario } = useNavigationStore();

  // Ensure params.id is available before proceeding
  if (!params || typeof params.id !== "string") {
    // Handle the case where params are not yet available or id is missing
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading scenario context...</p>
      </div>
    );
  }

  const currentScenarioIdFromParams =
    `text-visual-${params.id}` as ScenarioType;
  const { selectedScenario, setSelectedScenario } = useCenterControl();

  useEffect(() => {
    // Update context if it doesn't match the route ID
    if (selectedScenario !== currentScenarioIdFromParams) {
      setSelectedScenario(currentScenarioIdFromParams);
    }

    // Set the current scenario in the navigation store
    setCurrentScenario(currentScenarioIdFromParams);
  }, [
    selectedScenario,
    currentScenarioIdFromParams,
    setSelectedScenario,
    setCurrentScenario,
  ]);

  // Show loading if context hasn't synced yet (optional, might be redundant with params check)
  if (!selectedScenario) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading introduction display...</p>
      </div>
    );
  }

  return <IntroductionFactory scenarioType={currentScenarioIdFromParams} />;
}
