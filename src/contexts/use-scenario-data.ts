import { useEffect, useCallback, useState } from "react";
import { useCenterControl } from "@/contexts/center-control-context";
import { loadDataFile } from "@/lib/data-storage";
import { NarrativeMatrixData } from "@/types/lite";
import { useAuth } from "@/contexts/auth-context";
import { Quiz, QuizItem } from "@/components/features/task/quiz-types";
import { ScenarioType } from "@/types/scenario";
import { useSearchParams } from "next/navigation";

// Direct imports of scenario metadata
// These are statically analyzed by Next.js at build time
import textVisual1Metadata from "@/app/(scenarios)/text-visual-1/metadata.json";
import textVisual3Metadata from "@/app/(scenarios)/text-visual-3/metadata.json";
import textVisual4Metadata from "@/app/(scenarios)/text-visual-4/metadata.json";
import textVisual5Metadata from "@/app/(scenarios)/text-visual-5/metadata.json";
import textVisual6Metadata from "@/app/(scenarios)/text-visual-6/metadata.json";
import textVisual7Metadata from "@/app/(scenarios)/text-visual-7/metadata.json";
import textVisual8Metadata from "@/app/(scenarios)/text-visual-8/metadata.json";
import textVisual9Metadata from "@/app/(scenarios)/text-visual-9/metadata.json";
import textVisual10Metadata from "@/app/(scenarios)/text-visual-10/metadata.json";
import textVisual11Metadata from "@/app/(scenarios)/text-visual-11/metadata.json";
import textVisual12Metadata from "@/app/(scenarios)/text-visual-12/metadata.json";

// Create a mapping of scenario IDs to their metadata
const scenarioMetadataMap: Record<string, any> = {
  "text-visual-1": textVisual1Metadata,
  "text-visual-3": textVisual3Metadata,
  "text-visual-4": textVisual4Metadata,
  "text-visual-5": textVisual5Metadata,
  "text-visual-6": textVisual6Metadata,
  "text-visual-7": textVisual7Metadata,
  "text-visual-8": textVisual8Metadata,
  "text-visual-9": textVisual9Metadata,
  "text-visual-10": textVisual10Metadata,
  "text-visual-11": textVisual11Metadata,
  "text-visual-12": textVisual12Metadata,
};

// Helper function to get scenario metadata
const getScenarioMetadata = (scenarioId: string) => {
  return scenarioMetadataMap[scenarioId] || null;
};

// Helper function to extract scenario ID from URL path or query parameters
const getScenarioFromPath = (): string | null => {
  if (typeof window === "undefined") return null;

  // First check if there's a scenario ID in URL search params
  const url = new URL(window.location.href);
  const scenarioParam = url.searchParams.get("scenario");
  if (scenarioParam && scenarioParam.startsWith("text-visual-")) {
    return scenarioParam;
  }

  // If we're in the /text-visual/ route, we need to look for scenario ID in localStorage or sessionStorage
  if (window.location.pathname.includes("/text-visual/")) {
    // Try to get the scenario from localStorage (persists across sessions)
    const storedScenario = localStorage.getItem("currentScenario");
    if (storedScenario && storedScenario.startsWith("text-visual-")) {
      return storedScenario;
    }

    // If not in localStorage, try sessionStorage (persists within a session)
    const sessionScenario = sessionStorage.getItem("currentScenario");
    if (sessionScenario && sessionScenario.startsWith("text-visual-")) {
      return sessionScenario;
    }

    // Default to text-visual-8 if nothing else is found
    return "text-visual-8";
  }

  // For direct paths like /text-visual-8/... extract the ID
  const pathSegments = window.location.pathname.split("/");
  for (const segment of pathSegments) {
    if (segment.startsWith("text-visual-")) {
      return segment;
    }
  }

  return null;
};

/**
 * Custom hook for handling data loading in scenario pages
 * Centralizes the common data fetching logic used across different scenario pages
 */
export function useScenarioData(isTraining = false) {
  const { selectedScenario, setSelectedScenario } = useCenterControl();
  const { currentScenario, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<NarrativeMatrixData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forcedScenario, setForcedScenario] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Try to get scenario from localStorage on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("currentScenario");
      if (stored && stored.startsWith("text-visual-")) {
        setForcedScenario(stored);
      } else {
        // Set a default scenario if none exists
        localStorage.setItem("currentScenario", "text-visual-8");
        setForcedScenario("text-visual-8");
      }
    }
  }, []);

  // Store the current scenario in localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined" && selectedScenario) {
      localStorage.setItem("currentScenario", selectedScenario as string);
    }
  }, [selectedScenario]);

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

        processedData.metadata.quiz = quizData.quiz || [];

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
        console.error("Error processing quiz data:", error);
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
      forcedScenario,
      isTraining,
    });
    setIsLoading(true);
    setError(null);

    try {
      // Check URL params first for scenario
      const scenarioParam = searchParams?.get(
        "scenario"
      ) as ScenarioType | null;

      // Get the current scenario ID, prioritizing:
      // 1. URL query param
      // 2. center-control context
      // 3. Path or localStorage
      // 4. forced scenario (from initial localStorage check)
      // 5. auth context
      // 6. hardcoded fallback
      const pathScenario = getScenarioFromPath();
      const scenarioId =
        scenarioParam ||
        (selectedScenario as string) ||
        pathScenario ||
        forcedScenario ||
        currentScenario ||
        "text-visual-8"; // Hardcoded fallback

      console.log("Selected scenarioId:", scenarioId, {
        fromParam: scenarioParam,
        fromSelected: selectedScenario,
        fromPath: pathScenario,
        fromForced: forcedScenario,
        fromCurrent: currentScenario,
      });

      if (!scenarioId) {
        console.warn("Using fallback scenario: text-visual-8");
      }

      // Update the selected scenario in context if it's different
      if (
        selectedScenario !== scenarioId &&
        typeof setSelectedScenario === "function"
      ) {
        setSelectedScenario(scenarioId as ScenarioType);
      }

      const scenarioMeta = scenarioId ? getScenarioMetadata(scenarioId) : null;
      console.log("Scenario metadata for", scenarioId, ":", scenarioMeta);

      // If we don't have metadata for this scenario ID, use text-visual-8 as fallback
      const fallbackScenarioId = scenarioMeta ? scenarioId : "text-visual-8";
      const fallbackMeta = scenarioMeta || getScenarioMetadata("text-visual-8");

      if (fallbackScenarioId !== scenarioId) {
        console.log("Using fallback scenario metadata from text-visual-8");
      }

      const dataSource = isTraining ? "train_data.json" : "data.json";
      const loadedData = await loadDataFile<NarrativeMatrixData>(dataSource);

      const processedData = await processData(
        loadedData,
        fallbackMeta,
        fallbackScenarioId
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
      forcedScenario,
      pathScenario: getScenarioFromPath(),
      urlParam: searchParams?.get("scenario"),
    });
    if (!authLoading) {
      fetchData();
    }
  }, [
    authLoading,
    isTraining,
    selectedScenario,
    currentScenario,
    forcedScenario,
    searchParams,
  ]);

  return {
    data,
    isLoading: isLoading || authLoading,
    error,
    fetchData,
    processData,
  };
}
