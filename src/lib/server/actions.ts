"use server";

import { NarrativeMatrixData } from "@/types/lite";
import { loadAndProcessScenarioData } from "./scenario-data";

/**
 * Server action to load scenario data
 */
export async function loadScenarioData(
  scenarioId: string,
  flowIndex?: number
): Promise<NarrativeMatrixData> {
  try {
    const data = await loadAndProcessScenarioData(scenarioId, flowIndex);
    return data;
  } catch (error) {
    console.error("Error in loadScenarioData server action:", error);
    throw error;
  }
}
