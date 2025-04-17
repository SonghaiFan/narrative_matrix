import { useEffect, useCallback, useState } from "react";
import { useCenterControl } from "@/contexts/center-control-context";
import { loadDataFile } from "@/lib/data-storage";
import { NarrativeMatrixData, NarrativeMetadata } from "@/types/lite";
import { useAuth } from "@/contexts/auth-context";
import { Quiz } from "@/components/features/task/quiz-types";

// Direct imports of scenario metadata
// These are statically analyzed by Next.js at build time
import textVisual1Metadata from "@/app/(scenarios)/text-visual-1/metadata.json";
import textVisual4Metadata from "@/app/(scenarios)/text-visual-4/metadata.json";
// Add imports for other scenarios as needed

// Create a mapping of scenario IDs to their metadata
const scenarioMetadataMap: Record<string, any> = {
  "text-visual-1": textVisual1Metadata,
  "text-visual-4": textVisual4Metadata,
  // You can add the rest of your scenarios here
  // For scenarios that don't have explicit imports yet, you can use:
  // 'text-visual-2': { quizOrder: { preferredOrder: ['default', 'order'] } },
};

// Helper function to get scenario metadata
const getScenarioMetadata = (scenarioId: string) => {
  return scenarioMetadataMap[scenarioId] || null;
};

/**
 * Custom hook for handling data loading in scenario pages
 * Centralizes the common data fetching logic used across different scenario pages
 */
export function useScenarioData(isTraining = false) {
  const { selectedScenario } = useCenterControl();
  const { currentScenario, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<NarrativeMatrixData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Process the loaded data before setting it to state
   * This function reorders quiz questions based on the scenario's preferred order
   */
  const processData = useCallback(
    async (
      rawData: NarrativeMatrixData,
      scenarioMeta: any
    ): Promise<NarrativeMatrixData> => {
      // Create a copy of the data to modify
      const processedData = { ...rawData };

      try {
        // Load quiz data based on training mode
        const quizData = await loadDataFile<Quiz>(
          isTraining ? "train_quiz_data.json" : "quiz_data.json"
        );

        // Update metadata with quiz data
        if (!processedData.metadata) {
          processedData.metadata = {
            title: "",
            description: "",
            topic: "",
            author: "",
            publishDate: new Date().toISOString(),
            quiz: [],
            quiz_recall: [],
          };
        }

        processedData.metadata.quiz = quizData.quiz || [];
        processedData.metadata.quiz_recall = quizData.quiz_recall || [];

        // If we have scenario metadata with quizOrder, use it to sort the quiz questions
        if (
          scenarioMeta?.quizOrder?.preferredOrder &&
          Array.isArray(scenarioMeta.quizOrder.preferredOrder) &&
          processedData.metadata?.quiz &&
          Array.isArray(processedData.metadata.quiz)
        ) {
          const preferredOrder = scenarioMeta.quizOrder
            .preferredOrder as string[];

          console.log(
            "🔄 Using preferred order from scenario metadata:",
            preferredOrder
          );

          // Log original question order before sorting
          console.log(
            "📊 Original quiz question order:",
            processedData.metadata.quiz.map((q) => q.id || (q as any).pattern)
          );

          // Sort the quiz questions based on the preferred order
          processedData.metadata.quiz.sort((a, b) => {
            // Find the position of each question in the preferred order
            const findPosition = (q: any) => {
              // Try to match by ID or pattern
              const pattern = q.id || (q as any).pattern || "";
              // Find the first matching pattern in preferredOrder
              const index = preferredOrder.findIndex(
                (p: string) =>
                  pattern.toString().startsWith(p) ||
                  pattern.toString().includes(p)
              );
              // If no match found, place at the end
              return index === -1 ? Number.MAX_SAFE_INTEGER : index;
            };

            return findPosition(a) - findPosition(b);
          });

          console.log(
            "✅ Quiz questions reordered according to preferredOrder:",
            processedData.metadata.quiz.map((q) => q.id || (q as any).pattern)
          );
        } else {
          console.log(
            "⚠️ No preferred order found in scenario metadata or no quiz questions to sort"
          );
        }
      } catch (error) {
        console.error("❌ Failed to load quiz data:", error);
        // Set empty arrays if quiz data loading fails
        if (processedData.metadata) {
          processedData.metadata.quiz = [];
          processedData.metadata.quiz_recall = [];
        }
      }

      return processedData;
    },
    [isTraining]
  );

  // Fetch data function
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get the current scenario ID, prioritizing center-control context, then auth context
      const scenarioId = selectedScenario || currentScenario || "";
      console.log("🚀 Loading data for scenario:", scenarioId);

      // Get scenario metadata directly from our mapping - no network request
      const scenarioMeta = scenarioId ? getScenarioMetadata(scenarioId) : null;

      // Load the main data file
      const dataSource = isTraining ? "train_data.json" : "data.json";
      console.log(`📂 Loading data file: ${dataSource}`);
      const loadedData = await loadDataFile<NarrativeMatrixData>(dataSource);

      // Process the loaded data with the scenario metadata for ordering
      const processedData = await processData(loadedData, scenarioMeta);
      setData(processedData);
    } catch (error) {
      console.error("❌ Failed to load data:", error);
      setError(error instanceof Error ? error.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial data when the component mounts or scenario changes
  useEffect(() => {
    if (!authLoading) {
      console.log(
        "Loading data with scenario from context:",
        selectedScenario || currentScenario
      );
      fetchData();
    }
  }, [authLoading, isTraining, selectedScenario, currentScenario]);

  return {
    data,
    isLoading: isLoading || authLoading,
    error,
    fetchData,
    processData,
  };
}
