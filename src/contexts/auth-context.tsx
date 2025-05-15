"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { startSession } from "@/lib/api-submission";

interface AuthContextType {
  userId: string;
  setUserId: (userId: string) => void;
  scenarioId: string;
  setScenarioId: (scenarioId: string) => void;
  sessionId: string;
  role: "domain" | "normal";
  hasLoadedParams: boolean;
  loadUrlParams: () => Promise<void>;
  isLoadingSession: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // In dev, always domain; in prod, always normal
  const role = process.env.NODE_ENV === "development" ? "domain" : "normal";

  // Default values as fallbacks
  const defaultUserId =
    role === "domain" ? "dev-domain-user" : "prod-normal-user";
  const defaultScenarioId = "text-visual-default";

  const [userId, setUserId] = useState(defaultUserId);
  const [scenarioId, setScenarioId] = useState(defaultScenarioId);
  const [sessionId, setSessionId] = useState("");
  const [hasLoadedParams, setHasLoadedParams] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);

  // Function to load URL parameters explicitly - now async
  const loadUrlParams = async () => {
    if (typeof window !== "undefined") {
      setIsLoadingSession(true);
      try {
        // SECURITY IMPROVEMENT: We no longer store or read userId from localStorage
        // Check URL parameters
        const params = new URLSearchParams(window.location.search);
        const prolificPid = params.get("PROLIFIC_PID");
        const studyId = params.get("STUDY_ID") || "text-visual";
        const sessionParam = params.get("SESSION_ID") || "1";

        // For scenarioId, we still check localStorage first for potential manual testing
        const storedScenarioId = localStorage.getItem("scenarioId");

        // Determine scenario ID
        let newScenarioId = defaultScenarioId;
        if (storedScenarioId) {
          newScenarioId = storedScenarioId;
        } else if (studyId && sessionParam) {
          newScenarioId = `${studyId}-${sessionParam}`;
        }

        // Store non-sensitive scenarioId for persistence
        localStorage.setItem("scenarioId", newScenarioId);
        setScenarioId(newScenarioId);

        // Set userId from URL parameter if available
        if (prolificPid) {
          setUserId(prolificPid);

          // IMPROVED: Start a new session with our API
          try {
            const scenarioType = newScenarioId.split("-")[0] || "text-visual";
            const sessionResult = await startSession(
              prolificPid,
              studyId,
              sessionParam,
              scenarioType,
              { role }
            );

            // Store the returned sessionId
            setSessionId(sessionResult.sessionId);
            console.log("Session started:", sessionResult.sessionId);
          } catch (error) {
            console.error("Failed to start session:", error);
            // Fallback: generate a local session ID if API call fails
            setSessionId(`${prolificPid}_${Date.now()}`);
          }
        }

        setHasLoadedParams(true);
      } catch (error) {
        console.error("Error loading parameters:", error);
      } finally {
        setIsLoadingSession(false);
      }
    }
  };

  const value: AuthContextType = {
    userId,
    setUserId,
    scenarioId,
    setScenarioId,
    sessionId,
    role,
    hasLoadedParams,
    loadUrlParams,
    isLoadingSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
