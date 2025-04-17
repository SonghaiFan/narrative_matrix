import { create } from "zustand";
import { QuizItem } from "@/components/features/task/quiz-types";

interface TaskState {
  currentTask: QuizItem | null;
  setCurrentTask: (task: QuizItem | null) => void;
  userAnswer: string | string[] | null;
  setUserAnswer: (answer: string | string[] | null) => void;
  resetTask: () => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  currentTask: null,
  setCurrentTask: (task) => set({ currentTask: task }),
  userAnswer: null,
  setUserAnswer: (answer) => set({ userAnswer: answer }),
  resetTask: () => set({ currentTask: null, userAnswer: null }),
}));
