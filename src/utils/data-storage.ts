// Storage keys
const SELECTED_FILE_STORAGE_KEY = "selectedFile";

/**
 * Gets the selected file from localStorage
 * @returns The selected file name or null if not set
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
 * Fetches the list of available data files
 * @returns Promise with array of file names
 */
export async function fetchAvailableFiles(): Promise<string[]> {
  try {
    const response = await fetch("/api/files");
    if (!response.ok) {
      throw new Error("Failed to fetch available files");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching available files:", error);
    return [];
  }
}

/**
 * Loads data from a specific file
 * @param fileName The file name to load
 * @returns Promise with the loaded data
 * @throws Error if the fetch fails
 */
export async function loadDataFile<T>(fileName: string): Promise<T> {
  // Ensure we have a valid file name
  if (!fileName) {
    throw new Error("No file name provided");
  }

  const response = await fetch(`/${fileName}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${fileName}: ${response.statusText}`);
  }
  return response.json();
}
