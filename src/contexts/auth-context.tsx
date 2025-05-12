"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  userId: string;
  setUserId: (userId: string) => void;
  scenarioId: string;
  setScenarioId: (scenarioId: string) => void;
  role: "domain" | "normal";
  hasLoadedParams: boolean;
  loadUrlParams: () => void;
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
  const [hasLoadedParams, setHasLoadedParams] = useState(false);

  // Function to load URL parameters explicitly
  const loadUrlParams = () => {
    if (typeof window !== "undefined") {
      // Check localStorage first (for manually entered values)
      const storedUserId = localStorage.getItem("userId");
      const storedScenarioId = localStorage.getItem("scenarioId");

      // Check URL parameters next
      const params = new URLSearchParams(window.location.search);
      const prolificPid = params.get("PROLIFIC_PID");
      const studyId = params.get("STUDY_ID");
      const sessionId = params.get("SESSION_ID");

      // Decide which values to use, with priority:
      // 1. LocalStorage (manual input)
      // 2. URL parameters
      // 3. Default values

      if (storedUserId) {
        setUserId(storedUserId);
        // Store in localStorage for persistence
        localStorage.setItem("userId", storedUserId);
      } else if (prolificPid) {
        setUserId(prolificPid);
        // Store in localStorage for persistence
        localStorage.setItem("userId", prolificPid);
      }

      if (storedScenarioId) {
        setScenarioId(storedScenarioId);
        // Store in localStorage for persistence
        localStorage.setItem("scenarioId", storedScenarioId);
      } else if (studyId && sessionId) {
        const formattedScenarioId = `${studyId}-${sessionId}`;
        setScenarioId(formattedScenarioId);
        // Store in localStorage for persistence
        localStorage.setItem("scenarioId", formattedScenarioId);
      }

      setHasLoadedParams(true);
    }
  };

  const value: AuthContextType = {
    userId,
    setUserId,
    scenarioId,
    setScenarioId,
    role,
    hasLoadedParams,
    loadUrlParams,
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
