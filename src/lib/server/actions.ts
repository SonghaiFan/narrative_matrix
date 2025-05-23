"use server";

import { NarrativeMatrixData } from "@/types/data";
import { loadAndProcessScenarioData } from "./scenario-data";

/**
 * Server action to load scenario data
 */
export async function loadScenarioData(
  scenarioId: string,
  flowIndex?: number
): Promise<NarrativeMatrixData> {
  try {
    console.log(
      `[server/actions] Starting loadScenarioData for scenario: ${scenarioId}, flowIndex: ${flowIndex}`
    );

    // Validate params
    if (!scenarioId) {
      console.error("[server/actions] Missing required scenarioId");
      throw new Error("Missing required scenarioId");
    }

    // Call the data processing function
    const data = await loadAndProcessScenarioData(scenarioId, flowIndex);

    console.log(
      `[server/actions] Successfully loaded data for scenario: ${scenarioId}, flowIndex: ${flowIndex}`
    );
    return data;
  } catch (error) {
    console.error(
      `[server/actions] Error in loadScenarioData server action:`,
      error
    );

    // Create a more user-friendly error message with detailed information
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error occurred while loading scenario data";

    // Rethrow with a more specific message that will be displayed to users
    throw new Error(
      `Failed to load data for scenario ${scenarioId}. ${errorMessage}`
    );
  }
}
