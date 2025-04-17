import { create } from "zustand";
import { QuizItem } from "@/components/features/task/quiz-types";

interface QuizState {
  currentQuiz: QuizItem | null;
  currentQuizCompletionTime: number | null;
  userAnswer: string | string[] | null;
  setCurrentQuiz: (quiz: QuizItem) => void;
  setCurrentQuizCompletionTime: (time: number) => void;
  setUserAnswer: (answer: string | string[] | null) => void;
  resetQuiz: () => void;
}

export const useQuizStore = create<QuizState>((set) => ({
  currentQuiz: null,
  currentQuizCompletionTime: null,
  userAnswer: null,
  setCurrentQuiz: (quiz) => set({ currentQuiz: quiz }),
  setCurrentQuizCompletionTime: (time) =>
    set({ currentQuizCompletionTime: time }),
  setUserAnswer: (answer) => set({ userAnswer: answer }),
  resetQuiz: () =>
    set({
      currentQuiz: null,
      currentQuizCompletionTime: null,
      userAnswer: null,
    }),
}));
