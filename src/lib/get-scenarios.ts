// import { promises as fs } from "fs";
// import path from "path";
import { ScenarioType, ScenarioMetadata, ScenarioInfo } from "@/types/scenario";
// Import the hardcoded metadata map
import { allScenarioMetadataMap } from "@/lib/server/scenario-data";

/**
 * Gets all available scenarios based on the hardcoded metadata map
 * @returns Promise that resolves to an array of scenario information
 */
export async function getAvailableScenarios(): Promise<ScenarioInfo[]> {
  try {
    // Transform the hardcoded map into the ScenarioInfo array format
    const scenarios: ScenarioInfo[] = Object.entries(allScenarioMetadataMap)
      .map(([id, metadata]) => {
        // Validate the entry
        if (
          !id ||
          !metadata ||
          typeof metadata !== "object" ||
          !metadata.name
        ) {
          console.warn(
            `Invalid or incomplete metadata entry found for ID: ${id}. Skipping.`
          );
          return null; // Return null for invalid entries
        }
        // Cast to ensure types are correct for valid entries
        return {
          id: id as ScenarioType,
          metadata: metadata as ScenarioMetadata,
        };
      })
      .filter((scenario): scenario is ScenarioInfo => scenario !== null); // Filter out the null entries

    // Optional: Sort scenarios based on the 'order' property in metadata if needed
    scenarios.sort(
      (a, b) => (a.metadata.order || 99) - (b.metadata.order || 99)
    );

    return scenarios;
  } catch (error) {
    console.error("Error processing scenario metadata map:", error);
    return [];
  }
}

/**
 * Maps a scenario type to a human-readable name
 */
export function getScenarioName(type: ScenarioType): string {
  // Get metadata from the hardcoded map
  const metadata = allScenarioMetadataMap[type];
  return metadata?.name || `Scenario ${type.replace("text-visual-", "")}`;
}

/**
 * Gets scenario with simplified format for backward compatibility
 */
export async function getScenariosWithNames() {
  const scenarios = await getAvailableScenarios();

  return scenarios.map((scenario) => ({
    id: scenario.id,
    name: scenario.metadata.name,
  }));
}
