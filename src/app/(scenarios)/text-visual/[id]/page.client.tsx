"use client";

import { VisualizationScenario } from "@/components/features/visualization/visualization-scenario";
import { ScenarioType, StudyStage } from "@/types/scenario";
import { NarrativeMatrixData } from "@/types/data";
import { getScenarioMetadata } from "@/lib/scenarios/study-config";
import { notFound } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ScenarioContextSync } from "@/contexts/scenario-context-sync";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useNavigationStore, NavigationStage } from "@/store/navigation-store";
import { loadScenarioData } from "@/lib/server/actions";

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

  // Listen for completion events from TaskPanel
  useEffect(() => {
    const handleCompletion = (event: CustomEvent) => {
      // Mark current stage as completed and move to the next stage
      goToNextStage();
    };

    const handleTrainingComplete = (event: CustomEvent) => {
      // Training completed - find the next non-training stage and go there
      if (metadata && metadata.studyFlow) {
        // Find the first task stage after all training stages
        const taskStageIndex = metadata.studyFlow.findIndex(
          (stage: StudyStage, index: number) =>
            stage.type === "task" && index > stageIndex
        );

        if (taskStageIndex >= 0) {
          // Mark current stage as completed in the navigation store
          completeCurrentStage();

          // Get the stage parameters for the task stage
          const taskStageParams = getStageParams(taskStageIndex);

          if (taskStageParams) {
            // Show the training complete modal first
            // In a real implementation, you might want to use a state to show a modal here
            // before transitioning to the next stage

            // Then update component state to move to the task stage
            setCurrentStage(taskStageParams.stage as StageType);
            setStageIndex(taskStageParams.flowIndex);

            // Load data for the task stage
            setIsLoading(true);
            loadScenarioData(scenarioId, taskStageParams.flowIndex)
              .then((data) => {
                setScenarioData(data);
                setIsLoading(false);

                // Update URL with the new stage info
                const url = new URL(window.location.href);
                url.searchParams.set("stage", taskStageParams.stage);
                url.searchParams.set(
                  "flowIndex",
                  taskStageParams.flowIndex.toString()
                );
                router.replace(url.toString(), { scroll: false });
              })
              .catch((error) => {
                setError(
                  error instanceof Error
                    ? error.message
                    : "Unknown error occurred"
                );
                setIsLoading(false);
              });
          }
        }
      }
    };

    const handleSkipToNextStage = () => {
      // For domain experts skipping to the next stage
      goToNextStage();
    };

    // Add the event listeners
    window.addEventListener(
      "scenario:complete",
      handleCompletion as EventListener
    );
    window.addEventListener(
      "scenario:training-complete",
      handleTrainingComplete as EventListener
    );
    window.addEventListener(
      "scenario:skip-to-next-stage",
      handleSkipToNextStage as EventListener
    );

    // Remove the event listeners when the component unmounts
    return () => {
      window.removeEventListener(
        "scenario:complete",
        handleCompletion as EventListener
      );
      window.removeEventListener(
        "scenario:training-complete",
        handleTrainingComplete as EventListener
      );
      window.removeEventListener(
        "scenario:skip-to-next-stage",
        handleSkipToNextStage as EventListener
      );
    };
  }, [
    goToNextStage,
    metadata,
    stageIndex,
    completeCurrentStage,
    getStageParams,
    scenarioId,
    router,
  ]);

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

  // Render different components based on the current stage
  return (
    <>
      <ScenarioContextSync />

      {currentStage === "intro" && (
        <IntroductionComponent
          metadata={metadata}
          scenarioId={scenarioId}
          paramId={paramId}
          currentIndex={stageIndex}
          onContinue={goToNextStage}
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
        <CompletionComponent
          metadata={metadata}
          scenarioId={scenarioId}
          paramId={paramId}
        />
      )}
    </>
  );
}

