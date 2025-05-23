"use client";

import { useState } from "react";
import { useStudyStore } from "@/store/study-store";
import {
  saveQuizResponse,
  saveFeedback,
  startSession,
  endSession,
} from "@/lib/api-submission";
import { FirebaseProvider } from "@/components/firebase-provider";

export default function TestFirebasePage() {
  const [userId, setUserId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  // Access study store
  const { setSessionInfo, startStage, endStage, getCurrentStageDuration } =
    useStudyStore();

  // Start a new session
  const handleStartSession = async () => {
    setStatus("loading");

    try {
      const tempUserId = `test_user_${Date.now()}`;
      const tempSessionId = `${tempUserId}_${Date.now()}`;

      // Start a session in Firestore
      const result = await startSession(
        tempUserId,
        "test-study",
        tempSessionId,
        "test-scenario"
      );

      // Save session info to store
      setSessionInfo(result.userId, result.sessionId, "test-study");

      // Update local state
      setUserId(result.userId);
      setSessionId(result.sessionId);

      // Start the test stage
      startStage("quiz");

      setStatus("success");
      setMessage(`Session started with ID: ${result.sessionId}`);
    } catch (error) {
      console.error("Error starting session:", error);
      setStatus("error");
      setMessage("Failed to start session");
    }
  };

  // Submit a test quiz response
  const handleSubmitQuiz = async () => {
    if (!userId || !sessionId) {
      setMessage("Please start a session first");
      return;
    }

    setStatus("loading");

    try {
      // Submit a quiz response
      const success = await saveQuizResponse(userId, sessionId, {
        question: "Test question?",
        userAnswer: "Test answer",
        markedEvents: [1, 2, 3],
        isSkipped: false,
        isTimeUp: false,
        isTraining: false,
        taskId: "test-task-1",
        startTime: Date.now() - 30000, // 30 seconds ago
        endTime: Date.now(),
      });

      if (success) {
        setStatus("success");
        setMessage("Quiz response saved successfully");
      } else {
        throw new Error("Failed to save quiz");
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      setStatus("error");
      setMessage("Failed to submit quiz");
    }
  };

  // Submit feedback
  const handleSubmitFeedback = async () => {
    if (!userId || !sessionId) {
      setMessage("Please start a session first");
      return;
    }

    setStatus("loading");

    try {
      // End the test stage
      endStage("quiz");

      // Get the duration
      const duration = getCurrentStageDuration();

      // Submit feedback
      const success = await saveFeedback(userId, sessionId, {
        visualizationUsage: {
          frequency: 4,
          helpfulness: 5,
          preference: 3,
        },
        experience: {
          withVisualization: 4,
          withoutVisualization: 2,
          overall: 4,
        },
        visualizationRatings: {
          entity: 5,
          topic: 4,
          time: 3,
        },
        comments: "This is a test feedback submission",
      });

      if (success) {
        // End session
        await endSession(sessionId, {
          totalTasks: 1,
          completedTasks: 1,
          totalTime: duration || 0,
        });

        setStatus("success");
        setMessage("Feedback saved and session ended");
      } else {
        throw new Error("Failed to save feedback");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setStatus("error");
      setMessage("Failed to submit feedback");
    }
  };

  return (
    <FirebaseProvider>
      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Firebase Integration Test</h1>

        <div className="space-y-6">
          <div className="p-4 bg-slate-50 rounded-md">
            <h2 className="text-xl font-semibold mb-2">Session Info</h2>
            {userId ? (
              <div className="space-y-2">
                <p>
                  <strong>User ID:</strong> {userId}
                </p>
                <p>
                  <strong>Session ID:</strong> {sessionId}
                </p>
              </div>
            ) : (
              <p>No active session</p>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={handleStartSession}
              disabled={status === "loading" || !!sessionId}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              Start Test Session
            </button>

            <button
              onClick={handleSubmitQuiz}
              disabled={status === "loading" || !sessionId}
              className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
            >
              Submit Test Quiz Response
            </button>

            <button
              onClick={handleSubmitFeedback}
              disabled={status === "loading" || !sessionId}
              className="px-4 py-2 bg-purple-600 text-white rounded disabled:opacity-50"
            >
              Submit Feedback & End Session
            </button>
          </div>

          {message && (
            <div
              className={`p-4 rounded-md ${
                status === "success"
                  ? "bg-green-100 text-green-800"
                  : status === "error"
                  ? "bg-red-100 text-red-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {message}
            </div>
          )}

          <div className="mt-8 text-sm text-gray-500">
            <p>This page demonstrates the Firebase Firestore integration.</p>
            <p>Check your Firebase console to see the data being stored.</p>
          </div>
        </div>
      </div>
    </FirebaseProvider>
  );
}
