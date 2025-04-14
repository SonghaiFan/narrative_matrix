import { create } from "zustand";
import { QuizItem } from "@/components/features/task/quiz-types";

interface QuizState {
  currentQuiz: QuizItem | null;
  currentQuizCompletionTime: number | null;
  setCurrentQuiz: (quiz: QuizItem) => void;
  setCurrentQuizCompletionTime: (time: number) => void;
  resetQuiz: () => void;
}

export const useQuizStore = create<QuizState>((set) => ({
  currentQuiz: null,
  currentQuizCompletionTime: null,
  setCurrentQuiz: (quiz) => set({ currentQuiz: quiz }),
  setCurrentQuizCompletionTime: (time) =>
    set({ currentQuizCompletionTime: time }),
  resetQuiz: () => set({ currentQuiz: null, currentQuizCompletionTime: null }),
}));