// Introduction Component
function IntroductionComponent({
  metadata,
  scenarioId,
  paramId,
  currentIndex,
  onContinue,
}: {
  metadata: any;
  scenarioId: string;
  paramId: string;
  currentIndex: number;
  onContinue: () => void;
}) {
  // Function to get a badge color based on stage type
  const getStageTypeColor = (type: string) => {
    switch (type) {
      case "intro":
        return "bg-blue-100 text-blue-800";
      case "training":
        return "bg-green-100 text-green-800";
      case "task":
        return "bg-purple-100 text-purple-800";
      case "complete":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Function to format stage data sources for display
  const formatDataSources = (stage: StudyStage) => {
    if (!stage.dataSources) return "Default data sources";

    return (
      <div className="text-xs text-gray-600 mt-1 space-y-1">
        {stage.dataSources.eventsDataPath && (
          <div>
            <span className="font-semibold">Events:</span>{" "}
            {stage.dataSources.eventsDataPath}
          </div>
        )}
        {stage.dataSources.quizDataPath && (
          <div>
            <span className="font-semibold">Quiz:</span>{" "}
            {stage.dataSources.quizDataPath}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to {metadata.name}
          </h1>
          <p className="text-lg text-gray-600">{metadata.description}</p>

          <div className="mt-3 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
            Scenario ID: {scenarioId}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            About This Study
          </h2>
          <p className="text-gray-700 mb-4">
            This user study explores how different visualization approaches can
            enhance understanding of narrative content.
          </p>
          <p className="text-gray-700 mb-4">
            You will be presented with a series of tasks and questions related
            to the content. Some will include visualizations to help you analyze
            the information.
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Study Flow
          </h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-700 mb-2">
              <div>Stage</div>
              <div>Description</div>
              <div>Data Sources</div>
            </div>
            <div className="space-y-4">
              {metadata.studyFlow.map((stage: StudyStage, index: number) => (
                <div
                  key={index}
                  className="grid grid-cols-3 gap-4 bg-white p-3 rounded border border-gray-200"
                >
                  <div>
                    <div className="flex items-center">
                      <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium mr-2">
                        {index + 1}
                      </span>
                      <span className="font-medium">
                        {stage.title || "Untitled"}
                      </span>
                    </div>
                    <div
                      className={`mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs ${getStageTypeColor(
                        stage.type
                      )}`}
                    >
                      {stage.type}
                    </div>
                    {index === currentIndex && (
                      <div className="mt-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                        Current Stage
                      </div>
                    )}
                  </div>
                  <div className="text-gray-700 text-sm">
                    {stage.description || "No description available"}
                  </div>
                  <div className="text-xs">{formatDataSources(stage)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
          <h3 className="text-md font-medium text-gray-800 mb-2">
            Scenario Metadata
          </h3>
          <div className="text-sm space-y-1">
            <div>
              <span className="font-semibold">Topic:</span> {metadata.topic}
            </div>
            <div>
              <span className="font-semibold">Author:</span> {metadata.author}
            </div>
            <div>
              <span className="font-semibold">Publish Date:</span>{" "}
              {metadata.publishDate}
            </div>
            {/* Data sources are now defined per stage */}
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={onContinue}
            className="px-6 py-3 bg-blue-600 text-white text-lg font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Begin Study
          </button>
        </div>
      </div>
    </div>
  );
}

// Completion Component
function CompletionComponent({
  metadata,
  scenarioId,
  paramId,
}: {
  metadata: any;
  scenarioId: string;
  paramId: string;
}) {
  // Fixed completion code for Prolific
  const completionCode = "C5QC5X93";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-medium text-gray-900 mb-2">
              Study Completed!
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Thank you for participating in {metadata.name}.
            </p>

            <div className="bg-gray-50 border border-gray-100 rounded p-3 mb-6 mx-auto">
              <h3 className="text-sm font-medium text-gray-800 mb-2">
                Your Completion Code
              </h3>
              <div className="flex items-center">
                <code className="bg-white p-2 rounded border border-gray-100 font-mono text-sm flex-grow text-center">
                  {completionCode}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(completionCode);
                    alert("Copied to clipboard!");
                  }}
                  className="ml-2 p-1.5 bg-gray-800 text-white rounded hover:bg-gray-700 flex items-center justify-center"
                  aria-label="Copy completion code"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Please submit this code on Prolific to complete the study.
              </p>

              <Link
                href="/"
                className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Return Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
