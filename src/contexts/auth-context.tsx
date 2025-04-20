"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ScenarioType } from "@/types/scenario";
import {
  createUser,
  updateUserLastActive,
  createSession,
  endSession,
  saveUserSession,
} from "@/lib/firebase-operations";

interface BaseUser {
  id: string;
  username: string;
}

interface DomainUser extends BaseUser {
  role: "domain";
}

interface NormalUser extends BaseUser {
  role: "normal";
  defaultScenario: ScenarioType;
}

type User = DomainUser | NormalUser;

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, sessionId?: string) => Promise<void>;
  logout: () => void;
  setUserScenario: (scenarioType: ScenarioType) => void;
  currentScenario: ScenarioType | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper functions for localStorage
const getLocalStorage = (key: string): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(key);
  }
  return null;
};

const setLocalStorage = (key: string, value: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, value);
  }
};

const removeLocalStorage = (key: string): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(key);
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<{
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
  }>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Add current scenario state derived from user's default scenario
  const currentScenario: ScenarioType | null =
    authState.user && "defaultScenario" in authState.user
      ? authState.user.defaultScenario
      : null;

  // Check for existing session on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedUser = getLocalStorage("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser) as User;
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        removeLocalStorage("user");
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    } else {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (username: string, sessionId?: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check for domain user
      if (username === "domain") {
        const domainUser: DomainUser = {
          id: "1",
          username: "domain",
          role: "domain",
        };
        setLocalStorage("user", JSON.stringify(domainUser));
        setAuthState({
          user: domainUser,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return;
      }

      // Determine scenario based on sessionId
      let scenarioId: ScenarioType = "text-visual-1"; // Default scenario
      if (sessionId && sessionId.match(/^\d+$/)) {
        scenarioId = `text-visual-${sessionId}` as ScenarioType;
      }

      // Save user session to Firebase
      if (sessionId) {
        await saveUserSession(username, sessionId);
      }

      // All other users are normal users
      const normalUser: NormalUser = {
        id: username,
        username,
        role: "normal",
        defaultScenario: scenarioId,
      };

      setLocalStorage("user", JSON.stringify(normalUser));
      setAuthState({
        user: normalUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Login error:", error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  const setUserScenario = (scenarioType: ScenarioType) => {
    if (authState.user && authState.user.role === "normal") {
      const updatedUser: NormalUser = {
        ...authState.user,
        defaultScenario: scenarioType,
      };

      setAuthState({
        ...authState,
        user: updatedUser,
      });

      setLocalStorage("user", JSON.stringify(updatedUser));
    }
  };

  const logout = () => {
    const user = authState.user;
    if (user && user.role === "normal") {
      // End session in Firebase
      endSession(user.id).catch(console.error);
    }

    removeLocalStorage("user");
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  };

  // Update last active timestamp periodically
  useEffect(() => {
    if (authState.user && authState.user.role === "normal") {
      const interval = setInterval(() => {
        updateUserLastActive(authState.user.id).catch(console.error);
      }, 300000); // Every 5 minutes

      return () => clearInterval(interval);
    }
  }, [authState.user]);

  const value = {
    ...authState,
    login,
    logout,
    setUserScenario,
    currentScenario,
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
