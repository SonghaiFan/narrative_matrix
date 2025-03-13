import { useState, useEffect } from "react";
import { useCenterControl } from "@/contexts/center-control-context";
import {
  getBestFileToUse,
  fetchAvailableFiles,
  loadDataFile,
} from "@/utils/data-storage";
import { NarrativeMatrixData } from "@/types/narrative/lite";

/**
 * Custom hook for handling data loading in scenario pages
 * Centralizes the common data fetching logic used across different scenario pages
 */
export function useScenarioData() {
  const { data, setData, isLoading, setIsLoading, error, setError } =
    useCenterControl();
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);

  // Fetch available data files
  useEffect(() => {
    const getAvailableFiles = async () => {
      try {
        const files = await fetchAvailableFiles();
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

    getAvailableFiles();
  }, [setError]);

  // Fetch data function
  const fetchData = async (fileName?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Use the utility function to get the best file to use
      const fileToFetch = fileName || getBestFileToUse(availableFiles);
      const data = await loadDataFile<NarrativeMatrixData>(fileToFetch);
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
      // Use the utility function to get the best file to use
      const fileToUse = getBestFileToUse(availableFiles);
      fetchData(fileToUse);
    }
  }, [data, availableFiles]);

  return {
    data,
    isLoading,
    error,
    fetchData,
    availableFiles,
  };
}
