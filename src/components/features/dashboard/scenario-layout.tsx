"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { CenterControlProvider } from "@/contexts/center-control-context";
import { TooltipProvider } from "@/contexts/tooltip-context";
import { AppHeader } from "@/components/ui/app-header";

interface ScenarioLayoutProps {
  children: ReactNode;
  title: string;
  isLoading?: boolean;
  isTraining?: boolean;
  showSentimentLegend?: boolean;
}

export function ScenarioLayout({
  children,
  title,
  isLoading = false,
  isTraining = false,
  showSentimentLegend = true,
}: ScenarioLayoutProps) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Original check for authentication (should remain if needed)
  // This MUST be called before any conditional returns to follow Rules of Hooks.
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log("[Layout] User not authenticated, redirecting to login.");
      router.push("/"); // Redirect to login if not authenticated
    }
  }, [authLoading, isAuthenticated, router]);

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
    <TooltipProvider>
      <div
        className={`h-screen w-screen flex flex-col overflow-hidden ${
          isTraining ? "bg-amber-50 border-t-4 border-amber-400" : "bg-gray-50"
        }`}
      >
        {/* Header */}
        <AppHeader
          title={title}
          isTrainingMode={isTraining}
          showSentimentLegend={showSentimentLegend}
        />

        {/* Main content */}
        <div className="flex-1 min-h-0">{children}</div>
      </div>
    </TooltipProvider>
  );
}
