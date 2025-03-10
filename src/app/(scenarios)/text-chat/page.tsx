"use client";

import { PureTextDisplay } from "@/components/features/narrative/pure-text/pure-text-display";
import { ChatInterface } from "@/components/features/chat/chat-interface";
import { TaskPanel } from "@/components/features/task/task-panel";
import { ResizableTwoRowCol } from "@/components/ui/resizable-layout/resizable-two-row-col";
import { useState, useEffect } from "react";
import { useCenterControl } from "@/contexts/center-control-context";
import { useAuth } from "@/contexts/auth-context";
import { ScenarioLayout } from "@/components/layouts/scenario-layout";

function PureTextChatScenario() {
  const { data, setData, isLoading, setIsLoading, error, setError } =
    useCenterControl();
  const { user } = useAuth();
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);

  // Fetch available data files
  useEffect(() => {
    const fetchAvailableFiles = async () => {
      try {
        const response = await fetch("/api/data-files");
        if (!response.ok) {
          throw new Error("Failed to fetch available data files");
        }
        const files = await response.json();
        setAvailableFiles(files);
      } catch (error) {
        console.error("Failed to fetch available data files:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to fetch available data files"
        );
      }
    };

    fetchAvailableFiles();
  }, [setError]);

  // Fetch data function
  const fetchData = async (fileName?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Default to the first file if none specified
      const fileToFetch =
        fileName ||
        (availableFiles.length > 0 ? availableFiles[0] : "default.json");

      const response = await fetch(`/${fileToFetch}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${fileToFetch}`);
      }

      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error("Failed to load data:", error);
      setError(error instanceof Error ? error.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    if (!data && availableFiles.length > 0) {
      fetchData(availableFiles[0]);
    }
  }, [data, availableFiles]);

  // Show error state
  if (error) {
    return (
      <ScenarioLayout title="Text + AI Chat" isLoading={false}>
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
      <ScenarioLayout title="Text + AI Chat" isLoading={true}>
        <div className="h-full flex items-center justify-center">
          <div className="text-gray-500">Loading content...</div>
        </div>
      </ScenarioLayout>
    );
  }

  return (
    <ScenarioLayout title="Text + AI Chat" isLoading={isLoading}>
      <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <PureTextDisplay events={data.events} />
        </div>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <ResizableTwoRowCol
            firstComponent={<ChatInterface events={data.events} />}
            secondComponent={
              <TaskPanel
                events={data.events}
                metadata={data.metadata}
                userRole={user?.role as "domain" | "normal"}
              />
            }
            defaultFirstSize={50}
            defaultSecondSize={50}
            direction="vertical"
          />
        </div>
      </div>
    </ScenarioLayout>
  );
}

export default function PureTextChatPage() {
  return <PureTextChatScenario />;
}
