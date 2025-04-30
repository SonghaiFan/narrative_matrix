import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Stage } from "@/config/study-flow";

export type StudyProgress = {
  completedStages: {
    intro?: boolean;
    training: { [round: number]: boolean };
    main: { [round: number]: boolean };
    completion?: boolean;
  };
};

type ProgressStore = {
  progress: { [key: string]: StudyProgress }; // key is `${studyId}-${sessionId}`
  isStageCompleted: (
    studyId: string,
    sessionId: string,
    stage: Stage
  ) => boolean;
  markStageCompleted: (
    studyId: string,
    sessionId: string,
    stage: Stage
  ) => void;
  resetProgress: (studyId: string, sessionId: string) => void;
};

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      progress: {},

      isStageCompleted: (studyId: string, sessionId: string, stage: Stage) => {
        const key = `${studyId}-${sessionId}`;
        const progress = get().progress[key];

        if (!progress) return false;

        switch (stage.type) {
          case "intro":
            return progress.completedStages.intro || false;
          case "training":
            return progress.completedStages.training[stage.round || 1] || false;
          case "main":
            return progress.completedStages.main[stage.round || 1] || false;
          case "completion":
            return progress.completedStages.completion || false;
          default:
            return false;
        }
      },

      markStageCompleted: (
        studyId: string,
        sessionId: string,
        stage: Stage
      ) => {
        const key = `${studyId}-${sessionId}`;

        set((state) => {
          const currentProgress = state.progress[key] || {
            completedStages: {
              training: {},
              main: {},
            },
          };

          const updatedProgress = { ...currentProgress };

          switch (stage.type) {
            case "intro":
              updatedProgress.completedStages.intro = true;
              break;
            case "training":
              updatedProgress.completedStages.training[stage.round || 1] = true;
              break;
            case "main":
              updatedProgress.completedStages.main[stage.round || 1] = true;
              break;
            case "completion":
              updatedProgress.completedStages.completion = true;
              break;
          }

          return {
            progress: {
              ...state.progress,
              [key]: updatedProgress,
            },
          };
        });
      },

      resetProgress: (studyId: string, sessionId: string) => {
        const key = `${studyId}-${sessionId}`;
        set((state) => ({
          progress: {
            ...state.progress,
            [key]: {
              completedStages: {
                training: {},
                main: {},
              },
            },
          },
        }));
      },
    }),
    {
      name: "study-progress",
      // Only persist the progress object
      partialize: (state) => ({ progress: state.progress }),
      // Optional: Add storage configuration
      storage:
        typeof window !== "undefined"
          ? window.localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            },
    }
  )
);
