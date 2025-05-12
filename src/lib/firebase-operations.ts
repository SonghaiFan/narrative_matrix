// Mock Firebase operations

export async function createUser(
  prolificId: string,
  sessionId: string,
  senarioId: string,
  role: "normal" | "domain" = "normal"
) {
  console.log("MOCK: createUser", { prolificId, sessionId, senarioId, role });
  return { id: prolificId };
}

export async function updateUserLastActive(prolificId: string) {
  console.log("MOCK: updateUserLastActive", { prolificId });
  return true;
}

export async function createSession(
  prolificId: string,
  scenarioType: string,
  options: {
    existingSessionId?: string;
    isTraining?: boolean;
    includeDeviceInfo?: boolean;
  } = {}
) {
  console.log("MOCK: createSession", { prolificId, scenarioType, options });
  const uniqueSessionId =
    options.existingSessionId || `${prolificId}_${Date.now()}`;
  return { sessionRef: { id: uniqueSessionId }, sessionId: uniqueSessionId };
}

export async function endSession(uniqueSessionId: string) {
  console.log("MOCK: endSession", { uniqueSessionId });
  return true;
}

export async function saveQuizResponse(
  prolificId: string,
  uniqueSessionId: string,
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
) {
  console.log("MOCK: saveQuizResponse", {
    prolificId,
    uniqueSessionId,
    quizData,
  });
  return true;
}

export async function updateSessionCompletion(
  uniqueSessionId: string,
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
) {
  console.log("MOCK: updateSessionCompletion", { uniqueSessionId, feedback });
  return true;
}

export async function saveFeedback(
  userId: string,
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
) {
  console.log("MOCK: saveFeedback", { userId, feedback });
  return true;
}
