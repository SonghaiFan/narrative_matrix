"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";

// The accounts will be generated dynamically based on available scenarios

export interface LoginFormProps {
  isDisabled?: boolean;
  urlUsername?: string | null;
  urlSessionId?: string | null;
  onLoginSuccess?: () => void;
  isProlificUser?: boolean;
}

export function LoginForm({
  isDisabled = false,
  urlUsername = null,
  urlSessionId = null,
  onLoginSuccess,
  isProlificUser = false,
}: LoginFormProps) {
  const [username, setUsername] = useState(urlUsername || "");
  const [error, setError] = useState<string | null>(null);
  const { login, isLoading, error: authError } = useAuth();

  // Effect to handle URL parameters
  useEffect(() => {
    if (urlUsername) {
      setUsername(urlUsername);
    }
  }, [urlUsername]);

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

    try {
      await login(username, urlSessionId || undefined);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      // Error is handled by the auth context
    }
  };

  // Auto-login handler for URL parameters
  const handleUrlLogin = async () => {
    if (isDisabled) {
      setError("Please accept the consent form first");
      return;
    }

    try {
      await login(username, urlSessionId || undefined);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      // Error is handled by the auth context
    }
  };

  // For Prolific users or with URL parameters, display a simplified form
  const isPreConfigured = urlUsername || isProlificUser;

  return (
    <div className="space-y-4">
      {isPreConfigured ? (
        // Show simplified interface when URL parameters are provided
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            <div className="text-blue-600 space-y-1">
              {isProlificUser && (
                <>
                  <p>Participant ID: {urlUsername?.substring(0, 6)}...</p>
                  {urlSessionId && <p>Session: {urlSessionId}</p>}
                  <p>Study Type: Text Visualization</p>
                </>
              )}
            </div>
          </div>

          {(error || authError) && (
            <div className="p-2 bg-red-50 text-red-700 rounded text-xs">
              {error || authError}
            </div>
          )}
        </div>
      ) : (
        // Show regular form if no URL parameters
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading || isDisabled}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>

          {(error || authError) && (
            <div className="p-2 bg-red-50 text-red-700 rounded text-xs">
              {error || authError}
            </div>
          )}
        </form>
      )}
      <button
        onClick={handleUrlLogin}
        className="w-full py-1.5 px-4 text-sm font-medium text-white bg-blue-600 rounded shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
        disabled={isLoading || isDisabled}
      >
        {isLoading
          ? "Logging in..."
          : isDisabled
          ? "Please Read and Accept Consent Form to Proceed"
          : "Login"}
      </button>
    </div>
  );
}
