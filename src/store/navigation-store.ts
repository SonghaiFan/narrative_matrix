import { create } from "zustand";
import { ScenarioType } from "@/types/scenario";
import { getScenarioMetadata } from "@/lib/scenarios/study-config";

export type NavigationStage = "intro" | "training" | "task" | "complete";

// Legacy fixed navigation stages - kept for backward compatibility
export const NAVIGATION_STAGES: NavigationStage[] = [
  "intro",
  "training",
  "task",
  "complete",
];

export interface ScenarioProgress {
  introCompleted: boolean;
  trainingCompleted: boolean;
  tasksCompleted: boolean;
  currentStage: NavigationStage;
  // Track the current step within the study flow
  currentFlowIndex: number;
  // Track completion status of each stage in the flow
  completedStages: boolean[];
}

export type ScenarioProgressMap = Record<ScenarioType, ScenarioProgress>;

interface NavigationState {
  // Current active scenario ID
  currentScenario: ScenarioType | null;

  // Progress for each scenario
  scenarioProgress: ScenarioProgressMap;

  // Navigation helper methods
  setCurrentScenario: (scenario: ScenarioType) => void;
  getCurrentStage: () => NavigationStage | null;
  getNextStage: () => NavigationStage | null;
  completeCurrentStage: () => void;
  goToNextStage: () => string; // Returns the URL for the next stage
  goToStage: (stageIndex: number) => string; // Returns the URL for a specific stage in the flow
  getCurrentFlowIndex: () => number | null;
  getStudyFlowLength: () => number;
  getStudyFlowStage: (
    index: number
  ) => { type: NavigationStage; title: string } | null;

  // Helper to check stage completion
  isStageCompleted: (scenario: ScenarioType, flowIndex: number) => boolean;

  // Reset progress for a scenario
  resetScenarioProgress: (scenario: ScenarioType) => void;

  // Get URL parameters for a stage (used for SPA navigation)
  getStageParams: (
    stageIndex: number
  ) => { stage: NavigationStage; flowIndex: number } | null;
}

// Mapping stage to URL path segment
const stageToPathMap: Record<NavigationStage, string> = {
  intro: "introduction",
  training: "training",
  task: "", // Root scenario path
  complete: "completion",
};

// Default scenario progress template
const createDefaultProgress = (): ScenarioProgress => ({
  introCompleted: false,
  trainingCompleted: false,
  tasksCompleted: false,
  currentStage: "intro",
  currentFlowIndex: 0,
  completedStages: [],
});

// Parse scenario ID into study ID and session ID
// Format: study_id-session_id (e.g., "text-visual-9")
const parseScenarioId = (
  scenarioId: string
): { studyId: string; sessionId: string } => {
  // Find the last dash in the string
  const lastDashIndex = scenarioId.lastIndexOf("-");
  if (lastDashIndex === -1) {
    // Default fallback if no dash found
    return { studyId: "text-visual", sessionId: scenarioId };
  }

  // Extract study ID and session ID
  const studyId = scenarioId.substring(0, lastDashIndex);
  const sessionId = scenarioId.substring(lastDashIndex + 1);

  return { studyId, sessionId };
};

