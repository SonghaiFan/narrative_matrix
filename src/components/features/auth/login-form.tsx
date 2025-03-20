"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";

// Mock users for quick reference
const DEMO_ACCOUNTS = [
  { name: "Domain Expert", username: "domain", role: "domain" },
  { name: "Text User", username: "text", role: "normal" },
  { name: "Visual+ User", username: "viz", role: "normal" },
  { name: "Chat+ User", username: "textchat", role: "normal" },
  { name: "Mixed User", username: "vizchat", role: "normal" },
];

export interface LoginFormProps {
  isDisabled?: boolean;
}

export function LoginForm({ isDisabled = false }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { login, isLoading, error: authError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    try {
      await login(username, password);
    } catch (err) {
      // Error is handled by the auth context
    }
  };

  const handleQuickLogin = async (username: string) => {
    if (isDisabled) {
      setError("Please accept the consent form first");
      return;
    }

    try {
      await login(username, "study");
    } catch (err) {
      // Error is handled by the auth context
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
            disabled={isLoading || isDisabled}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading || isDisabled}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
          />
        </div>

        {(error || authError) && (
          <div className="p-2 bg-red-50 text-red-700 rounded text-xs">
            {error || authError}
          </div>
        )}

        <button
          type="submit"
          className="w-full py-1.5 px-4 text-sm font-medium text-white bg-blue-600 rounded shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
          disabled={isLoading || isDisabled}
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>

      <div>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-2 bg-gray-50 text-xs text-gray-500">
              Demo Accounts
            </span>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.username}
              onClick={() => handleQuickLogin(account.username)}
              disabled={isDisabled || isLoading}
              className="py-1 px-2 text-xs text-gray-700 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
            >
              Login as {account.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
