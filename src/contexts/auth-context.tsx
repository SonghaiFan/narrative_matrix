"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthState } from "@/types/user";
import { ScenarioType, ScenarioInfo } from "@/types/scenario";

// Define user types for better type safety
interface BaseUser {
  id: string;
  name: string;
  username: string;
}

interface DomainUser extends BaseUser {
  role: "domain";
}

interface NormalUser extends BaseUser {
  role: "normal";
  defaultScenario: ScenarioType;
  defaultDataset: string;
}

type User = DomainUser | NormalUser;

// Only include the domain expert in the base users
// Normal users will be generated dynamically based on available scenarios
const BASE_DOMAIN_USER: DomainUser = {
  id: "1",
  name: "Domain Expert",
  username: "domain",
  role: "domain",
};

interface AuthContextType extends Omit<AuthState, "user"> {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setUserScenario: (scenarioType: ScenarioType) => void;
  availableScenarios: ScenarioInfo[];
  currentScenario: ScenarioType | null;
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
  const [authState, setAuthState] = useState<AuthState & { user: User | null }>(
    {
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
    }
  );

  const [availableScenarios, setAvailableScenarios] = useState<ScenarioInfo[]>(
    []
  );
  const [mockUsers, setMockUsers] = useState<User[]>([BASE_DOMAIN_USER]);

  // Add current scenario state derived from user's default scenario
  const currentScenario: ScenarioType | null =
    authState.user && "defaultScenario" in authState.user
      ? (authState.user.defaultScenario as ScenarioType)
      : null;

  // Fetch available scenarios
  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const response = await fetch("/api/scenarios");
        if (!response.ok) {
          throw new Error("Failed to fetch scenarios");
        }
        const data = await response.json();
        setAvailableScenarios(data.scenarios);

        // Generate user accounts based on available scenarios
        generateUserAccounts(data.scenarios);
      } catch (error) {
        console.error("Error fetching scenarios:", error);
        setAvailableScenarios([]);
      }
    };

    fetchScenarios();
  }, []);

  // Generate user accounts based on available scenarios
  const generateUserAccounts = (scenarios: ScenarioInfo[]) => {
    if (scenarios.length === 0) return;

    // Create one user account per scenario
    const scenarioUsers: NormalUser[] = scenarios.map((scenario, index) => {
      // Generate a readable name based on the scenario metadata
      const userName = scenario.metadata.name.replace(/\s+/g, "").toLowerCase();

      return {
        id: `${index + 2}`, // Start IDs from 2 since domain is 1
        name: `${scenario.metadata.name} User`,
        username: userName,
        role: "normal",
        defaultScenario: scenario.id as ScenarioType,
        defaultDataset: "default.json",
      };
    });

    // Combine with domain user
    const allUsers: User[] = [BASE_DOMAIN_USER, ...scenarioUsers];
    setMockUsers(allUsers);

    // Update the current user if needed
    const currentUser = authState.user;
    if (currentUser && currentUser.role === "normal") {
      // Check if the scenario still exists
      const scenarioExists = scenarios.some(
        (s) => s.id === currentUser.defaultScenario
      );

      if (!scenarioExists && scenarios.length > 0) {
        // If the scenario no longer exists, update to the first available
        const updatedUser: NormalUser = {
          ...currentUser,
          defaultScenario: scenarios[0].id as ScenarioType,
        };

        setAuthState({
          ...authState,
          user: updatedUser,
        });

        // Update in localStorage
        try {
          setLocalStorage("user", JSON.stringify(updatedUser));
        } catch (error) {
          console.error("Error storing updated user in localStorage:", error);
        }
      }
    }
  };

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

  const login = async (username: string, password: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Simple mock authentication - in a real app, this would be an API call
      const user = mockUsers.find((u) => u.username === username);

      // For simplicity, we'll use a fixed password for all users
      if (user && password === "study") {
        // Make sure normal users have a valid scenario
        if (user.role === "normal") {
          const scenarioExists = availableScenarios.some(
            (s) => s.id === user.defaultScenario
          );

          if (!scenarioExists && availableScenarios.length > 0) {
            // Assign first available scenario if default doesn't exist
            user.defaultScenario = availableScenarios[0].id;
          }
        }

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

      // Update in localStorage
      setLocalStorage("user", JSON.stringify(updatedUser));
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
        setUserScenario,
        availableScenarios,
        currentScenario,
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
