"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { IntroductionPage } from "./introduction-page";
import { ScenarioType } from "@/types/scenario";
import {
  isStageComplete,
  markCurrentStageComplete,
  getNextRoute,
} from "@/lib/navigation";

interface IntroductionFactoryProps {
  studyId: string;
  sessionId: string;
  scenarioType: ScenarioType;
}

/**
 * A factory component that creates introduction pages for different scenarios
 * with consistent progress tracking and navigation
 */
export function IntroductionFactory({
  studyId,
  sessionId,
  scenarioType,
}: IntroductionFactoryProps) {
  const router = useRouter();

  // Check if user has already completed introduction for this scenario
  useEffect(() => {
    const hasCompletedIntro = isStageComplete(studyId, sessionId, {
      type: "intro",
    });
    if (hasCompletedIntro) {
      // Get the next route based on current progress
      const nextRoute = getNextRoute(studyId, sessionId);
      router.push(nextRoute);
    }
  }, [router, studyId, sessionId]);

  const handleComplete = () => {
    // Mark intro as completed in the progress store
    markCurrentStageComplete(studyId, sessionId, { type: "intro" });
    // Get the next route (should be training)
    const nextRoute = getNextRoute(studyId, sessionId);
    router.push(nextRoute);
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
