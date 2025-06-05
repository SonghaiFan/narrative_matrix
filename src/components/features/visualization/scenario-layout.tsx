"use client";

import { ReactNode } from "react";
// import { TooltipProvider } from "@/contexts/tooltip-context";
import { AppHeader } from "@/components/ui/app-header";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface ScenarioLayoutProps {
  children: ReactNode;
  title: string;
  isLoading?: boolean;
  isTraining?: boolean;
  showColourLegend?: boolean;
}

export function ScenarioLayout({
  children,
  title,
  isLoading = false,
  isTraining = false,
  showColourLegend = false,
}: ScenarioLayoutProps) {
  // Show loading overlay for data loading
  if (isLoading) {
    return <LoadingSpinner fullPage text="Loading data..." />;
  }

  return (
    // <TooltipProvider>
    <div
      className={`h-screen w-screen flex flex-col overflow-hidden ${
        isTraining ? "bg-amber-50 border-t-4 border-amber-400" : "bg-gray-50"
      }`}
    >
      {/* Header */}
      <AppHeader
        title={title}
        isTrainingMode={isTraining}
        showColourLegend={showColourLegend}
      />

      {/* Main content */}
      <div className="flex-1 min-h-0">{children}</div>
    </div>
    // </TooltipProvider>
  );
}
