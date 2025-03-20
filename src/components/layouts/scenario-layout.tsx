"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { CenterControlProvider } from "@/contexts/center-control-context";
import { TooltipProvider } from "@/contexts/tooltip-context";
import { AuthHeader } from "@/components/features/auth/auth-header";

interface ScenarioLayoutProps {
  children: ReactNode;
  title: string;
  isLoading?: boolean;
  isTraining?: boolean;
}

export function ScenarioLayout({
  children,
  title,
  isLoading = false,
  isTraining = false,
}: ScenarioLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null
  );

  // Handle authentication and navigation
  useEffect(() => {
    if (!authLoading) {
      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        router.push("/");
        return;
      }

      // For normal path handling (both user types), not applicable for dashboard
      if (pathname !== "/dashboard" && !pathname.includes("/completion")) {
        // Get current scenario path
        const scenarioPath = pathname.split("/")[1];

        if (
          scenarioPath &&
          ["pure-text", "text-visual", "text-chat", "mixed"].includes(
            scenarioPath
          )
        ) {
          // Check completion statuses from localStorage
          const hasCompletedIntro =
            localStorage.getItem(`hasCompletedIntro-${scenarioPath}`) ===
            "true";
          const hasCompletedTraining =
            localStorage.getItem(`hasCompletedTraining-${scenarioPath}`) ===
            "true";

          // Determine if this is an intro or training page
          const isIntroPage = pathname.endsWith("/introduction");
          const isTrainingPage = pathname.endsWith("/training");
          const isMainPage = !isIntroPage && !isTrainingPage;

          // Handle navigation sequence
          if (!isIntroPage && !hasCompletedIntro) {
            // Intro not completed, go to intro
            router.push(`/${scenarioPath}/introduction`);
            return;
          } else if (!isTrainingPage && !isIntroPage && !hasCompletedTraining) {
            // Intro completed but training not completed, go to training
            router.push(`/${scenarioPath}/training`);
            return;
          } else if (isMainPage && hasCompletedTraining) {
            // Show confirmation before accessing real task
            setShowConfirmation(true);
            setPendingNavigation(pathname);
            return;
          }
        }
      }
    }
  }, [authLoading, isAuthenticated, user, router, pathname]);

  const handleConfirmNavigation = () => {
    setShowConfirmation(false);
    if (pendingNavigation) {
      router.push(pendingNavigation);
      setPendingNavigation(null);
    }
  };

  const handleCancelNavigation = () => {
    setShowConfirmation(false);
    setPendingNavigation(null);
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-neutral-300 border-t-neutral-600 rounded-full animate-spin mb-2"></div>
        <div className="text-neutral-600 text-sm">
          Checking authentication...
        </div>
      </div>
    );
  }

  // Show loading overlay for data loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-neutral-300 border-t-neutral-600 rounded-full animate-spin mb-2"></div>
        <div className="text-neutral-600 text-sm">Loading data...</div>
      </div>
    );
  }

  return (
    <CenterControlProvider>
      <TooltipProvider>
        <div
          className={`h-screen w-screen flex flex-col overflow-hidden ${
            isTraining
              ? "bg-amber-50 border-t-4 border-amber-400"
              : "bg-gray-50"
          }`}
        >
          {/* Header */}
          <AuthHeader title={title} isTrainingMode={isTraining} />

          {/* Main content */}
          <div className="flex-1 min-h-0">{children}</div>

          {/* Confirmation Dialog */}
          {showConfirmation && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-sm p-5 max-w-md w-full mx-4">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-amber-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      Ready to Start the Real Task?
                    </h3>
                    <p className="text-xs text-gray-500">
                      This will be your final task. Make sure you're ready to
                      proceed.
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded p-3 mb-4">
                  <div className="flex items-center mb-2">
                    <h2 className="text-sm font-medium text-gray-700">
                      Task Information
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2 rounded border border-gray-100">
                      <div className="text-gray-500">Training Completed</div>
                      <div className="font-medium">✓</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-gray-100">
                      <div className="text-gray-500">Interface</div>
                      <div className="font-medium capitalize">
                        {pathname.split("/")[1]}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleConfirmNavigation}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 flex items-center"
                  >
                    <span>Start Real Task</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </TooltipProvider>
    </CenterControlProvider>
  );
}
