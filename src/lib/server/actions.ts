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
      `[server/actions] Error in loadScenarioData server action: ${
        error instanceof Error ? error.message : error
      }`
    );
    throw error;
  }
}
