import { create } from "zustand";
import { persist } from "zustand/middleware";
import { QuizItem } from "@/components/features/task/quiz-types";

interface TaskAnswer {
  questionId: string;
  question: string;
  userAnswer: string;
  userEventReference?: number | number[] | null;
  completed: boolean;
  startTimestamp?: number;
  submitTimestamp?: number;
  isTimeExpired?: boolean;
  duration: number | null;
}

interface TaskProgress {
  userId: string;
  totalTasks: number;
  completedTasks: number;
  correctTasks: number;
  studyType: string;
  isCompleted: boolean;
  totalSessionTime: number;
  answers: TaskAnswer[];
  lastUpdated: string;
}

interface TaskState {
  // Current task state
  currentTask: QuizItem | null;
  currentTaskIndex: number;
  userAnswer: string;
  isSubmitting: boolean;

  // Task collection state
  tasks: QuizItem[];

  // Progress tracking
  taskProgress: Record<string, TaskProgress>;

  // Training completion tracking
  completedTraining: Record<string, boolean>;

  // Actions
  setCurrentTask: (task: QuizItem | null) => void;
  setCurrentTaskIndex: (index: number) => void;
  setUserAnswer: (answer: string) => void;
  setIsSubmitting: (submitting: boolean) => void;
  setTasks: (tasks: QuizItem[]) => void;

  // Progress actions
  saveTaskProgress: (
    userId: string,
    progress: Omit<TaskProgress, "userId" | "lastUpdated">
  ) => void;
  updateTaskProgress: (
    userId: string,
    updates: Partial<Omit<TaskProgress, "userId" | "lastUpdated">>
  ) => void;
  getTaskProgress: (userId: string) => TaskProgress | null;
  markTaskAsCompleted: (userId: string) => void;

  // Training actions
  setTrainingCompleted: (scenarioKey: string, completed: boolean) => void;
  getTrainingCompleted: (scenarioKey: string) => boolean;

  // Reset actions
  resetTask: () => void;
  resetAllProgress: () => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentTask: null,
      currentTaskIndex: 0,
      userAnswer: "",
      isSubmitting: false,
      tasks: [],
      taskProgress: {},
      completedTraining: {},

      // Current task actions
      setCurrentTask: (task) => set({ currentTask: task }),
      setCurrentTaskIndex: (index) => set({ currentTaskIndex: index }),
      setUserAnswer: (answer) => set({ userAnswer: answer }),
      setIsSubmitting: (submitting) => set({ isSubmitting: submitting }),
      setTasks: (tasks) => set({ tasks }),

      // Progress actions
      saveTaskProgress: (userId, progress) =>
        set((state) => ({
          taskProgress: {
            ...state.taskProgress,
            [userId]: {
              ...progress,
              userId,
              lastUpdated: new Date().toISOString(),
            },
          },
        })),

      updateTaskProgress: (userId, updates) =>
        set((state) => {
          const currentProgress = state.taskProgress[userId];
          if (!currentProgress) return state;

          return {
            taskProgress: {
              ...state.taskProgress,
              [userId]: {
                ...currentProgress,
                ...updates,
                lastUpdated: new Date().toISOString(),
              },
            },
          };
        }),

      getTaskProgress: (userId) => {
        return get().taskProgress[userId] || null;
      },

      markTaskAsCompleted: (userId) =>
        set((state) => {
          const currentProgress = state.taskProgress[userId];
          if (!currentProgress) return state;

          return {
            taskProgress: {
              ...state.taskProgress,
              [userId]: {
                ...currentProgress,
                isCompleted: true,
                lastUpdated: new Date().toISOString(),
              },
            },
          };
        }),

      // Training actions
      setTrainingCompleted: (scenarioKey, completed) =>
        set((state) => ({
          completedTraining: {
            ...state.completedTraining,
            [scenarioKey]: completed,
          },
        })),

      getTrainingCompleted: (scenarioKey) => {
        return get().completedTraining[scenarioKey] || false;
      },

      // Reset actions
      resetTask: () =>
        set({
          currentTask: null,
          currentTaskIndex: 0,
          userAnswer: "",
          isSubmitting: false,
        }),

      resetAllProgress: () =>
        set({
          taskProgress: {},
          completedTraining: {},
          currentTask: null,
          currentTaskIndex: 0,
          userAnswer: "",
          isSubmitting: false,
          tasks: [],
        }),
    }),
    {
      name: "task-storage", // unique name for localStorage key
      partialize: (state) => ({
        taskProgress: state.taskProgress,
        completedTraining: state.completedTraining,
      }), // only persist progress data, not current session state
    }
  )
);
