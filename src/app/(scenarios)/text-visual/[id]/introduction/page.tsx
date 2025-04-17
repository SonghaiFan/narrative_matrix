"use client";

import { useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useCenterControl } from "@/contexts/center-control-context";
import { ScenarioType } from "@/types/scenario";
import { IntroductionFactory } from "@/components/features/introduction/introduction-factory";

export default function VisualizationIntroductionPage() {
  // Get params using the hook
  const params = useParams<{ id: string }>();
  const router = useRouter();

  // Ensure params.id is available before proceeding
  if (!params || typeof params.id !== "string") {
    // Handle the case where params are not yet available or id is missing
    // You might want to show a loading state or an error message
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
  }, [selectedScenario, currentScenarioIdFromParams, setSelectedScenario]);

  const nextPath = useMemo(() => {
    const trainingKey = `hasCompletedTraining-${currentScenarioIdFromParams}`;
    const hasCompletedTraining =
      typeof window !== "undefined" &&
      localStorage.getItem(trainingKey) === "true";

    if (!hasCompletedTraining) {
      return `/text-visual/${params.id}/training`;
    } else {
      return `/text-visual/${params.id}`;
    }
  }, [params.id, currentScenarioIdFromParams]);

  // Show loading if context hasn't synced yet (optional, might be redundant with params check)
  if (!selectedScenario) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading introduction display...</p>
      </div>
    );
  }

  return (
    <IntroductionFactory
      scenarioType={currentScenarioIdFromParams}
      redirectPath={nextPath}
    />
  );
}
