"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getLocalStorage,
  setLocalStorage,
  removeLocalStorage,
} from "@/utils/local-storage";

interface User {
  id: string;
  username: string;
  role: "domain" | "normal";
  studyId?: string;
  sessionId?: string;
}

// List of allowed domain usernames
const DOMAIN_USERS = [
  "domain",
  "admin",
  "researcher",
  "experimenter",
  "supervisor",
];

// Predefined study participants
const STUDY_PARTICIPANTS: Record<
  string,
  { studyId: string; sessionId: string }
> = {
  "participant-1": { studyId: "text-visual", sessionId: "1" },
  "participant-2": { studyId: "text-visual", sessionId: "2" },
  "participant-3": { studyId: "text-visual", sessionId: "3" },
  "participant-4": { studyId: "text-visual", sessionId: "4" },
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string) => Promise<void>;
  logout: () => void;
  isDomainUser: (username: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  // Check for existing session on mount
  useEffect(() => {
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

  // Helper function to check if a username is a domain user
  const isDomainUser = (username: string): boolean => {
    return DOMAIN_USERS.includes(username.toLowerCase());
  };

  const login = async (username: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      let user: User;

      // Check if it's a predefined participant
      const participantInfo = STUDY_PARTICIPANTS[username];
      if (participantInfo) {
        user = {
          id: username,
          username,
          role: "normal",
          studyId: participantInfo.studyId,
          sessionId: participantInfo.sessionId,
        };
      } else if (isDomainUser(username)) {
        // Domain user
        user = {
          id: username.toLowerCase(),
          username: username.toLowerCase(),
          role: "domain",
        };
      } else {
        throw new Error(
          "Invalid username. Please use a valid domain username or participant ID."
        );
      }

      setLocalStorage("user", JSON.stringify(user));
      setAuthState({
        user,
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

  const logout = () => {
    removeLocalStorage("user");
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  };

  const value = {
    ...authState,
    login,
    logout,
    isDomainUser,
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
