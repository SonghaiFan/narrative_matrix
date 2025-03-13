import { useState, useEffect, useCallback } from "react";
import {
  getSelectedFileFromStorage,
  setSelectedFileInStorage,
  fetchAvailableFiles,
  loadDataFile,
} from "@/utils/data-storage";
import { NarrativeMatrixData } from "@/types/narrative/lite";
import { useCenterControl } from "@/contexts/center-control-context";

interface UseFileSelectorOptions {
  onDataChange?: (data: NarrativeMatrixData) => void;
  externalSelectedFile?: string;
  externalSetSelectedFile?: (file: string) => void;
}

/**
 * Custom hook for file selection UI and logic
 */
export function useFileSelector({
  onDataChange,
  externalSelectedFile,
  externalSetSelectedFile,
}: UseFileSelectorOptions = {}) {
  const { isLoading, setIsLoading, clearSelections, data } = useCenterControl();
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>(() => {
    // Initialize from props or localStorage or empty string
    if (externalSelectedFile) return externalSelectedFile;

    // Check localStorage when running in browser
    const storedFile = getSelectedFileFromStorage();
    if (storedFile) return storedFile;

    return "";
  });

  // Use the external value if provided, otherwise use the internal state
  const effectiveSelectedFile = externalSelectedFile || selectedFile;
  const effectiveSetSelectedFile =
    externalSetSelectedFile ||
    ((file: string) => {
      setSelectedFile(file);
      // Store in localStorage when using internal state
      setSelectedFileInStorage(file);
    });

  // Fetch available data files
  useEffect(() => {
    const getFiles = async () => {
      try {
        const files = await fetchAvailableFiles();
        setAvailableFiles(files);

        // If we don't have a selected file yet and files are available, select the first one
        if (!effectiveSelectedFile && files.length > 0) {
          // Try to find the first non-archived file
          const nonArchivedFile = files.find(
            (file: string) => !file.startsWith("archived/")
          );
          const fileToSelect = nonArchivedFile || files[0];

          // Use the effective setter which handles localStorage
          effectiveSetSelectedFile(fileToSelect);
        }
        // If we have a selected file but it's not in the available files,
        // select the first available file
        else if (
          effectiveSelectedFile &&
          !files.includes(effectiveSelectedFile)
        ) {
          const nonArchivedFile = files.find(
            (file: string) => !file.startsWith("archived/")
          );
          const fileToSelect = nonArchivedFile || files[0];

          // Use the effective setter which handles localStorage
          effectiveSetSelectedFile(fileToSelect);
        }
      } catch (error) {
        console.error("Failed to fetch available data files:", error);
      }
    };

    getFiles();
  }, [effectiveSelectedFile, effectiveSetSelectedFile]);

  // Handle file selection
  const handleFileChange = useCallback(
    async (fileName: string) => {
      if (fileName === effectiveSelectedFile) return;

      setIsLoading(true);

      // Use the effective setter which handles localStorage
      effectiveSetSelectedFile(fileName);

      // Clear all selections when changing files
      clearSelections();

      try {
        const data = await loadDataFile<NarrativeMatrixData>(fileName);
        onDataChange?.(data);
      } catch (error) {
        console.error("Failed to load data file:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [
      onDataChange,
      setIsLoading,
      clearSelections,
      effectiveSelectedFile,
      effectiveSetSelectedFile,
    ]
  );

  // Update selectedFile when data changes from outside this component
  useEffect(() => {
    // This is a simple heuristic to detect which file is currently loaded
    // We compare the title and first event to guess which file it is
    if (data && availableFiles.length > 0 && !isLoading) {
      const checkCurrentFile = async () => {
        // Skip if we're already loading
        if (isLoading) return;

        // First check if the current selectedFile matches the data
        // This avoids unnecessary API calls
        if (effectiveSelectedFile) {
          try {
            const fileData = await loadDataFile<NarrativeMatrixData>(
              effectiveSelectedFile
            );

            // If this file matches the current data, we're done
            if (
              fileData.metadata.title === data.metadata.title &&
              fileData.events.length > 0 &&
              data.events.length > 0 &&
              fileData.events[0].index === data.events[0].index
            ) {
              return; // Current selection is correct
            }
          } catch (error) {
            console.error(
              `Error checking current file ${effectiveSelectedFile}:`,
              error
            );
          }
        }

        // If we get here, we need to check all files
        for (const file of availableFiles) {
          // Skip the current file as we already checked it
          if (file === effectiveSelectedFile) continue;

          try {
            const fileData = await loadDataFile<NarrativeMatrixData>(file);

            // Check if this file matches the current data
            if (
              fileData.metadata.title === data.metadata.title &&
              fileData.events.length > 0 &&
              data.events.length > 0 &&
              fileData.events[0].index === data.events[0].index
            ) {
              effectiveSetSelectedFile(file);
              break;
            }
          } catch (error) {
            console.error(`Error checking file ${file}:`, error);
          }
        }
      };

      checkCurrentFile();
    }
  }, [
    data,
    availableFiles,
    effectiveSelectedFile,
    isLoading,
    effectiveSetSelectedFile,
  ]);

  return {
    availableFiles,
    selectedFile: effectiveSelectedFile,
    setSelectedFile: handleFileChange,
    isLoading,
  };
}
