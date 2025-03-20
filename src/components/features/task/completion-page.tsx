"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Copy, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { resetTaskProgress, resetAllTaskProgress } from "@/lib/task-progress";

interface CompletionPageProps {
  totalTasks: number;
  userRole?: "domain" | "normal";
  studyType?: string;
  onRestart?: () => void;
}

export function CompletionPage({
  totalTasks,
  userRole = "normal",
  studyType = "visualization",
  onRestart,
}: CompletionPageProps) {
  const router = useRouter();
  const [codeCopied, setCodeCopied] = useState(false);
  const [userId, setUserId] = useState<string>("");

  // Fixed completion code for Prolific
  const completionCode = `PROLIFIC-PUR-4529`;

  // Get user ID from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserId(user.id);
      } catch (error) {
        console.error("Failed to parse stored user:", error);
      }
    }
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(completionCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleReturnHome = () => {
    router.push("/");
  };

  const handleReturnToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-5 max-w-md w-full">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="h-5 w-5 text-green-600" />
        </div>
        <div className="ml-3">
          <h1 className="text-lg font-medium text-gray-900">
            {userRole === "domain" ? "Scenario Completed" : "Study Completed"}
          </h1>
          <p className="text-xs text-gray-500">
            {userRole === "domain"
              ? "You can return to dashboard or explore other scenarios"
              : "Thank you for your participation"}
          </p>
        </div>
      </div>

      {/* Study Information */}
      <div className="bg-gray-50 rounded p-3 mb-4">
        <div className="flex items-center mb-2">
          <h2 className="text-sm font-medium text-gray-700">
            {userRole === "domain"
              ? "Scenario Information"
              : "Study Information"}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white p-2 rounded border border-gray-100">
            <div className="text-gray-500">Tasks Completed</div>
            <div className="font-medium">
              {totalTasks}/{totalTasks}
            </div>
          </div>

          <div className="bg-white p-2 rounded border border-gray-100">
            <div className="text-gray-500">Interface</div>
            <div className="font-medium capitalize">{studyType}</div>
          </div>
        </div>
      </div>

      {/* Completion Code - only shown for normal users */}
      {userRole === "normal" && (
        <div className="bg-gray-50 border border-gray-100 rounded p-3 mb-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-medium text-gray-800">
              Completion Code
            </h2>
            {codeCopied && (
              <span className="text-xs text-gray-600">✓ Copied</span>
            )}
          </div>

          <div className="flex items-center">
            <code className="bg-white p-2 rounded border border-gray-100 font-mono text-sm flex-grow text-center">
              {completionCode}
            </code>
            <button
              onClick={handleCopyCode}
              className="ml-2 p-1.5 bg-gray-800 text-white rounded hover:bg-gray-700 flex items-center justify-center"
              aria-label="Copy completion code"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Action buttons based on user role */}
      <div className="space-y-2">
        {userRole === "domain" && (
          <button
            onClick={handleReturnToDashboard}
            className="w-full py-2 px-4 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Return to Dashboard
          </button>
        )}
      </div>
    </div>
  );
}
