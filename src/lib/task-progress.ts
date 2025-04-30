// Task progress utilities for local storage

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TaskAnswer {
  questionId: string;
  question: string;
  userAnswer: string | string[];
  userEventReference?: number | number[] | null;
  completed: boolean;
  startTimestamp?: number;
  submitTimestamp?: number;
  isTimeExpired?: boolean;
  duration: number | null;
}

// Survey data structure
export interface SurveyData {
  userId: string;
  tlxRatings: Record<string, number>;
  susRatings: number[];
  feedback: string;
  recallAnswers?: Record<string, string>;
  timestamp: string;
}

export interface TaskProgress {
  userId: string;
  totalTasks: number;
  completedTasks: number;
  correctTasks: number;
  studyType: string;
  isCompleted?: boolean;
  lastUpdated: string;
  totalSessionTime?: number; // Total time spent on all tasks in seconds
  answers: TaskAnswer[];
  surveyData?: SurveyData;
}

interface TaskProgressStore {
  tasks: Record<string, TaskProgress>; // userId -> TaskProgress
  getTaskProgress: (userId: string) => TaskProgress | null;
  saveTaskProgress: (
    userId: string,
    progress: Omit<TaskProgress, "userId" | "lastUpdated">
  ) => void;
  updateTaskProgress: (
    userId: string,
    updates: Partial<Omit<TaskProgress, "userId" | "lastUpdated">>
  ) => TaskProgress | null;
  markTaskAsCompleted: (userId: string) => void;
  hasCompletedTasks: (userId: string) => boolean;
  resetTaskProgress: (userId: string) => void;
  resetAllTaskProgress: () => void;
}

export const useTaskProgressStore = create<TaskProgressStore>()(
  persist(
    (set, get) => ({
      tasks: {},

      getTaskProgress: (userId: string) => {
        return get().tasks[userId] || null;
      },

      saveTaskProgress: (userId: string, progress) => {
        set((state) => ({
          tasks: {
            ...state.tasks,
            [userId]: {
              ...progress,
              userId,
              lastUpdated: new Date().toISOString(),
            },
          },
        }));
      },

      updateTaskProgress: (userId: string, updates) => {
        const currentProgress = get().getTaskProgress(userId);
        if (!currentProgress) return null;

        const updatedProgress: TaskProgress = {
          ...currentProgress,
          ...updates,
          lastUpdated: new Date().toISOString(),
        };

        set((state) => ({
          tasks: {
            ...state.tasks,
            [userId]: updatedProgress,
          },
        }));

        return updatedProgress;
      },

      markTaskAsCompleted: (userId: string) => {
        const currentProgress = get().getTaskProgress(userId);
        if (currentProgress) {
          get().updateTaskProgress(userId, { isCompleted: true });
        }
      },

      hasCompletedTasks: (userId: string) => {
        const progress = get().getTaskProgress(userId);
        return progress?.isCompleted || false;
      },

      resetTaskProgress: (userId: string) => {
        set((state) => {
          const { [userId]: _, ...rest } = state.tasks;
          return { tasks: rest };
        });
      },

      resetAllTaskProgress: () => {
        set({ tasks: {} });
      },
    }),
    {
      name: "task-progress",
      partialize: (state) => ({ tasks: state.tasks }),
    }
  )
);

// Export the old function names but using the new store
export const getTaskProgress = (userId: string) =>
  useTaskProgressStore.getState().getTaskProgress(userId);
export const saveTaskProgress = (
  userId: string,
  progress: Omit<TaskProgress, "userId" | "lastUpdated">
) => useTaskProgressStore.getState().saveTaskProgress(userId, progress);
export const updateTaskProgress = (
  userId: string,
  updates: Partial<Omit<TaskProgress, "userId" | "lastUpdated">>
) => useTaskProgressStore.getState().updateTaskProgress(userId, updates);
export const markTaskAsCompleted = (userId: string) =>
  useTaskProgressStore.getState().markTaskAsCompleted(userId);
export const hasCompletedTasks = (userId: string) =>
  useTaskProgressStore.getState().hasCompletedTasks(userId);
export const resetTaskProgress = (userId: string) =>
  useTaskProgressStore.getState().resetTaskProgress(userId);
export const resetAllTaskProgress = () =>
  useTaskProgressStore.getState().resetAllTaskProgress();
