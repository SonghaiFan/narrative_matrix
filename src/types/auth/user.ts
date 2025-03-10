export type UserRole = "domain" | "normal";

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  // For normal users, specify which scenario they should see
  defaultScenario?:
    | "pure-text"
    | "mixed"
    | "pure-text-chat"
    | "visualization-chat";
  // For normal users, specify which dataset they should use
  defaultDataset?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
