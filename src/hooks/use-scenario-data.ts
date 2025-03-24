import { useState, useEffect } from "react";
import { useCenterControl } from "@/contexts/center-control-context";
import { loadDataFile } from "@/utils/data-storage";
import { NarrativeMatrixData } from "@/types/narrative/lite";
import { useAuth } from "@/contexts/auth-context";

/**
 * Custom hook for handling data loading in scenario pages
 * Centralizes the common data fetching logic used across different scenario pages
 */
export function useScenarioData(isTraining = false) {
  const { data, setData, isLoading, setIsLoading, error, setError } =
    useCenterControl();
  const { user, isLoading: authLoading } = useAuth();

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

  // Load initial data only after auth is complete and when isTraining changes
  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [authLoading, isTraining]);

  return {
    data,
    isLoading: isLoading || authLoading, // Consider auth loading as part of data loading
    error,
    fetchData,
  };
}
