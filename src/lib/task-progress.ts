// Task progress utilities for local storage

interface TaskAnswer {
  questionId: string;
  question: string;
  userAnswer: string;
  completed: boolean;
  startTimestamp?: number;
  submitTimestamp?: number;
  duration?: number | null;
}

// Survey data structure
export interface SurveyData {
  userId: string;
  tlxRatings: Record<string, number>;
  susRatings: number[];
  feedback: string;
  timestamp: string;
}

interface TaskProgress {
  userId: string;
  totalTasks: number;
  completedTasks: number;
  correctTasks: number;
  studyType: string;
  lastUpdated: string;
  isCompleted: boolean;
  answers?: TaskAnswer[];
  surveyData?: SurveyData;
}

// Helper functions to handle localStorage safely (with SSR support)
const getLocalStorage = (key: string): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(key);
  }
  return null;
};

const setLocalStorage = (key: string, value: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, value);
  }
};

const removeLocalStorage = (key: string): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(key);
  }
};

// Get task progress from local storage
export const getTaskProgress = (userId: string): TaskProgress | null => {
  const progressData = getLocalStorage(`taskProgress_${userId}`);
  if (!progressData) return null;

  try {
    return JSON.parse(progressData) as TaskProgress;
  } catch (error) {
    console.error("Failed to parse task progress:", error);
    return null;
  }
};

// Save task progress to local storage
export const saveTaskProgress = (
  userId: string,
  progress: Omit<TaskProgress, "userId" | "lastUpdated">
): void => {
  const taskProgress: TaskProgress = {
    ...progress,
    userId,
    lastUpdated: new Date().toISOString(),
  };

  try {
    setLocalStorage(`taskProgress_${userId}`, JSON.stringify(taskProgress));
  } catch (error) {
    console.error("Failed to save task progress:", error);
  }
};

// Update task progress with new values
export const updateTaskProgress = (
  userId: string,
  updates: Partial<Omit<TaskProgress, "userId" | "lastUpdated">>
): TaskProgress | null => {
  const currentProgress = getTaskProgress(userId);

  if (!currentProgress) {
    return null;
  }

  const updatedProgress: TaskProgress = {
    ...currentProgress,
    ...updates,
    lastUpdated: new Date().toISOString(),
  };

  try {
    setLocalStorage(`taskProgress_${userId}`, JSON.stringify(updatedProgress));
    return updatedProgress;
  } catch (error) {
    console.error("Failed to update task progress:", error);
    return null;
  }
};

// Mark task as completed
export const markTaskAsCompleted = (userId: string): void => {
  const currentProgress = getTaskProgress(userId);

  if (currentProgress) {
    updateTaskProgress(userId, { isCompleted: true });
  }
};

// Check if user has completed tasks
export const hasCompletedTasks = (userId: string): boolean => {
  const progress = getTaskProgress(userId);
  return progress?.isCompleted || false;
};

// Reset task progress (for domain users)
export const resetTaskProgress = (userId: string): void => {
  removeLocalStorage(`taskProgress_${userId}`);
};

// Reset all task progress (admin function)
export const resetAllTaskProgress = (): void => {
  if (typeof window === "undefined") return;

  // Get all keys from localStorage
  const keys = Object.keys(localStorage);

  // Filter keys that start with 'taskProgress_'
  const progressKeys = keys.filter((key) => key.startsWith("taskProgress_"));

  // Remove each task progress entry
  progressKeys.forEach((key) => {
    removeLocalStorage(key);
  });
};
