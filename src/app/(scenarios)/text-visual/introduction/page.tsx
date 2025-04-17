"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCenterControl } from "@/contexts/center-control-context";
import { ScenarioType } from "@/types/scenario";

// This component now primarily handles redirecting to the correct dynamic scenario page
export default function VisualizationIntroductionRedirector() {
  const router = useRouter();
  const { selectedScenario } = useCenterControl();

  useEffect(() => {
    // Determine the target scenario ID
    let targetScenarioId: ScenarioType | null = selectedScenario;

    // Fallback to localStorage if context value is null/undefined
    if (!targetScenarioId) {
      const storedScenario = localStorage.getItem("currentScenario");
      if (storedScenario && storedScenario.startsWith("text-visual-")) {
        targetScenarioId = storedScenario as ScenarioType;
      }
    }

    // Final fallback to a default if still nothing
    if (!targetScenarioId) {
      targetScenarioId = "text-visual-8"; // Default scenario
    }

    // Extract the numeric part for the dynamic route
    const numericId = targetScenarioId.replace("text-visual-", "");
    const redirectPath = `/text-visual/${numericId}`;

    console.log(`[Introduction Redirect] Redirecting to: ${redirectPath}`);
    // Use replace to avoid adding the introduction page to browser history
    router.replace(redirectPath);

    // Dependencies: router, selectedScenario (from context)
  }, [router, selectedScenario]);

  // Render a simple loading state while redirecting
  return (
    <div className="flex items-center justify-center h-screen">
      <p>Loading scenario introduction...</p>
    </div>
  );
  // We no longer render IntroductionFactory here
}
