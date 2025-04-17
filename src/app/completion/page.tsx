"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getTaskProgress } from "@/lib/task-progress";

// Create a client component that uses useSearchParams
function CompletionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [pageData, setPageData] = useState({
    totalTasks: 0,
    studyType: "mixed",
    sessionTime: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (!user) {
      router.push("/");
      return;
    }

    // For normal users, check if they have completed tasks
    if (user.role === "normal") {
      const progress = getTaskProgress(user.id);

      // If normal user hasn't completed tasks, redirect to their default scenario
      if (!progress?.isCompleted) {
        // Check if we have URL parameters that might indicate a direct navigation
        const totalParam = searchParams.get("total");

        // If no parameters and no completed tasks, redirect to appropriate scenario
        if (!totalParam) {
          const routeMap: Record<string, string> = {
            "pure-text": "/pure-text",
            "text-visual": "/text-visual",
            "text-chat": "/text-chat",
            mixed: "/mixed",
          };

          const defaultScenario = user.defaultScenario || "mixed";
          router.push(routeMap[defaultScenario] || "/");
          return;
        }
      }
    }

    // Get data from URL parameters or local storage
    const totalParam = searchParams.get("total");
    const studyType = searchParams.get("type") || "mixed";
    const sessionTimeParam = searchParams.get("time");
    const sessionTime = sessionTimeParam ? parseInt(sessionTimeParam, 10) : 0;

    if (totalParam) {
      // If URL parameters exist, use them
      const totalTasks = parseInt(totalParam, 10);

      // Validate the data
      if (isNaN(totalTasks) || totalTasks <= 0) {
        setError("Invalid task count");
        setLoading(false);
        return;
      }

      setPageData({
        totalTasks,
        studyType,
        sessionTime,
      });
      setLoading(false);
    } else if (user) {
      // Try to get data from local storage
      const progress = getTaskProgress(user.id);

      if (progress) {
        setPageData({
          totalTasks: progress.totalTasks,
          studyType: progress.studyType,
          sessionTime: progress.totalSessionTime || 0,
        });
        setLoading(false);
      } else {
        setError("No completion data found");
        setLoading(false);
      }
    } else {
      setError("Missing required parameters");
      setLoading(false);
    }
  }, [searchParams, user, router]);

  // For domain experts, provide a way to return to dashboard
  const handleBackToDashboard = () => {
    router.push("/dashboard");
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error message if parameters are invalid
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm p-4 max-w-md w-full">
          <h1 className="text-lg font-medium text-red-600 mb-2">Error</h1>
          <p className="text-sm text-gray-700 mb-3">{error}</p>
          <button
            onClick={() =>
              user?.role === "domain"
                ? router.push("/dashboard")
                : router.push("/")
            }
            className="w-full py-2 px-4 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            {user?.role === "domain" ? "Return to Dashboard" : "Return Home"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Task Completion
          </h1>

          {/* Display completion stats */}
          <div className="mb-8 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              Your Progress
            </h2>
            <div className="text-sm text-blue-700">
              <p>Total Questions: {pageData.totalTasks}</p>
              <p>Study Type: {pageData.studyType}</p>
              <p>Time Spent: {pageData.sessionTime} seconds</p>
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="mt-8 flex justify-end space-x-4">
            {user?.role === "domain" ? (
              <button
                onClick={handleBackToDashboard}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Return to Dashboard
              </button>
            ) : (
              <button
                onClick={() => router.push("/")}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Return Home
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-12 h-12 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );
}

// Main page component that wraps the content in Suspense
export default function CompletionRoute() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CompletionContent />
    </Suspense>
  );
}
