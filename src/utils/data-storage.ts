// Storage keys
const SELECTED_FILE_STORAGE_KEY = "selectedFile";

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
    throw new Error(`Failed to fetch ${fileName}`);
  }
  return await response.json();
}
