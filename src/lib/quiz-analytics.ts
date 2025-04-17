import { QuizItem } from "@/components/features/task/quiz-types";

interface QuizAnalytics {
  quizId: string;
  completionTime: number;
  isCompleted: boolean;
  wasAutoSubmitted: boolean;
  timestamp: number;
  userAnswer: string | string[] | null;
  correctAnswer: string | string[];
}

export function trackQuizCompletion(
  quiz: QuizItem,
  completionTime: number,
  userAnswer: string | string[] | null,
  wasAutoSubmitted = false
): QuizAnalytics {
  const analytics: QuizAnalytics = {
    quizId: quiz.id,
    completionTime,
    isCompleted: quiz.completed,
    wasAutoSubmitted,
    timestamp: Date.now(),
    userAnswer,
    correctAnswer: quiz.answer,
  };

  // Here you would typically send this data to your analytics service
  console.log("Quiz Analytics:", analytics);

  return analytics;
}

function calculateAverageCompletionTime(analytics: QuizAnalytics[]) {
  if (analytics.length === 0) return 0;
  const totalTime = analytics.reduce((sum, a) => sum + a.completionTime, 0);
  return totalTime / analytics.length;
}

export function getQuizPerformanceMetrics(analytics: QuizAnalytics[]) {
  const completedQuizzes = analytics.filter((a) => a.isCompleted);
  const autoSubmittedQuizzes = analytics.filter((a) => a.wasAutoSubmitted);

  return {
    totalQuizzes: analytics.length,
    completedQuizzes: completedQuizzes.length,
    autoSubmittedQuizzes: autoSubmittedQuizzes.length,
    averageCompletionTime: calculateAverageCompletionTime(analytics),
    completionRate: (completedQuizzes.length / analytics.length) * 100,
  };
}
