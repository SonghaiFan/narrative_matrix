"use client";

import { useState } from "react";
import { startSession } from "@/lib/api-submission";
import { useStudyStore } from "@/store/study-store";

// The accounts will be generated dynamically based on available scenarios

export interface LoginFormProps {
  isDisabled?: boolean;
  onLoginSuccess?: (userId: string, sessionId: string) => void;
  isProlificUser?: boolean;
  studyId?: string;
  scenarioType?: string;
}

export function LoginForm({
  isDisabled = false,
  onLoginSuccess,
  isProlificUser = false,
  studyId = "default-study",
  scenarioType = "default-scenario",
}: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get study store functions
  const { setSessionInfo, startStage, endStage } = useStudyStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    if (isDisabled) {
      setError("Please accept the consent form first");
      return;
    }

    setIsLoading(true);

    try {
      // Start login stage timing
      startStage("login");

      // Generate a unique session ID
      const sessionId = `${username}_${Date.now()}`;

      // Start a new session
      const result = await startSession(
        username, // prolificId
        studyId,
        sessionId,
        scenarioType,
        {
          role: "normal",
          deviceInfo: {
            userAgent: navigator.userAgent,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
          },
        }
      );

      // Set the session info in the study store
      setSessionInfo(result.userId, result.sessionId, studyId);

      // End login stage timing
      endStage("login");

      // Call onLoginSuccess callback if provided
      if (onLoginSuccess) {
        onLoginSuccess(result.userId, result.sessionId);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label
            htmlFor="username"
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            {isProlificUser ? "Prolific ID" : "Username"}
          </label>
          <input
            id="username"
            type="text"
            placeholder={
              isProlificUser ? "Enter your Prolific ID" : "Enter your username"
            }
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isDisabled || isLoading}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
          />
        </div>

        {error && (
          <div className="p-2 bg-red-50 text-red-700 rounded text-xs">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={isDisabled || isLoading}
        >
          {isLoading ? "Processing..." : "Continue"}
        </button>
      </form>
    </div>
  );
}
