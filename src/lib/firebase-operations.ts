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
  getDocs,
  query,
  where,
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
    completionTime: number;
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
    const sessionsRef = collection(db, "sessions");
    const sessionDoc = await addDoc(sessionsRef, {
      prolificId,
      sessionId,
      startTime: serverTimestamp(),
      status: "active",
      isTraining,
      loginTime: Date.now(),
    });
    console.log("User session saved successfully");
    return sessionDoc.id;
  } catch (error) {
    console.error("Error saving user session:", error);
    return null;
  }
}

// Function to update session with completion time and feedback
export async function updateSessionCompletion(
  prolificId: string,
  feedback: {
    visualizationTasks: {
      frequency: {
        alwaysUsed: number;
        sometimesUsed: number;
        rarelyUsed: number;
      };
      helpfulness: {
        veryHelpful: number;
        somewhatHelpful: number;
        notHelpful: number;
      };
      preferredMethod: {
        visualization: number;
        text: number;
        both: number;
      };
    };
    textOnlyTasks: {
      difficulty: number;
      wouldHaveBenefitedFromVisualization: number;
    };
    overall: {
      visualizationPreference: "always" | "sometimes" | "never";
      visualizationImpact: "positive" | "neutral" | "negative";
      suggestions: string;
    };
    priorExperience: number;
    comments: string;
  }
) {
  try {
    const sessionsRef = collection(db, "sessions");
    const q = query(
      sessionsRef,
      where("prolificId", "==", prolificId),
      where("status", "==", "in_progress")
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("No active session found");
    }

    const sessionDoc = querySnapshot.docs[0];
    await updateDoc(sessionDoc.ref, {
      status: "completed",
      endTime: serverTimestamp(),
      feedback: {
        visualizationTasks: feedback.visualizationTasks,
        textOnlyTasks: feedback.textOnlyTasks,
        overall: feedback.overall,
        priorExperience: feedback.priorExperience,
        comments: feedback.comments,
        timestamp: serverTimestamp(),
      },
    });
  } catch (error) {
    console.error("Error updating session completion:", error);
    throw error;
  }
}

// Function to save task timing
export async function saveTaskTiming(
  prolificId: string,
  sessionId: string,
  taskData: {
    taskId: string;
    isTraining: boolean;
    startTime: number;
    endTime: number;
    totalTime: number;
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
