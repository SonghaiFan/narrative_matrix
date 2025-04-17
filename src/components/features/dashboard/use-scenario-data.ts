import { useEffect, useCallback, useState } from "react";
import { useCenterControl } from "@/contexts/center-control-context";
import { loadDataFile } from "@/lib/data-storage";
import { NarrativeMatrixData, NarrativeMetadata } from "@/types/lite";
import { useAuth } from "@/contexts/auth-context";
import { Quiz, QuizItem } from "@/components/features/task/quiz-types";

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
      scenarioMeta: any,
      scenarioId: string
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
          };
        }

        // Filter quiz questions to only include Information Retrieval level
        const filteredQuiz = (quizData.quiz || []).filter(
          (q: QuizItem) => q.level === "Information Retrieval"
        );

        processedData.metadata.quiz = filteredQuiz;

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
            `[Scenario: ${scenarioId}] Preferred order:`,
            preferredOrder
          );
          console.log(
            `[Scenario: ${scenarioId}] Quiz items before ordering:`,
            processedData.metadata.quiz.map((q) => q.id)
          );

          processedData.metadata.quiz.sort((a, b) => {
            const findPosition = (q: QuizItem) => {
              const pattern = q.id || (q as any).pattern || "";
              const index = preferredOrder.findIndex(
                (p) =>
                  pattern.toString().startsWith(p) ||
                  pattern.toString().includes(p)
              );
              return index === -1 ? Number.MAX_SAFE_INTEGER : index;
            };

            return findPosition(a) - findPosition(b);
          });

          console.log(
            `[Scenario: ${scenarioId}] Quiz items after ordering:`,
            processedData.metadata.quiz.map((q) => q.id)
          );
        }
      } catch (error) {
        if (processedData.metadata) {
          processedData.metadata.quiz = [];
        }
      }

      return processedData;
    },
    [isTraining]
  );

  // Fetch data function
  const fetchData = async () => {
    console.log("fetchData called with:", {
      selectedScenario,
      currentScenario,
      isTraining,
    });
    setIsLoading(true);
    setError(null);

    try {
      // Get the current scenario ID, prioritizing center-control context, then auth context
      const scenarioId = selectedScenario || currentScenario || "";
      console.log("Selected scenarioId:", scenarioId, {
        fromSelected: selectedScenario,
        fromCurrent: currentScenario,
      });

      if (!scenarioId) {
        console.warn("No scenario ID found");
        return;
      }

      const scenarioMeta = scenarioId ? getScenarioMetadata(scenarioId) : null;
      console.log("Scenario metadata for", scenarioId, ":", scenarioMeta);

      const dataSource = isTraining ? "train_data.json" : "data.json";
      const loadedData = await loadDataFile<NarrativeMatrixData>(dataSource);

      const processedData = await processData(
        loadedData,
        scenarioMeta,
        scenarioId
      );
      setData(processedData);
    } catch (error) {
      console.error("Error in fetchData:", error);
      setError(error instanceof Error ? error.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial data when the component mounts or scenario changes
  useEffect(() => {
    console.log("Scenario selection changed:", {
      authLoading,
      isTraining,
      selectedScenario,
      currentScenario,
    });
    if (!authLoading) {
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
