"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useCenterControl } from "@/contexts/center-control-context";
import { ScenarioType } from "@/types/scenario";

/**
 * This client component synchronizes the scenario ID from the dynamic route
 * parameters with the selectedScenario state in CenterControlContext.
 */
export function ScenarioContextSync() {
  const params = useParams();
  const { setSelectedScenario, selectedScenario } = useCenterControl();

  useEffect(() => {
    // Extract the 'id' from the route parameters
    // useParams returns string | string[] | undefined, so we need to handle it
    const routeId = typeof params.id === "string" ? params.id : null;

    if (routeId) {
      const currentScenarioId = `text-visual-${routeId}` as ScenarioType;

      // Only update the context if the route scenario is different from the context state
      // This prevents unnecessary updates or potential loops
      if (selectedScenario !== currentScenarioId) {
        console.log(
          `[ContextSync] Updating selectedScenario from route param: ${currentScenarioId}`
        );
        setSelectedScenario(currentScenarioId);
      }
    } else {
      // Optional: Handle cases where we are on this route structure but id is missing?
      // Might indicate an issue or a different scenario page structure.
      console.warn("[ContextSync] Scenario ID not found in route parameters.");
    }
    // Depend on params.id and the context setter function
  }, [params.id, setSelectedScenario, selectedScenario]);

  // This component doesn't render anything itself
  return null;
}
