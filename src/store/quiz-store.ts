import { create } from "zustand";
import { QuizItem } from "@/components/features/task/quiz-types";
import { saveQuizResponse } from "@/lib/firebase-operations";

interface QuizState {
  currentQuiz: QuizItem | null;
  currentQuizCompletionTime: number | null;
  userAnswer: string | string[] | null;
  setCurrentQuiz: (quiz: QuizItem) => void;
  setCurrentQuizCompletionTime: (time: number) => void;
  setUserAnswer: (answer: string | string[] | null) => void;
  resetQuiz: () => void;
  saveQuizResponse: (
    prolificId: string,
    sessionId: string,
    quiz: QuizItem,
    answer: string | string[],
    time: number
  ) => Promise<void>;
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
  saveQuizResponse: async (prolificId, sessionId, quiz, answer, time) => {
    try {
      await saveQuizResponse(prolificId, sessionId, {
        question: quiz.question,
        userAnswer: answer,
        completionTime: time,
      });
    } catch (error) {
      console.error("Failed to save quiz response:", error);
    }
  },
}));
