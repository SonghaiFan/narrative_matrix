"use client";

import { useEffect } from "react";
import { QuizTimer } from "./quiz-timer";
import { useQuizStore } from "@/store/quiz-store";
import { QuizItem } from "./quiz-types";

interface QuizContainerProps {
  quiz: QuizItem;
  children: React.ReactNode;
  onSubmit: () => void;
}

export function QuizContainer({
  quiz,
  children,
  onSubmit,
}: QuizContainerProps) {
  const { setCurrentQuiz } = useQuizStore();

  useEffect(() => {
    setCurrentQuiz(quiz);
    return () => {
      // Reset quiz state on unmount
      setCurrentQuiz(quiz);
    };
  }, [quiz, setCurrentQuiz]);

  const handleTimeUp = () => {
    onSubmit();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">{quiz.question}</h2>
        {quiz.timeLimit && (
          <QuizTimer
            timeLimit={quiz.timeLimit}
            onTimeUp={handleTimeUp}
            className="ml-auto"
          />
        )}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
