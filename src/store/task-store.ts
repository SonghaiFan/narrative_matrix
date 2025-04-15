import { create } from "zustand";
import { QuizItem } from "@/components/features/task/quiz-types";

interface TaskState {
  currentTask: QuizItem | null;
  setCurrentTask: (task: QuizItem | null) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  currentTask: null,
  setCurrentTask: (task) => set({ currentTask: task }),
}));
