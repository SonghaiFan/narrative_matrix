"use client";

import { useState } from "react";

// The accounts will be generated dynamically based on available scenarios

export interface LoginFormProps {
  isDisabled?: boolean;
  onLoginSuccess?: () => void;
  isProlificUser?: boolean;
}

export function LoginForm({
  isDisabled = false,
  onLoginSuccess,
  isProlificUser = false,
}: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);

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

    // No login logic needed, just call onLoginSuccess
    if (onLoginSuccess) {
      onLoginSuccess();
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
            Username
          </label>
          <input
            id="username"
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isDisabled}
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
          disabled={isDisabled}
        >
          Continue
        </button>
      </form>
    </div>
  );
}
