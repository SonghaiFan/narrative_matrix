"use client";

import { VisualizationScenario } from "@/components/features/visualization/visualization-scenario";
import { ScenarioType, StudyStage } from "@/types/scenario";
import { NarrativeMatrixData } from "@/types/data";
import { getScenarioMetadata } from "@/lib/scenarios/study-config";
import { notFound } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ScenarioContextSync } from "@/contexts/scenario-context-sync";
import { useSearchParams, useRouter } from "next/navigation";
import { useNavigationStore } from "@/store/navigation-store";
import { loadScenarioData } from "@/lib/server/actions";
import { CompletionPage } from "@/components/features/completion/completion-page";
import { IntroductionPage } from "@/components/features/introduction/introduction-page";

// Define the types for our different stages
type StageType = "intro" | "training" | "task" | "complete";

// Client Component
export default function DynamicVisualizationClient({
  scenarioId,
  paramId,
}: {
  scenarioId: ScenarioType;
  paramId: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get navigation store methods
  const {
    setCurrentScenario,
    getCurrentStage,
    getCurrentFlowIndex,
    completeCurrentStage,
    getStudyFlowStage,
    getStageParams,
  } = useNavigationStore();

  // State to store the current stage and data
  const [currentStage, setCurrentStage] = useState<StageType>("intro");
  const [stageIndex, setStageIndex] = useState<number>(0);
  const [scenarioData, setScenarioData] = useState<NarrativeMatrixData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any | null>(null);

  // Get the flow index from URL query parameters
  const flowIndexParam = searchParams.get("flowIndex");
  const stageParam = searchParams.get("stage");

  // Initialize data based on URL parameters
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Get metadata to verify this is a valid scenario
        const metadataResult = getScenarioMetadata(scenarioId);

        if (!metadataResult) {
          setError("Invalid scenario ID");
          setIsLoading(false);
          return;
        }

        setMetadata(metadataResult);

        // Initialize scenario in the navigation store
        setCurrentScenario(scenarioId);

        // Determine the initial stage and index from URL params or navigation store
        let initialStageType: StageType = "intro";
        let initialStageIndex = 0;

        // First check URL parameters
        if (stageParam && flowIndexParam) {
          initialStageType = stageParam as StageType;
          initialStageIndex = parseInt(flowIndexParam, 10);
        }
        // Then check navigation store state
        else {
          const storeStage = getCurrentStage();
          const storeIndex = getCurrentFlowIndex();

          if (storeStage && storeIndex !== null) {
            initialStageType = storeStage as StageType;
            initialStageIndex = storeIndex;
          } else {
            // If neither URL nor store has state, find the intro index
            const stageIndex = metadataResult.studyFlow.findIndex(
              (stage: StudyStage) => stage.type === initialStageType
            );

            if (stageIndex >= 0) {
              initialStageIndex = stageIndex;
            }
          }
        }

        // Set the initial stage and index
        setCurrentStage(initialStageType);
        setStageIndex(initialStageIndex);

        // Load data for the stage if needed
        if (initialStageType === "task" || initialStageType === "training") {
          // Use server action to load the data
          const data = await loadScenarioData(scenarioId, initialStageIndex);
          setScenarioData(data);
        }

        setIsLoading(false);
      } catch (e) {
        console.error("Error initializing data:", e);
        setError(e instanceof Error ? e.message : "Unknown error occurred");
        setIsLoading(false);
      }
    };

    initializeData();
  }, [
    scenarioId,
    flowIndexParam,
    stageParam,
    setCurrentScenario,
    getCurrentStage,
    getCurrentFlowIndex,
  ]);

  // Function to advance to the next stage
  const goToNextStage = async () => {
    if (!metadata) return;

    const currentIndex = stageIndex;
    const nextIndex = currentIndex + 1;

    // Check if we've reached the end of the flow
    if (nextIndex >= metadata.studyFlow.length) {
      return;
    }

    // Mark current stage as completed in the navigation store
    completeCurrentStage();

    // Get the stage parameters for the next stage
    const nextStageParams = getStageParams(nextIndex);

    if (nextStageParams) {
      // Update component state
      setCurrentStage(nextStageParams.stage as StageType);
      setStageIndex(nextStageParams.flowIndex);

      // Load data for the next stage if it's a task or training
      if (
        nextStageParams.stage === "task" ||
        nextStageParams.stage === "training"
      ) {
        setIsLoading(true);
        try {
          // Use server action to load the data
          const data = await loadScenarioData(
            scenarioId,
            nextStageParams.flowIndex
          );
          setScenarioData(data);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Unknown error occurred");
        } finally {
          setIsLoading(false);
        }
      }

      // Update URL with the new stage info without full page navigation
      const url = new URL(window.location.href);
      url.searchParams.set("stage", nextStageParams.stage);
      url.searchParams.set("flowIndex", nextStageParams.flowIndex.toString());
      router.replace(url.toString(), { scroll: false });
    }
  };

  // No more event listeners - navigation is handled via onComplete callback

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
          onComplete={goToNextStage}
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
              onComplete={goToNextStage}
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
