import { db } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  Timestamp,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

// User operations
export async function createUser(
  prolificId: string,
  sessionId: string,
  role: "normal" | "domain" = "normal"
) {
  const userRef = doc(db, "users", prolificId);
  await setDoc(userRef, {
    prolificId,
    sessionId,
    role,
    createdAt: serverTimestamp(),
    lastActive: serverTimestamp(),
    currentScenario: "text-visual-1", // Default scenario
  });
  return userRef;
}

export async function updateUserLastActive(prolificId: string) {
  const userRef = doc(db, "users", prolificId);
  await updateDoc(userRef, {
    lastActive: serverTimestamp(),
  });
}

// Session operations
export async function createSession(
  prolificId: string,
  sessionId: string,
  scenarioType: string
) {
  const sessionRef = doc(db, "sessions", sessionId);
  await setDoc(sessionRef, {
    prolificId,
    sessionId,
    startTime: serverTimestamp(),
    status: "active",
    scenarioType,
    deviceInfo: {
      userAgent: navigator.userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
    },
  });
  return sessionRef;
}

export async function endSession(sessionId: string) {
  const sessionRef = doc(db, "sessions", sessionId);
  await updateDoc(sessionRef, {
    endTime: serverTimestamp(),
    status: "completed",
  });
}

// Task response operations
export async function saveTaskResponse(
  prolificId: string,
  sessionId: string,
  taskData: {
    scenarioId: string;
    taskId: string;
    question: string;
    userAnswer: string | string[];
    correctAnswer: string | string[];
    completionTime: number;
    markedEvents: number[];
    selectedEntityId: string | null;
    selectedTopic: string | null;
  }
) {
  const taskResponseRef = collection(db, "taskResponses");
  await addDoc(taskResponseRef, {
    prolificId,
    sessionId,
    ...taskData,
    timestamp: serverTimestamp(),
  });
}

// User interaction operations
export async function logUserInteraction(
  prolificId: string,
  sessionId: string,
  type: "event_mark" | "entity_select" | "topic_select" | "scenario_change",
  details: {
    eventId?: number;
    entityId?: string;
    topic?: string;
    scenario?: string;
  }
) {
  const interactionRef = collection(db, "userInteractions");
  await addDoc(interactionRef, {
    prolificId,
    sessionId,
    type,
    details,
    timestamp: serverTimestamp(),
  });
}

// Simple function to save a quiz response
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
) {
  try {
    const quizResponsesRef = collection(db, "quizResponses");
    await addDoc(quizResponsesRef, {
      prolificId,
      sessionId,
      ...quizData,
      timestamp: serverTimestamp(),
    });
    console.log("Quiz response saved successfully");
  } catch (error) {
    console.error("Error saving quiz response:", error);
  }
}

// Simple function to save user session
export async function saveUserSession(
  prolificId: string,
  sessionId: string,
  isTraining: boolean = false
) {
  try {
    // Use the sessionId as the document ID
    const sessionRef = doc(db, "sessions", sessionId);
    await setDoc(sessionRef, {
      prolificId,
      sessionId,
      startTime: serverTimestamp(),
      status: "active",
      isTraining,
      loginTime: Date.now(),
    });
    console.log("User session saved successfully");
    return sessionId; // Return the same sessionId since we used it as the document ID
  } catch (error) {
    console.error("Error saving user session:", error);
    return null;
  }
}

// Function to update session with completion time and feedback
export async function updateSessionCompletion(
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
) {
  try {
    const sessionRef = doc(db, "sessions", sessionId);
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

// Function to save task timing
export async function saveTaskTiming(
  prolificId: string,
  sessionId: string,
  taskData: {
    taskId: string;
    isTraining: boolean;
    startTime: number; // timestamp in milliseconds
    endTime: number; // timestamp in milliseconds
    totalTime: number; // duration in seconds
  }
) {
  try {
    const taskTimingsRef = collection(db, "taskTimings");
    await addDoc(taskTimingsRef, {
      prolificId,
      sessionId,
      ...taskData,
      timestamp: serverTimestamp(),
    });
    console.log("Task timing saved successfully");
  } catch (error) {
    console.error("Error saving task timing:", error);
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

// Function to save event interaction history
export async function saveEventInteraction(
  prolificId: string,
  sessionId: string,
  interactionData: {
    eventId: number;
    type: "focus" | "mark" | "unmark";
    timestamp: number;
    taskId?: string;
  }
) {
  try {
    const eventInteractionsRef = collection(db, "eventInteractions");
    await addDoc(eventInteractionsRef, {
      prolificId,
      sessionId,
      ...interactionData,
      timestamp: serverTimestamp(),
    });
    console.log("Event interaction saved successfully");
  } catch (error) {
    console.error("Error saving event interaction:", error);
  }
}
