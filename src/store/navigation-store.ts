import { create } from "zustand";
import { ScenarioType } from "@/types/scenario";

export type NavigationStage = "intro" | "training" | "tasks" | "complete";

// The app's navigation flow stages in order
export const NAVIGATION_STAGES: NavigationStage[] = [
  "intro",
  "training",
  "tasks",
  "complete",
];

export interface ScenarioProgress {
  introCompleted: boolean;
  trainingCompleted: boolean;
  tasksCompleted: boolean;
  currentStage: NavigationStage;
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
  goToStage: (stage: NavigationStage) => string; // Returns the URL for a specific stage

  // Helper to check stage completion
  isStageCompleted: (scenario: ScenarioType, stage: NavigationStage) => boolean;

  // Reset progress for a scenario
  resetScenarioProgress: (scenario: ScenarioType) => void;
}

// Mapping stage to URL path segment
const stageToPathMap: Record<NavigationStage, string> = {
  intro: "introduction",
  training: "training",
  tasks: "", // Root scenario path
  complete: "completion",
};

// Default scenario progress template
const createDefaultProgress = (): ScenarioProgress => ({
  introCompleted: false,
  trainingCompleted: false,
  tasksCompleted: false,
  currentStage: "intro",
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

    // Create default progress if this is the first time seeing this scenario
    if (!scenarioProgress[scenario]) {
      set((state) => ({
        currentScenario: scenario,
        scenarioProgress: {
          ...state.scenarioProgress,
          [scenario]: createDefaultProgress(),
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

    return scenarioProgress[currentScenario]?.currentStage || "intro";
  },

  // Get the next stage in the navigation flow
  getNextStage: () => {
    const { getCurrentStage } = get();
    const currentStage = getCurrentStage();
    if (!currentStage) return null;

    const currentIndex = NAVIGATION_STAGES.indexOf(currentStage);
    if (currentIndex === -1 || currentIndex === NAVIGATION_STAGES.length - 1) {
      return null;
    }

    return NAVIGATION_STAGES[currentIndex + 1];
  },

  // Mark the current stage as completed and advance to the next stage
  completeCurrentStage: () => {
    const { currentScenario, getCurrentStage, getNextStage } = get();
    if (!currentScenario) return;

    const currentStage = getCurrentStage();
    if (!currentStage) return;

    const nextStage = getNextStage();

    set((state) => {
      const updatedProgress = { ...state.scenarioProgress[currentScenario] };

      // Mark current stage as completed
      if (currentStage === "intro") updatedProgress.introCompleted = true;
      if (currentStage === "training") updatedProgress.trainingCompleted = true;
      if (currentStage === "tasks") updatedProgress.tasksCompleted = true;

      // Advance to next stage if available
      if (nextStage) {
        updatedProgress.currentStage = nextStage;
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
    const { currentScenario, getNextStage, completeCurrentStage } = get();
    if (!currentScenario) return "/";

    completeCurrentStage();
    const nextStage = getNextStage();
    if (!nextStage) return "/";

    return get().goToStage(nextStage);
  },

  // Generate the URL for a specific stage of the current scenario
  goToStage: (stage: NavigationStage) => {
    const { currentScenario } = get();
    if (!currentScenario) return "/";

    // Parse the scenario ID to get study ID and session ID
    const { studyId, sessionId } = parseScenarioId(currentScenario);

    // For the main tasks stage, the URL is just /studyId/sessionId
    if (stage === "tasks") {
      return `/${studyId}/${sessionId}`;
    }

    // For other stages, add the stage path
    return `/${studyId}/${sessionId}/${stageToPathMap[stage]}`;
  },

  // Check if a specific stage is completed for a scenario
  isStageCompleted: (
    scenario: ScenarioType,
    stage: NavigationStage
  ): boolean => {
    const { scenarioProgress } = get();

    if (!scenarioProgress[scenario]) return false;

    switch (stage) {
      case "intro":
        return scenarioProgress[scenario].introCompleted;
      case "training":
        return scenarioProgress[scenario].trainingCompleted;
      case "tasks":
        return scenarioProgress[scenario].tasksCompleted;
      case "complete":
        return scenarioProgress[scenario].tasksCompleted;
      default:
        return false;
    }
  },

  // Reset progress for a specific scenario
  resetScenarioProgress: (scenario: ScenarioType) => {
    set((state) => ({
      scenarioProgress: {
        ...state.scenarioProgress,
        [scenario]: createDefaultProgress(),
      },
    }));
  },
}));
