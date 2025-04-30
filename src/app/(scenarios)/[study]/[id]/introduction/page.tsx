"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useCenterControl } from "@/contexts/center-control-context";
import { ScenarioType } from "@/types/scenario";
import { IntroductionFactory } from "@/components/features/introduction/introduction-factory";

export default function IntroductionPage() {
  // Get params using the hook
  const params = useParams<{ study: string; id: string }>();

  // Ensure params are available before proceeding
  if (
    !params ||
    typeof params.study !== "string" ||
    typeof params.id !== "string"
  ) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading scenario context...</p>
      </div>
    );
  }

  const currentScenarioIdFromParams =
    `${params.study}-${params.id}` as ScenarioType;
  const { scenario, setScenario } = useCenterControl();

  useEffect(() => {
    // Update context if it doesn't match the route ID
    if (scenario !== currentScenarioIdFromParams) {
      setScenario(currentScenarioIdFromParams);
    }
  }, [scenario, currentScenarioIdFromParams, setScenario]);

  // Show loading if context hasn't synced yet
  if (!scenario) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading introduction display...</p>
      </div>
    );
  }

  return (
    <IntroductionFactory
      studyId={params.study}
      sessionId={params.id}
      scenarioType={currentScenarioIdFromParams}
    />
  );
}
