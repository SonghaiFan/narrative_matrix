"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthState } from "@/types/user";
import { ScenarioType } from "@/types/scenario";

// Mock users for demonstration
const MOCK_USERS = [
  {
    id: "1",
    name: "Domain Expert",
    username: "domain",
    role: "domain" as const,
  },
  {
    id: "2",
    name: "Text User",
    username: "text",
    role: "normal" as const,
    defaultScenario: "pure-text" as ScenarioType,
    defaultDataset: "default.json",
  },
  {
    id: "3",
    name: "Visualization User",
    username: "viz",
    role: "normal" as const,
    defaultScenario: "text-visual" as ScenarioType,
    defaultDataset: "default.json",
  },
  {
    id: "4",
    name: "Text Chat User",
    username: "textchat",
    role: "normal" as const,
    defaultScenario: "text-chat" as ScenarioType,
    defaultDataset: "default.json",
  },
  {
    id: "5",
    name: "Visualization Chat User",
    username: "vizchat",
    role: "normal" as const,
    defaultScenario: "mixed" as ScenarioType,
    defaultDataset: "default.json",
  },
];

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper functions for localStorage to handle SSR
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
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = getLocalStorage("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
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

  const login = async (username: string, password: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Simple mock authentication - in a real app, this would be an API call
      const user = MOCK_USERS.find((u) => u.username === username);

      // For simplicity, we'll use a fixed password for all users
      if (user && password === "study") {
        // Store user in localStorage for persistence
        try {
          setLocalStorage("user", JSON.stringify(user));
        } catch (error) {
          console.error("Error storing user in localStorage:", error);
        }

        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        throw new Error("Invalid username or password");
      }
    } catch (error) {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  const logout = () => {
    removeLocalStorage("user");
    // Clear the introduction cookie
    document.cookie =
      "hasCompletedIntro=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
