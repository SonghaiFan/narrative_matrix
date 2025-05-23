/**
 * Client utility functions for interacting with submission API endpoints
 */

// Submit a quiz response
export async function saveQuizResponse(
  prolificId: string,
  sessionId: string,
  quizData: {
    question: string;
    userAnswer: string | string[];
    markedEvents: number[];
    isSkipped: boolean;
    isTimeUp: boolean;
    isTraining: boolean;
    taskId: string;
    startTime: number;
    endTime: number;
  }
): Promise<boolean> {
  try {
    const response = await fetch("/api/submit/quiz", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prolificId,
        sessionId,
        quizData,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to submit quiz response");
    }

    return true;
  } catch (error) {
    console.error("Error submitting quiz response:", error);
    return false;
  }
}

// Submit user feedback
export async function saveFeedback(
  userId: string,
  sessionId: string,
  feedback: {
    visualizationUsage: {
      frequency: number;
      helpfulness: number;
      preference: number;
    };
    experience: {
      withVisualization: number;
      withoutVisualization: number;
      overall: number;
    };
    visualizationRatings: {
      entity: number;
      topic: number;
      time: number;
    };
    comments?: string;
  }
): Promise<boolean> {
  try {
    const response = await fetch("/api/submit/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        sessionId,
        feedback,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to submit feedback");
    }

    return true;
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return false;
  }
}

// Legacy alias for saveFeedback (to maintain backward compatibility)
export const updateSessionCompletion = saveFeedback;

// Start a user session
export async function startSession(
  prolificId: string,
  studyId: string,
  sessionId: string,
  scenarioType: string,
  options: {
    role?: "normal" | "domain";
    isTraining?: boolean;
    deviceInfo?: Record<string, any>;
  } = {}
): Promise<{ userId: string; sessionId: string }> {
  try {
    const response = await fetch("/api/session/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prolificId,
        studyId,
        sessionId,
        scenarioType,
        ...options,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to start session");
    }

    const data = await response.json();
    return {
      userId: data.userId,
      sessionId: data.sessionId,
    };
  } catch (error) {
    console.error("Error starting session:", error);
    // Fallback with local values if API fails
    return {
      userId: prolificId,
      sessionId: `${prolificId}_${Date.now()}`,
    };
  }
}

// End a user session
export async function endSession(
  sessionId: string,
  completionData?: {
    totalTasks?: number;
    completedTasks?: number;
    totalTime?: number;
  }
): Promise<boolean> {
  try {
    const response = await fetch("/api/session/end", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
        completionData,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to end session");
    }

    return true;
  } catch (error) {
    console.error("Error ending session:", error);
    return false;
  }
}

// Legacy functions for backward compatibility
export async function createUser(prolificId: string) {
  console.warn("DEPRECATED: Use startSession instead of createUser");
  return { id: prolificId };
}

export async function createSession(
  prolificId: string,
  scenarioType: string,
  options: {
    existingSessionId?: string;
    isTraining?: boolean;
  } = {}
) {
  console.warn("DEPRECATED: Use startSession instead of createSession");

  const uniqueSessionId =
    options.existingSessionId || `${prolificId}_${Date.now()}`;

  return startSession(prolificId, "unknown", uniqueSessionId, scenarioType, {
    isTraining: options.isTraining,
  });
}

export async function updateUserLastActive(prolificId: string) {
  console.warn("DEPRECATED: updateUserLastActive is no longer supported");
  return true;
}
