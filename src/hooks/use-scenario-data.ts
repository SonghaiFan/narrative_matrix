import { useState, useEffect } from "react";
import { useCenterControl } from "@/contexts/center-control-context";
import { loadDataFile } from "@/utils/data-storage";
import { NarrativeMatrixData } from "@/types/narrative/lite";

/**
 * Custom hook for handling data loading in scenario pages
 * Centralizes the common data fetching logic used across different scenario pages
 */
export function useScenarioData(isTraining = false) {
  const { data, setData, isLoading, setIsLoading, error, setError } =
    useCenterControl();

  // Fetch data function
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fixed data sources:
      // - training mode always uses train_data.json
      // - real tasks always use data.json
      const dataSource = isTraining ? "train_data.json" : "data.json";
      const loadedData = await loadDataFile<NarrativeMatrixData>(dataSource);
      setData(loadedData);
    } catch (error) {
      console.error("Failed to load data:", error);
      setError(error instanceof Error ? error.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchData();
  }, [isTraining]);

  return {
    data,
    isLoading,
    error,
    fetchData,
  };
}
