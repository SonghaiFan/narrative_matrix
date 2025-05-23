import { create } from "zustand";

export type StudyStage =
  | "consent"
  | "login"
  | "instructions"
  | "training"
  | "quiz"
  | "feedback"
  | "completion";

interface StageTimingData {
  start?: number;
  end?: number;
}

interface StudyState {
  // Session identification
  userId: string;
  sessionId: string;
  studyId: string;

  // Current stage information
  currentStage: StudyStage | null;
  stageTimings: Record<StudyStage, StageTimingData>;

  // Set session identifiers
  setSessionInfo: (userId: string, sessionId: string, studyId: string) => void;

  // Stage management
  startStage: (stage: StudyStage) => void;
  endStage: (stage: StudyStage) => void;

  // Get current stage progress
  getCurrentStageDuration: () => number | null;

  // Reset progress
  resetProgress: () => void;
}

// Default empty timing data
const createEmptyTimings = (): Record<StudyStage, StageTimingData> => ({
  consent: {},
  login: {},
  instructions: {},
  training: {},
  quiz: {},
  feedback: {},
  completion: {},
});

export const useStudyStore = create<StudyState>((set, get) => ({
  // Default session identification (empty)
  userId: "",
  sessionId: "",
  studyId: "",

  // Default stage information
  currentStage: null,
  stageTimings: createEmptyTimings(),

  // Set session identifiers
  setSessionInfo: (userId, sessionId, studyId) => {
    set({ userId, sessionId, studyId });
  },

  // Start tracking a new stage
  startStage: (stage) => {
    const startTime = Date.now();

    // Update local state
    set((state) => {
      const newTimings = { ...state.stageTimings };
      newTimings[stage] = { ...newTimings[stage], start: startTime };

      return {
        currentStage: stage,
        stageTimings: newTimings,
      };
    });
  },

  // End tracking the current stage
  endStage: (stage) => {
    const endTime = Date.now();

    // Update local state
    set((state) => {
      const newTimings = { ...state.stageTimings };
      newTimings[stage] = {
        ...newTimings[stage],
        end: endTime,
      };

      return {
        stageTimings: newTimings,
      };
    });
  },

  // Get the current stage duration (if active)
  getCurrentStageDuration: () => {
    const { currentStage, stageTimings } = get();

    if (!currentStage || !stageTimings[currentStage].start) {
      return null;
    }

    const startTime = stageTimings[currentStage].start;
    const endTime = stageTimings[currentStage].end || Date.now();

    return endTime - startTime;
  },

  // Reset progress
  resetProgress: () => {
    set({
      currentStage: null,
      stageTimings: createEmptyTimings(),
    });
  },
}));
