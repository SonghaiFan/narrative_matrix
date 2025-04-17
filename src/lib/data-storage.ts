/**
 * Loads data from a specific file by fetching it.
 * Assumes the file is available in the public directory.
 * @param fileName The file name to load (e.g., 'data.json')
 * @returns Promise with the loaded data
 * @throws Error if the fetch fails
 */
export async function loadDataFile<T>(fileName: string): Promise<T> {
  if (!fileName) {
    throw new Error("No file name provided");
  }

  // Client-side or universal: Fetch from the public path
  try {
    const response = await fetch(`/${fileName}`);
    if (!response.ok) {
      throw new Error(
        `HTTP error! status: ${response.status} ${response.statusText}`
      );
    }
    return await response.json();
  } catch (error) {
    console.error(`[loadDataFile] Failed to fetch ${fileName}:`, error);
    // Re-throw or handle error as appropriate for the context it's used in
    throw new Error(`Failed to load data file ${fileName}`);
  }
}
