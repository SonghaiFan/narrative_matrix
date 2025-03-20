"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCenterControl } from "@/contexts/center-control-context";
import { ProfileSection } from "./data-profile";
import { ScenarioCard } from "./scenario-card";
import { ScenarioType } from "@/types/shared/scenario";
import { NarrativeMatrixData } from "@/types/narrative/lite";
import {
  getSelectedFileFromStorage,
  setSelectedFileInStorage,
} from "@/utils/data-storage";

export function ScenarioSelector() {
  const router = useRouter();
  const {
    data,
    setData,
    selectedScenario,
    setSelectedScenario,
    setIsLoading: setContextIsLoading,
  } = useCenterControl();
  const [isLoading, setIsLoading] = useState(true);
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Fetch available data files
  useEffect(() => {
    const fetchAvailableFiles = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/data-files");
        if (!response.ok) {
          throw new Error("Failed to fetch available data files");
        }
        const files = await response.json();
        setAvailableFiles(files);

        // Get selected file from storage
        const storedFile = getSelectedFileFromStorage();

        // If there's a stored file and it's in the available files, use it
        if (storedFile && files.includes(storedFile)) {
          setSelectedFile(storedFile);
        } else if (files.length > 0) {
          // Otherwise default to the first file
          setSelectedFile(files[0]);
          setSelectedFileInStorage(files[0]);
        }
      } catch (error) {
        console.error("Failed to fetch available data files:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableFiles();
  }, []);

  // Update localStorage when selectedFile changes
  useEffect(() => {
    if (selectedFile) {
      setSelectedFileInStorage(selectedFile);
    }
  }, [selectedFile]);

  // Fetch initial data if not already loaded
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!data && selectedFile) {
        try {
          setIsLoading(true);
          setContextIsLoading(true);

          // Handle paths correctly - if the file is in the archived directory
          const filePath = selectedFile.startsWith("archived/")
            ? selectedFile // Keep the path as is
            : selectedFile; // No path prefix needed

          const response = await fetch(`/${filePath}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch ${selectedFile}`);
          }
          const narrativeMatrixData = await response.json();
          setData(narrativeMatrixData);
        } catch (error) {
          console.error("Failed to load initial data:", error);
        } finally {
          setIsLoading(false);
          setContextIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [data, setData, setContextIsLoading, selectedFile]);

  // Handle data change from ProfileSection
  const handleDataChange = (newData: NarrativeMatrixData) => {
    setData(newData);
  };

  const handleScenarioSelect = (scenario: ScenarioType) => {
    setSelectedScenario(scenario);
  };

  const handleContinue = () => {
    if (selectedScenario) {
      // Map scenario types to their correct routes
      const routeMap: Record<string, string> = {
        "pure-text": "/pure-text",
        "text-visual": "/text-visual",
        "text-chat": "/text-chat",
        mixed: "/mixed",
      };

      router.push(routeMap[selectedScenario]);
    }
  };

  // Handle file selection change
  const handleFileSelectionChange = (file: string) => {
    setSelectedFile(file);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-neutral-300 border-t-neutral-600 rounded-full animate-spin mb-2"></div>
        <div className="text-neutral-600 text-sm">Loading data...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-neutral-500 text-sm">No data available</div>
      </div>
    );
  }

  const { metadata, events } = data;

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-1">
          Scenario Selection
        </h2>
        <p className="text-xs text-gray-500">
          Choose how you'd like to explore the narrative data
        </p>
      </div>

      <div className="flex flex-1 items-center overflow-auto p-3 sm:p-4 md:p-5">
        <div className="h-full w-full flex flex-col md:flex-row gap-4 lg:gap-5">
          {/* Left column - Profile Section */}
          <div className="md:w-2/5 bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
            <div className="h-full overflow-auto">
              <ProfileSection
                title={metadata.title || ""}
                description={metadata.description || ""}
                topic={metadata.topic || ""}
                author={metadata.author || ""}
                publishDate={metadata.publishDate || ""}
                imageUrl={metadata.imageUrl}
                events={events || []}
                onDataChange={handleDataChange}
                selectedFile={selectedFile || ""}
                setSelectedFile={handleFileSelectionChange}
              />
            </div>
          </div>

          {/* Right column - Scenario Selection */}
          <div className="md:w-3/5 flex flex-col h-full bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                Choose a exploration scenario
              </h2>
              <p className="text-xs text-gray-500">
                Select how you'd like to explore the narrative data
              </p>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Standard Views */}
                <div className="space-y-5">
                  <div className="text-xs font-medium text-gray-500 pl-1 flex items-center">
                    <span className="border-l-2 border-gray-300 pl-1.5">
                      Standard Views
                    </span>
                  </div>
                  <ScenarioCard
                    title="Text"
                    description="Display events in narrative order like a normal news article."
                    imageSrc="/images/pure-text-preview.svg"
                    onClick={() => handleScenarioSelect("pure-text")}
                    isSelected={selectedScenario === "pure-text"}
                  />
                  <ScenarioCard
                    title="Text + visual"
                    description="Interactive mixed with topic flow, entity relationships, and timeline views."
                    imageSrc="/images/visualization-preview.svg"
                    onClick={() => handleScenarioSelect("text-visual")}
                    isSelected={selectedScenario === "text-visual"}
                  />
                </div>

                {/* AI-Powered Views */}
                <div className="space-y-5">
                  <div className="text-xs font-medium text-gray-500 pl-1 flex items-center">
                    <span className="border-l-2 border-gray-300 pl-1.5">
                      AI-Powered Views
                    </span>
                  </div>
                  <ScenarioCard
                    title="Text + AI Chat"
                    description="Text view with an AI assistant that can answer questions about the narrative."
                    imageSrc="/images/text-chat-preview.svg"
                    onClick={() => handleScenarioSelect("text-chat")}
                    isSelected={selectedScenario === "text-chat"}
                  />
                  <ScenarioCard
                    title="mixed + AI Chat"
                    description="Interactive visualizations with an AI assistant to help interpret the data."
                    imageSrc="/images/mixed-preview.svg"
                    onClick={() => handleScenarioSelect("mixed")}
                    isSelected={selectedScenario === "mixed"}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between">
              <button
                type="button"
                className={`rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition-all ${
                  selectedScenario
                    ? "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
                disabled={!selectedScenario}
                onClick={handleContinue}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
