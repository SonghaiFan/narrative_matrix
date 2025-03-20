"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { IntroductionPage } from "./introduction-page";
import { ScenarioType } from "@/types/shared/scenario";

interface IntroductionFactoryProps {
  scenarioType: ScenarioType;
  redirectPath: string;
}

/**
 * A factory component that creates introduction pages for different scenarios
 * with consistent local storage handling and redirection logic
 */
export function IntroductionFactory({
  scenarioType,
  redirectPath,
}: IntroductionFactoryProps) {
  const router = useRouter();
  // Create scenario-specific storage key
  const storageKey = `hasCompletedIntro-${scenarioType}`;

  // Check if user has already completed introduction for this scenario
  useEffect(() => {
    const hasCompletedIntro = localStorage.getItem(storageKey) === "true";
    if (hasCompletedIntro) {
      // Check if training is completed
      const hasCompletedTraining =
        localStorage.getItem(`hasCompletedTraining-${scenarioType}`) === "true";

      if (hasCompletedTraining) {
        // If both intro and training completed, go to main scenario
        router.push(redirectPath);
      } else {
        // If only intro completed, go to training
        router.push(`${redirectPath}/training`);
      }
    }
  }, [router, storageKey, redirectPath, scenarioType]);

  const handleComplete = () => {
    // Store completion in localStorage with scenario-specific key
    localStorage.setItem(storageKey, "true");
    // After intro completion, redirect to training
    router.push(`${redirectPath}/training`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-full p-4">
        <IntroductionPage
          onComplete={handleComplete}
          scenarioType={scenarioType}
        />
      </div>
    </div>
  );
}
