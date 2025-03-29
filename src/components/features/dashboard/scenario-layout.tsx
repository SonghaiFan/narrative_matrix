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

          // Handle navigation sequence
          if (!isIntroPage && !hasCompletedIntro) {
            // Intro not completed, go to intro
            router.push(`/${scenarioPath}/introduction`);
            return;
          } else if (!isTrainingPage && !isIntroPage && !hasCompletedTraining) {
            // Intro completed but training not completed, go to training
            router.push(`/${scenarioPath}/training`);
            return;
          }
        }
      }
    }
  }, [authLoading, isAuthenticated, user, router, pathname]);

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
        </div>
      </TooltipProvider>
    </CenterControlProvider>
  );
}
