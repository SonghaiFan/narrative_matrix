import { useEffect, useCallback, useState } from "react";
import { useCenterControl } from "@/contexts/center-control-context";
import { loadDataFile } from "@/lib/data-storage";
import { NarrativeMatrixData } from "@/types/lite";
import { useAuth } from "@/contexts/auth-context";

/**
 * Custom hook for handling client-side data loading aspects IF NEEDED.
 * NOTE: For dynamic routes, primary data loading is now server-side.
 * This hook might still be used by components outside dynamic routes or for client-specific data needs.
 */
export function useScenarioData(isTraining = false) {
  const { selectedScenario } = useCenterControl();
  const { scenarioId } = useAuth();
  const [data, setData] = useState<NarrativeMatrixData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forcedScenario, setForcedScenario] = useState<string | null>(null);

  // Try to get scenario from localStorage on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("currentScenario");
      if (stored && stored.startsWith("text-visual-")) {
        setForcedScenario(stored);
      } else {
        localStorage.setItem("currentScenario", "text-visual-1");
        setForcedScenario("text-visual-1");
      }
    }
  }, []);

  // Store the current scenario in localStorage when it changes
  // Keep this for potential backward compatibility or other component usage
  useEffect(() => {
    if (typeof window !== "undefined" && selectedScenario) {
      localStorage.setItem("currentScenario", selectedScenario as string);
    }
  }, [selectedScenario]);

  // Fetch data function - Simplified for client-side needs
  const fetchData = useCallback(async () => {
    console.log("[useScenarioData] fetchData called with:", {
      selectedScenario,
      scenarioId,
      forcedScenario,
      isTraining,
    });
    setIsLoading(true);
    setError(null);

    // Determine scenario ID based on context/localStorage/auth/fallback
    const scenarioIdForData =
      (selectedScenario as string) ||
      forcedScenario ||
      scenarioId ||
      "text-visual-1";

    console.log(
      "[useScenarioData] Selected scenarioId for data fetch:",
      scenarioIdForData
    );

    try {
      // Fetch the BASE data file client-side
      // Quiz processing/ordering is assumed to be done server-side now
      const dataSource = isTraining ? "train_data.json" : "data.json";
      console.log(`[useScenarioData] Fetching client-side data: ${dataSource}`);
      const loadedData = await loadDataFile<NarrativeMatrixData>(dataSource);

      // Set the raw data (no client-side quiz processing)
      setData(loadedData);
    } catch (error) {
      console.error("[useScenarioData] Error in client fetchData:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load client data"
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedScenario,
    scenarioId,
    forcedScenario,
    isTraining,
    setIsLoading,
    setError,
    setData,
  ]);

  // Effect to trigger fetch
  useEffect(() => {
    console.log("[useScenarioData] Effect triggered:", {
      scenarioId,
      selectedScenario,
    });
    fetchData();
  }, [scenarioId, selectedScenario, fetchData]);

  return {
    data,
    isLoading: isLoading,
    error,
    fetchData, // Expose fetchData if needed by components
  };
}