// Create a new store
export const useNavigationStore = create<NavigationState>((set, get) => ({
  // Initial state
  currentScenario: null,

  // Progress tracking for each scenario (initialize empty)
  scenarioProgress: {} as ScenarioProgressMap,

  // Set the current scenario
  setCurrentScenario: (scenario: ScenarioType) => {
    const { scenarioProgress } = get();
    const metadata = getScenarioMetadata(scenario);
    const studyFlow = metadata?.studyFlow || [];

    // Create default progress if this is the first time seeing this scenario
    if (!scenarioProgress[scenario]) {
      set((state) => ({
        currentScenario: scenario,
        scenarioProgress: {
          ...state.scenarioProgress,
          [scenario]: {
            ...createDefaultProgress(),
            completedStages: new Array(studyFlow.length).fill(false),
          },
        },
      }));
    } else {
      // Just update the current scenario
      set({ currentScenario: scenario });
    }
  },

  // Get the current navigation stage for the active scenario
  getCurrentStage: () => {
    const { currentScenario, scenarioProgress } = get();
    if (!currentScenario) return null;

    const progress = scenarioProgress[currentScenario];
    if (!progress) return null;

    // Get the stage type from the study flow
    const metadata = getScenarioMetadata(currentScenario);
    const studyFlow = metadata?.studyFlow || [];
    const currentFlowIndex = progress.currentFlowIndex;

    if (studyFlow.length > 0 && currentFlowIndex < studyFlow.length) {
      return studyFlow[currentFlowIndex].type as NavigationStage;
    }

    // Fallback to legacy behavior
    return progress.currentStage;
  },

  // Get the current index in the study flow
  getCurrentFlowIndex: () => {
    const { currentScenario, scenarioProgress } = get();
    if (!currentScenario) return null;

    const progress = scenarioProgress[currentScenario];
    if (!progress) return null;

    return progress.currentFlowIndex;
  },

  // Get the total length of the study flow
  getStudyFlowLength: () => {
    const { currentScenario } = get();
    if (!currentScenario) return 0;

    const metadata = getScenarioMetadata(currentScenario);
    return metadata?.studyFlow?.length || 0;
  },

  // Get details about a specific stage in the study flow
  getStudyFlowStage: (index: number) => {
    const { currentScenario } = get();
    if (!currentScenario) return null;

    const metadata = getScenarioMetadata(currentScenario);
    const studyFlow = metadata?.studyFlow || [];

    if (index < 0 || index >= studyFlow.length) return null;

    return {
      type: studyFlow[index].type as NavigationStage,
      title: studyFlow[index].title || "",
    };
  },

  // Get the next stage in the navigation flow
  getNextStage: () => {
    const { currentScenario, getCurrentFlowIndex } = get();
    if (!currentScenario) return null;

    const currentFlowIndex = getCurrentFlowIndex();
    if (currentFlowIndex === null) return null;

    const metadata = getScenarioMetadata(currentScenario);
    const studyFlow = metadata?.studyFlow || [];

    // Get the next stage in the study flow
    if (studyFlow.length > 0 && currentFlowIndex < studyFlow.length - 1) {
      return studyFlow[currentFlowIndex + 1].type as NavigationStage;
    }

    // If we're at the end of the flow, return null
    return null;
  },

  // Mark the current stage as completed and advance to the next stage
  completeCurrentStage: () => {
    const { currentScenario, getCurrentFlowIndex } = get();
    if (!currentScenario) {
      console.error("completeCurrentStage: No current scenario set");
      return;
    }

    const currentFlowIndex = getCurrentFlowIndex();
    if (currentFlowIndex === null) {
      console.error("completeCurrentStage: Current flow index is null");
      return;
    }

    const metadata = getScenarioMetadata(currentScenario);
    if (!metadata) {
      console.error(
        `completeCurrentStage: No metadata found for scenario ${currentScenario}`
      );
      return;
    }

    const studyFlow = metadata.studyFlow || [];

    console.log(
      `completeCurrentStage: Flow length: ${studyFlow.length}, Current index: ${currentFlowIndex}`
    );

    if (currentFlowIndex >= studyFlow.length) {
      console.error(
        `completeCurrentStage: Current index ${currentFlowIndex} is out of bounds for flow length ${studyFlow.length}`
      );
      return;
    }

    if (!studyFlow[currentFlowIndex]) {
      console.error(
        `completeCurrentStage: No stage found at index ${currentFlowIndex}`
      );
      return;
    }

    const currentStage = studyFlow[currentFlowIndex].type as NavigationStage;
    console.log(`completeCurrentStage: Current stage type: ${currentStage}`);

    set((state) => {
      const updatedProgress = { ...state.scenarioProgress[currentScenario] };

      // Update the legacy stage completion status
      if (currentStage === "intro") updatedProgress.introCompleted = true;
      if (currentStage === "training") updatedProgress.trainingCompleted = true;
      if (currentStage === "task") updatedProgress.tasksCompleted = true;

      // Mark the current stage in the flow as completed
      const completedStages = [...updatedProgress.completedStages];
      completedStages[currentFlowIndex] = true;
      updatedProgress.completedStages = completedStages;

      // Advance to next stage if available
      const nextIndex = currentFlowIndex + 1;
      if (nextIndex < studyFlow.length) {
        const nextStage = studyFlow[nextIndex];
        if (!nextStage || !nextStage.type) {
          console.error(
            `completeCurrentStage: Invalid next stage at index ${nextIndex}`
          );
        } else {
          console.log(
            `completeCurrentStage: Advancing to next stage: ${nextStage.type} at index ${nextIndex}`
          );
          updatedProgress.currentStage = nextStage.type as NavigationStage;
          updatedProgress.currentFlowIndex = nextIndex;
        }
      } else {
        console.log(
          `completeCurrentStage: Reached end of flow (${nextIndex} >= ${studyFlow.length})`
        );
      }

      return {
        scenarioProgress: {
          ...state.scenarioProgress,
          [currentScenario]: updatedProgress,
        },
      };
    });
  },

  // Navigate to the next stage and return the URL
  goToNextStage: () => {
    const { currentScenario, getCurrentFlowIndex, completeCurrentStage } =
      get();
    if (!currentScenario) {
      console.error("goToNextStage: No current scenario set");
      return "/";
    }

    // Get metadata to understand the flow
    const metadata = getScenarioMetadata(currentScenario);
    if (!metadata) {
      console.error(
        `goToNextStage: No metadata found for scenario ${currentScenario}`
      );
      return "/";
    }

    console.log(
      `goToNextStage: Current scenario: ${currentScenario}, Study flow length: ${
        metadata.studyFlow?.length || 0
      }`
    );

    // Get current index before completing stage
    const currentIndex = getCurrentFlowIndex();
    console.log(
      `goToNextStage: Current flow index before completing stage: ${currentIndex}`
    );

    // First mark the current stage as completed
    completeCurrentStage();

    // Then get the updated current index (which should be the next stage now)
    const nextFlowIndex = get().getCurrentFlowIndex();
    console.log(
      `goToNextStage: Next flow index after completing stage: ${nextFlowIndex}`
    );

    if (nextFlowIndex === null) {
      console.error(
        "goToNextStage: Next flow index is null after completing stage"
      );
      return "/";
    }

    // Generate URL for the next stage
    try {
      const url = get().goToStage(nextFlowIndex);
      console.log(`goToNextStage: Generated URL: ${url}`);
      return url;
    } catch (error) {
      console.error("goToNextStage: Error generating URL", error);
      return "/";
    }
  },

  // Generate the URL for a specific stage in the study flow
  goToStage: (stageIndex: number) => {
    const { currentScenario } = get();
    if (!currentScenario) return "/";

    // Get the stage type from the study flow
    const metadata = getScenarioMetadata(currentScenario);
    const studyFlow = metadata?.studyFlow || [];

    // Check if the study flow exists and the index is valid
    if (!studyFlow || !Array.isArray(studyFlow) || studyFlow.length === 0) {
      console.error(`No study flow found for scenario ${currentScenario}`);
      return "/";
    }

    if (stageIndex < 0 || stageIndex >= studyFlow.length) {
      console.error(
        `Invalid stage index: ${stageIndex} (max: ${studyFlow.length - 1})`
      );
      return "/";
    }

    // Make sure the stage at this index actually exists and has a type
    const stage = studyFlow[stageIndex];
    if (!stage || !stage.type) {
      console.error(
        `Invalid stage at index ${stageIndex}: ${JSON.stringify(stage)}`
      );
      return "/";
    }

    const stageType = stage.type as NavigationStage;

    // Parse the scenario ID to get study ID and session ID
    const { studyId, sessionId } = parseScenarioId(currentScenario);

    // For the SPA approach, return URL parameters instead of full URLs
    if (window && window.location) {
      // Create URL with parameters for the single-page app approach
      const params = new URLSearchParams();
      params.set("stage", stageType);
      params.set("flowIndex", stageIndex.toString());

      // For the main page, the base URL is /studyId/sessionId
      const basePath = `/${studyId}/${sessionId}`;
      return `${basePath}?${params.toString()}`;
    }

    // Legacy approach for server-side or fallback
    // For the main tasks stage, the URL is just /studyId/sessionId
    if (stageType === "task") {
      return `/${studyId}/${sessionId}`;
    }

    // For other stages, add the stage path
    return `/${studyId}/${sessionId}/${stageToPathMap[stageType]}`;
  },

  // Get URL parameters for a stage (used for SPA navigation)
  getStageParams: (stageIndex: number) => {
    const { currentScenario } = get();
    if (!currentScenario) return null;

    // Get the stage type from the study flow
    const metadata = getScenarioMetadata(currentScenario);
    const studyFlow = metadata?.studyFlow || [];

    // Check if the study flow exists and the index is valid
    if (
      !studyFlow ||
      !Array.isArray(studyFlow) ||
      studyFlow.length === 0 ||
      stageIndex < 0 ||
      stageIndex >= studyFlow.length
    ) {
      return null;
    }

    // Make sure the stage at this index actually exists and has a type
    const stage = studyFlow[stageIndex];
    if (!stage || !stage.type) {
      return null;
    }

    return {
      stage: stage.type as NavigationStage,
      flowIndex: stageIndex,
    };
  },

  // Check if a specific stage is completed for a scenario
  isStageCompleted: (scenario: ScenarioType, flowIndex: number): boolean => {
    const { scenarioProgress } = get();

    if (!scenarioProgress[scenario]) return false;

    // First check if the specific flow stage is completed
    if (scenarioProgress[scenario].completedStages[flowIndex]) {
      return true;
    }

    // Legacy compatibility check
    const metadata = getScenarioMetadata(scenario);
    const studyFlow = metadata?.studyFlow || [];

    if (flowIndex < 0 || flowIndex >= studyFlow.length) return false;

    const stageType = studyFlow[flowIndex].type as NavigationStage;

    // Fall back to legacy checks if flow stage isn't specifically marked
    switch (stageType) {
      case "intro":
        return scenarioProgress[scenario].introCompleted;
      case "training":
        return scenarioProgress[scenario].trainingCompleted;
      case "task":
        return scenarioProgress[scenario].tasksCompleted;
      case "complete":
        return scenarioProgress[scenario].tasksCompleted;
      default:
        return false;
    }
  },

  // Reset progress for a specific scenario
  resetScenarioProgress: (scenario: ScenarioType) => {
    const metadata = getScenarioMetadata(scenario);
    const studyFlow = metadata?.studyFlow || [];

    set((state) => ({
      scenarioProgress: {
        ...state.scenarioProgress,
        [scenario]: {
          ...createDefaultProgress(),
          completedStages: new Array(studyFlow.length).fill(false),
        },
      },
    }));
  },
}));
