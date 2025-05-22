"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { IntroductionPage } from "./introduction-page";
import { ScenarioType } from "@/types/scenario";
import { useNavigationStore } from "@/store/navigation-store";

interface IntroductionFactoryProps {
  scenarioType: ScenarioType;
}

/**
 * A factory component that creates introduction pages for different scenarios
 * with consistent navigation between stages using the navigation store
 */
export function IntroductionFactory({
  scenarioType,
}: IntroductionFactoryProps) {
  const router = useRouter();
  const {
    setCurrentScenario,
    isStageCompleted,
    completeCurrentStage,
    goToStage,
    goToNextStage,
  } = useNavigationStore();

  // Set the current scenario in the navigation store
  useEffect(() => {
    setCurrentScenario(scenarioType);
  }, [scenarioType, setCurrentScenario]);

  const handleComplete = () => {
    // Mark introduction as complete in the navigation store
    completeCurrentStage();

    // Navigate to the next stage (training)
    router.push(goToNextStage());
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
