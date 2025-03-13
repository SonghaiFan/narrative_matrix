// Constants
export const SELECTED_FILE_STORAGE_KEY = "narrative-matrix-selected-file";

/**
 * Gets the selected file from localStorage
 * @returns The selected file from localStorage or null if not found
 */
export function getSelectedFileFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SELECTED_FILE_STORAGE_KEY);
}

/**
 * Sets the selected file in localStorage
 * @param fileName The file name to store
 */
export function setSelectedFileInStorage(fileName: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SELECTED_FILE_STORAGE_KEY, fileName);
}

/**
 * Gets the best file to use based on localStorage and available files
 * @param availableFiles List of available files
 * @param defaultFile Default file to use if no file is found
 * @returns The best file to use
 */
export function getBestFileToUse(
  availableFiles: string[],
  defaultFile: string = "default.json"
): string {
  const storedFile = getSelectedFileFromStorage();

  // Use the stored file if available and in the available files list
  if (storedFile && availableFiles.includes(storedFile)) {
    return storedFile;
  }

  // Try to find the first non-archived file
  const nonArchivedFile = availableFiles.find(
    (file) => !file.startsWith("archived/")
  );

  // Otherwise use the first available file or the default
  return (
    nonArchivedFile ||
    (availableFiles.length > 0 ? availableFiles[0] : defaultFile)
  );
}

/**
 * Fetches available data files from the API
 * @returns Promise with the list of available files
 * @throws Error if the fetch fails
 */
export async function fetchAvailableFiles(): Promise<string[]> {
  const response = await fetch("/api/data-files");
  if (!response.ok) {
    throw new Error("Failed to fetch available data files");
  }
  return await response.json();
}

/**
 * Loads data from a specific file
 * @param fileName The file name to load
 * @returns Promise with the loaded data
 * @throws Error if the fetch fails
 */
export async function loadDataFile<T>(fileName: string): Promise<T> {
  // Handle paths correctly - if the file is in the archived directory
  const filePath = fileName.startsWith("archived/")
    ? fileName // Keep the path as is
    : fileName; // No path prefix needed

  const response = await fetch(`/${filePath}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${fileName}`);
  }
  return await response.json();
}
