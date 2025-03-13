"use client";

import { ReactNode } from "react";
import { ScenarioLayout } from "@/components/layouts/scenario-layout";
import { useScenarioData } from "@/hooks/use-scenario-data";
import { useAuth } from "@/contexts/auth-context";

interface ScenarioPageFactoryProps {
  title: string;
  renderContent: (props: {
    data: any;
    user: any;
    isLoading: boolean;
    error: string | null;
    fetchData: (fileName?: string) => Promise<void>;
  }) => ReactNode;
}

/**
 * Factory component for creating scenario pages with consistent data loading and error handling
 */
export function ScenarioPageFactory({
  title,
  renderContent,
}: ScenarioPageFactoryProps) {
  const { data, isLoading, error, fetchData } = useScenarioData();
  const { user } = useAuth();

  // Show error state
  if (error) {
    return (
      <ScenarioLayout title={title} isLoading={false}>
        <div className="h-full flex flex-col items-center justify-center p-4">
          <div className="text-red-500 mb-2">Error:</div>
          <div className="text-gray-700 mb-4 text-center max-w-md">
            {error || "Failed to load data"}
          </div>
          <button
            onClick={() => fetchData()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </ScenarioLayout>
    );
  }

  // If no data yet, show a placeholder
  if (!data || !data.events) {
    return (
      <ScenarioLayout title={title} isLoading={true}>
        <div className="h-full flex items-center justify-center">
          <div className="text-gray-500">Loading content...</div>
        </div>
      </ScenarioLayout>
    );
  }

  // Render the main content
  return (
    <ScenarioLayout title={title} isLoading={isLoading}>
      {renderContent({ data, user, isLoading, error, fetchData })}
    </ScenarioLayout>
  );
}
