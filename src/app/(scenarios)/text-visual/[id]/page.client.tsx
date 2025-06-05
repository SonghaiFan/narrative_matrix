"use client";

import { VisualizationScenario } from "@/components/features/visualization/visualization-scenario";
import { ScenarioType } from "@/types/scenario";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ScenarioContextSync } from "@/contexts/scenario-context-sync";
import { CompletionPage } from "@/components/features/completion/completion-page";
import { IntroductionPage } from "@/components/features/introduction/introduction-page";
import { useStageNavigation } from "@/hooks/useStageNavigation";

// Client Component
export default function DynamicVisualizationClient({
  scenarioId,
  paramId,
}: {
  scenarioId: ScenarioType;
  paramId: string;
}) {
  // Use centralized stage navigation hook
  const {
    currentStage,
    stageIndex,
    scenarioData,
    isLoading,
    error,
    metadata,
    onStageCompleted,
  } = useStageNavigation(scenarioId, paramId);

  // If loading, show loading spinner
  if (isLoading) {
    return <LoadingSpinner text="Loading..." fullPage />;
  }

  // If error, show error message
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-800 mb-4">{error}</p>
          <pre className="bg-gray-100 p-4 rounded text-left text-xs overflow-auto max-w-lg mx-auto">
            {error}
          </pre>
        </div>
      </div>
    );
  }

  // If metadata is not available, show not found
  if (!metadata) {
    return notFound();
  }

  // Get current stage metadata for dimension-specific introduction
  const currentStageMetadata = metadata.studyFlow[stageIndex];
  const dimensionProp = currentStageMetadata?.dimension;

  // Render different components based on the current stage
  return (
    <>
      <ScenarioContextSync />

      {currentStage === "intro" && (
        <IntroductionPage
          onComplete={onStageCompleted}
          scenarioType={scenarioId}
          dimension={dimensionProp}
        />
      )}

      {(currentStage === "task" || currentStage === "training") &&
        scenarioData && (
          <Suspense fallback={<LoadingSpinner text="Loading..." fullPage />}>
            <VisualizationScenario
              title={scenarioData.metadata.title || `Scenario ${paramId}`}
              is_training={currentStage === "training"}
              metadata={scenarioData.metadata}
              events={scenarioData.events}
              isLoading={isLoading}
              error={error}
              quiz={scenarioData.quiz}
              onStageCompleted={onStageCompleted}
            />
          </Suspense>
        )}

      {currentStage === "complete" && (
        <CompletionPage
          metadata={metadata}
          scenarioId={scenarioId}
          paramId={paramId}
        />
      )}
    </>
  );
}
