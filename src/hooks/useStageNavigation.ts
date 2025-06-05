import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useNavigationStore } from "@/store/navigation-store";
import { getScenarioMetadata } from "@/lib/scenarios/study-config";
import { loadScenarioData } from "@/lib/server/actions";
import { ScenarioType, StudyStage } from "@/types/scenario";
import { NarrativeMatrixData } from "@/types/data";

type StageType = "intro" | "training" | "task" | "complete";

interface UseStageNavigationReturn {
  // Current state
  currentStage: StageType;
  stageIndex: number;
  scenarioData: NarrativeMatrixData | null;
  isLoading: boolean;
  error: string | null;
  metadata: any | null;

  // Navigation functions
  goToNextStage: () => Promise<void>;
  goToStage: (stageIndex: number) => Promise<void>;

  // Stage completion notification
  onStageCompleted: () => void;
}

export function useStageNavigation(
  scenarioId: ScenarioType,
  paramId: string
): UseStageNavigationReturn {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    setCurrentScenario,
    getCurrentStage,
    getCurrentFlowIndex,
    completeCurrentStage,
    getStageParams,
  } = useNavigationStore();

  // State
  const [currentStage, setCurrentStage] = useState<StageType>("intro");
  const [stageIndex, setStageIndex] = useState<number>(0);
  const [scenarioData, setScenarioData] = useState<NarrativeMatrixData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any | null>(null);

  // Initialize stage from URL
  useEffect(() => {
    const initializeStage = async () => {
      try {
        const metadataResult = getScenarioMetadata(scenarioId);
        if (!metadataResult) {
          setError("Invalid scenario ID");
          setIsLoading(false);
          return;
        }

        setMetadata(metadataResult);
        setCurrentScenario(scenarioId);

        // Get initial stage from URL or navigation store
        let initialStageType: StageType = "intro";
        let initialStageIndex = 0;

        const stageParam = searchParams.get("stage");
        const flowIndexParam = searchParams.get("flowIndex");

        if (stageParam && flowIndexParam) {
          initialStageType = stageParam as StageType;
          initialStageIndex = parseInt(flowIndexParam, 10);
        } else {
          const storeStage = getCurrentStage();
          const storeIndex = getCurrentFlowIndex();

          if (storeStage && storeIndex !== null) {
            initialStageType = storeStage as StageType;
            initialStageIndex = storeIndex;
          }
        }

        setCurrentStage(initialStageType);
        setStageIndex(initialStageIndex);

        // Load data if needed
        if (initialStageType === "task" || initialStageType === "training") {
          const data = await loadScenarioData(scenarioId, initialStageIndex);
          setScenarioData(data);
        }

        setIsLoading(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error occurred");
        setIsLoading(false);
      }
    };

    initializeStage();
  }, [
    scenarioId,
    searchParams,
    setCurrentScenario,
    getCurrentStage,
    getCurrentFlowIndex,
  ]);

  // Navigate to specific stage
  const goToStage = useCallback(
    async (targetStageIndex: number) => {
      if (!metadata) return;

      const nextStageParams = getStageParams(targetStageIndex);
      if (!nextStageParams) return;

      setCurrentStage(nextStageParams.stage as StageType);
      setStageIndex(nextStageParams.flowIndex);

      // Load data if needed
      if (
        nextStageParams.stage === "task" ||
        nextStageParams.stage === "training"
      ) {
        setIsLoading(true);
        try {
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

      // Update URL
      const url = new URL(window.location.href);
      url.searchParams.set("stage", nextStageParams.stage);
      url.searchParams.set("flowIndex", nextStageParams.flowIndex.toString());
      router.replace(url.toString(), { scroll: false });
    },
    [metadata, getStageParams, scenarioId, router]
  );

  // Navigate to next stage
  const goToNextStage = useCallback(async () => {
    if (!metadata) return;

    const nextIndex = stageIndex + 1;
    if (nextIndex >= metadata.studyFlow.length) return;

    completeCurrentStage();
    await goToStage(nextIndex);
  }, [metadata, stageIndex, completeCurrentStage, goToStage]);

  // Called when a stage is completed (from child components)
  const onStageCompleted = useCallback(() => {
    // This will trigger goToNextStage, but only when called explicitly
    // No automatic navigation from useEffect
    goToNextStage();
  }, [goToNextStage]);

  return {
    currentStage,
    stageIndex,
    scenarioData,
    isLoading,
    error,
    metadata,
    goToNextStage,
    goToStage,
    onStageCompleted,
  };
}
