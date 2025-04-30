import { db } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

// User operations
export async function createUser(
  prolificId: string,
  sessionId: string,
  senarioId: string,
  role: "normal" | "domain" = "normal"
) {
  const userRef = doc(db, "users", prolificId);
  await setDoc(userRef, {
    prolificId,
    sessionId,
    role,
    createdAt: serverTimestamp(),
    lastActive: serverTimestamp(),
    currentScenario: senarioId,
  });
  return userRef;
}

// Session operations
export async function createSession(
  prolificId: string,
  scenarioType: string,
  options: {
    existingSessionId?: string;
    isTraining?: boolean;
    includeDeviceInfo?: boolean;
  } = {}
) {
  const {
    existingSessionId,
    isTraining = false,
    includeDeviceInfo = true,
  } = options;

  // Use existing ID if provided (for continuity) or generate a truly unique session ID
  const uniqueSessionId = existingSessionId || `${prolificId}_${Date.now()}`;

  const sessionRef = doc(db, "sessions", uniqueSessionId);

  const sessionData: any = {
    prolificId,
    sessionId: uniqueSessionId,
    scenarioId: scenarioType,
    startTime: serverTimestamp(),
    status: "active",
    isTraining,
    loginTime: Date.now(),
  };

  if (includeDeviceInfo) {
    sessionData.deviceInfo = {
      userAgent: navigator.userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
    };
  }

  await setDoc(sessionRef, sessionData);
  console.log("Session created successfully with ID:", uniqueSessionId);
  return { sessionRef, sessionId: uniqueSessionId };
}

export async function endSession(uniqueSessionId: string) {
  try {
    const sessionRef = doc(db, "sessions", uniqueSessionId);
    await updateDoc(sessionRef, {
      endTime: serverTimestamp(),
      status: "completed",
    });
    console.log("Session ended successfully");
  } catch (error) {
    console.error("Error ending session:", error);
  }
}

// Simple function to save a quiz response
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
  try {
    const quizResponsesRef = collection(db, "quizResponses");
    await addDoc(quizResponsesRef, {
      prolificId,
      sessionId: uniqueSessionId,
      ...quizData,
      timestamp: serverTimestamp(),
    });
    console.log("Quiz response saved successfully");
  } catch (error) {
    console.error("Error saving quiz response:", error);
  }
}

// Function to update session with completion time and feedback
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
  try {
    const sessionRef = doc(db, "sessions", uniqueSessionId);
    await updateDoc(sessionRef, {
      endTime: serverTimestamp(),
      status: "completed",
      completionTime: Date.now(),
      feedback: {
        ...feedback,
        timestamp: serverTimestamp(),
      },
    });
    console.log("Session completion updated successfully");
  } catch (error) {
    console.error("Error updating session completion:", error);
  }
}

// Function to save study feedback
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
  try {
    const feedbackRef = collection(db, "feedback");
    await addDoc(feedbackRef, {
      userId,
      feedback,
      timestamp: serverTimestamp(),
      deviceInfo: {
        userAgent: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
      },
    });
    console.log("Feedback saved successfully");
    return true;
  } catch (error) {
    console.error("Error saving feedback:", error);
    throw error;
  }
}
