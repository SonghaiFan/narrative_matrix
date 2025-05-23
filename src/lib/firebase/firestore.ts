/**
 * Firebase Firestore utility functions for working with study data
 * Collections: users, sessions, tasks, feedback
 */

import { db } from "./config";
import {
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  arrayUnion,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

// Collection references
const usersCollection = collection(db, "users");
const sessionsCollection = collection(db, "sessions");
const tasksCollection = collection(db, "tasks");
const feedbackCollection = collection(db, "feedback");

// User functions
export async function createOrUpdateUser(prolificId: string) {
  try {
    const userRef = doc(usersCollection, prolificId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Create new user
      await setDoc(userRef, {
        prolificId,
        createdAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
        sessions: [],
      });
    } else {
      // Update existing user
      await updateDoc(userRef, {
        lastActiveAt: serverTimestamp(),
      });
    }

    return { id: prolificId };
  } catch (error) {
    console.error("Error creating/updating user:", error);
    throw error;
  }
}

export async function updateUserLastActive(prolificId: string) {
  try {
    const userRef = doc(usersCollection, prolificId);
    await updateDoc(userRef, {
      lastActiveAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error updating user last active:", error);
    return false;
  }
}

// Session functions
export async function createSession(
  prolificId: string,
  studyId: string,
  sessionId: string,
  scenarioType: string,
  options: {
    role?: "normal" | "domain";
    isTraining?: boolean;
    deviceInfo?: Record<string, any>;
  } = {}
) {
  try {
    // First update or create the user
    await createOrUpdateUser(prolificId);

    // Create session document
    const sessionRef = doc(sessionsCollection, sessionId);
    await setDoc(sessionRef, {
      userId: prolificId,
      studyId,
      scenarioType,
      role: options.role || "normal",
      isTraining: options.isTraining || false,
      deviceInfo: options.deviceInfo || {},
      startedAt: serverTimestamp(),
      stageTimings: {},
      tasks: [],
    });

    // Update user document with new session ID
    const userRef = doc(usersCollection, prolificId);
    await updateDoc(userRef, {
      sessions: arrayUnion(sessionId),
    });

    return {
      sessionRef: { id: sessionId },
      sessionId,
      userId: prolificId,
    };
  } catch (error) {
    console.error("Error creating session:", error);
    // Fallback with local values if Firestore fails
    return {
      sessionRef: { id: sessionId },
      sessionId,
      userId: prolificId,
    };
  }
}

export async function updateSessionStageTimings(
  sessionId: string,
  stage: string,
  timing: { start?: number; end?: number }
) {
  try {
    const sessionRef = doc(sessionsCollection, sessionId);

    // Create path for the specific stage timing
    const updateData: Record<string, any> = {};

    if (timing.start) {
      updateData[`stageTimings.${stage}.start`] = Timestamp.fromMillis(
        timing.start
      );
    }

    if (timing.end) {
      updateData[`stageTimings.${stage}.end`] = Timestamp.fromMillis(
        timing.end
      );
    }

    await updateDoc(sessionRef, updateData);
    return true;
  } catch (error) {
    console.error("Error updating session stage timings:", error);
    return false;
  }
}

export async function endSession(
  sessionId: string,
  completionData?: {
    totalTasks?: number;
    completedTasks?: number;
    totalTime?: number;
  }
) {
  try {
    const sessionRef = doc(sessionsCollection, sessionId);

    const updateData: Record<string, any> = {
      endedAt: serverTimestamp(),
    };

    if (completionData) {
      if (completionData.totalTasks !== undefined) {
        updateData.totalTasks = completionData.totalTasks;
      }
      if (completionData.completedTasks !== undefined) {
        updateData.completedTasks = completionData.completedTasks;
      }
      if (completionData.totalTime !== undefined) {
        updateData.totalTime = completionData.totalTime;
      }
    }

    await updateDoc(sessionRef, updateData);
    return true;
  } catch (error) {
    console.error("Error ending session:", error);
    return false;
  }
}

// Task functions
export async function saveTaskResponse(
  prolificId: string,
  sessionId: string,
  taskData: {
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
    // Use the taskId as a unique identifier for task document
    const taskId = `${sessionId}_${taskData.taskId}`;
    const taskRef = doc(tasksCollection, taskId);

    // Save task data with timestamps
    await setDoc(taskRef, {
      sessionId,
      userId: prolificId,
      question: taskData.question,
      userAnswer: taskData.userAnswer,
      markedEvents: taskData.markedEvents,
      isSkipped: taskData.isSkipped,
      isTimeUp: taskData.isTimeUp,
      isTraining: taskData.isTraining,
      startTime: Timestamp.fromMillis(taskData.startTime),
      endTime: Timestamp.fromMillis(taskData.endTime),
      createdAt: serverTimestamp(),
    });

    // Update session document with task ID
    const sessionRef = doc(sessionsCollection, sessionId);
    await updateDoc(sessionRef, {
      tasks: arrayUnion(taskId),
    });

    return true;
  } catch (error) {
    console.error("Error saving task response:", error);
    return false;
  }
}

// Feedback functions
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
) {
  try {
    // Use sessionId as the feedbackId
    const feedbackId = sessionId;
    const feedbackRef = doc(feedbackCollection, feedbackId);

    // Save feedback data
    await setDoc(feedbackRef, {
      sessionId,
      userId,
      visualizationUsage: feedback.visualizationUsage,
      experience: feedback.experience,
      visualizationRatings: feedback.visualizationRatings,
      comments: feedback.comments || "",
      createdAt: serverTimestamp(),
    });

    // Update session with feedback reference
    const sessionRef = doc(sessionsCollection, sessionId);
    await updateDoc(sessionRef, {
      feedbackId,
    });

    return true;
  } catch (error) {
    console.error("Error saving feedback:", error);
    return false;
  }
}

// Query functions - to retrieve data for analysis
export async function getUserSessions(prolificId: string) {
  try {
    const q = query(sessionsCollection, where("userId", "==", prolificId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting user sessions:", error);
    return [];
  }
}

export async function getSessionTasks(sessionId: string) {
  try {
    const q = query(tasksCollection, where("sessionId", "==", sessionId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting session tasks:", error);
    return [];
  }
}

export async function getSessionWithTasksAndFeedback(sessionId: string) {
  try {
    // Get session
    const sessionRef = doc(sessionsCollection, sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) {
      throw new Error("Session not found");
    }

    const sessionData = sessionDoc.data();

    // Get tasks
    const tasks = await getSessionTasks(sessionId);

    // Get feedback if it exists
    let feedback = null;
    if (sessionData.feedbackId) {
      const feedbackRef = doc(feedbackCollection, sessionData.feedbackId);
      const feedbackDoc = await getDoc(feedbackRef);

      if (feedbackDoc.exists()) {
        feedback = feedbackDoc.data();
      }
    }

    return {
      id: sessionDoc.id,
      ...sessionData,
      tasks,
      feedback,
    };
  } catch (error) {
    console.error("Error getting session with tasks and feedback:", error);
    return null;
  }
}
