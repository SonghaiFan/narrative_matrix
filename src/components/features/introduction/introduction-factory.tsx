"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { IntroductionPage } from "./introduction-page";
import { ScenarioType } from "@/types/shared/scenario";

interface IntroductionFactoryProps {
  scenarioType: ScenarioType;
  redirectPath: string;
  storageKey?: string;
}

/**
 * A factory component that creates introduction pages for different scenarios
 * with consistent local storage handling and redirection logic
 */
export function IntroductionFactory({
  scenarioType,
  redirectPath,
  storageKey = "hasCompletedIntro",
}: IntroductionFactoryProps) {
  const router = useRouter();

  // Check if user has already completed introduction
  useEffect(() => {
    const hasCompletedIntro = localStorage.getItem(storageKey) === "true";
    if (hasCompletedIntro) {
      router.push(redirectPath);
    }
  }, [router, storageKey, redirectPath]);

  const handleComplete = () => {
    // Store completion in localStorage
    localStorage.setItem(storageKey, "true");
    router.push(redirectPath);
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
