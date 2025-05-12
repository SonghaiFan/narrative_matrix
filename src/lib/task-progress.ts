// Mock task progress utilities without local storage

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

// Mock in-memory store for task progress
const mockTaskProgressStore: Record<string, TaskProgress> = {};

// Get task progress from mock store
export const getTaskProgress = (userId: string): TaskProgress | null => {
  console.log("MOCK: getTaskProgress", { userId });
  return mockTaskProgressStore[userId] || null;
};

// Save task progress to mock store
export const saveTaskProgress = (
  userId: string,
  progress: Omit<TaskProgress, "userId" | "lastUpdated">
): void => {
  console.log("MOCK: saveTaskProgress", { userId, progress });

  const taskProgress: TaskProgress = {
    ...progress,
    userId,
    lastUpdated: new Date().toISOString(),
  };

  mockTaskProgressStore[userId] = taskProgress;
};

// Update task progress with new values
export const updateTaskProgress = (
  userId: string,
  updates: Partial<Omit<TaskProgress, "userId" | "lastUpdated">>
): TaskProgress | null => {
  console.log("MOCK: updateTaskProgress", { userId, updates });

  const currentProgress = getTaskProgress(userId);

  if (!currentProgress) {
    return null;
  }

  const updatedProgress: TaskProgress = {
    ...currentProgress,
    ...updates,
    lastUpdated: new Date().toISOString(),
  };

  mockTaskProgressStore[userId] = updatedProgress;
  return updatedProgress;
};

// Mark task as completed
export const markTaskAsCompleted = (userId: string): void => {
  console.log("MOCK: markTaskAsCompleted", { userId });

  const currentProgress = getTaskProgress(userId);

  if (currentProgress) {
    updateTaskProgress(userId, { isCompleted: true });
  }
};

// Check if user has completed tasks
export const hasCompletedTasks = (userId: string): boolean => {
  console.log("MOCK: hasCompletedTasks", { userId });
  const progress = getTaskProgress(userId);
  return progress?.isCompleted || false;
};

// Reset task progress
export const resetTaskProgress = (userId: string): void => {
  console.log("MOCK: resetTaskProgress", { userId });
  delete mockTaskProgressStore[userId];
};

// Reset all task progress
export const resetAllTaskProgress = (): void => {
  console.log("MOCK: resetAllTaskProgress");
  Object.keys(mockTaskProgressStore).forEach((key) => {
    delete mockTaskProgressStore[key];
  });
};
