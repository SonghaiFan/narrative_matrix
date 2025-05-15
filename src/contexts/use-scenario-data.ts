import { useEffect, useCallback, useState } from "react";
import { useCenterControl } from "@/contexts/center-control-context";
import { fetchScenarioData } from "@/lib/api-client";
import { NarrativeMatrixData } from "@/types/data";
import { useAuth } from "@/contexts/auth-context";

/**
 * Custom hook for handling client-side data loading
 * Refactored to use the API route for fetching scenario data
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
  useEffect(() => {
    if (typeof window !== "undefined" && selectedScenario) {
      localStorage.setItem("currentScenario", selectedScenario as string);
    }
  }, [selectedScenario]);

  // Fetch data function - Updated to use the API route
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
      // Fetch data from the API route instead of direct file loading
      console.log(
        `[useScenarioData] Fetching scenario data: ${scenarioIdForData}, training: ${isTraining}`
      );
      const loadedData = await fetchScenarioData(scenarioIdForData, isTraining);
      setData(loadedData);
    } catch (error) {
      console.error("[useScenarioData] Error in fetchData:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load scenario data"
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedScenario, scenarioId, forcedScenario, isTraining]);

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
    isLoading,
    error,
    fetchData, // Expose fetchData if needed by components
  };
}
