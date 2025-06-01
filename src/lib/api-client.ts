/**
 * API client for fetching scenario data from the API routes
 */

import { NarrativeMatrixData } from "@/types/data";

/**
 * Fetches scenario data from the API
 * @param scenarioId The scenario ID to fetch (e.g., 'text-visual-1')
 * @param isTraining Whether to fetch training data
 * @returns Promise with the loaded scenario data
 */
export async function fetchScenarioData(
  scenarioId: string,
  isTraining = false
): Promise<NarrativeMatrixData> {
  if (!scenarioId) {
    throw new Error("No scenario ID provided");
  }

  try {
    // Build the API URL with query parameters
    const url = `/api/scenarios/${scenarioId}?isTraining=${isTraining}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Ensure fresh data is fetched (not cached)
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `HTTP error! status: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error(
      `[fetchScenarioData] Failed to fetch scenario ${scenarioId}:`,
      error
    );
    throw new Error(`Failed to load scenario data for ${scenarioId}`);
  }
}
