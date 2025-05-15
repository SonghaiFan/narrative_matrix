import studyConfig from "@/data/study_config.json";
import { ScenarioMetadata, ScenarioType, StudyStage } from "@/types/scenario";

/**
 * Study configuration is loaded from a JSON file (study_config.json)
 * This allows for easier editing and maintenance of scenario configurations
 * without needing to modify TypeScript code.
 */

/**
 * Make quizOrder optional in our local extended type
 */
export interface StudyScenario extends Omit<ScenarioMetadata, "quizOrder"> {
  quizOrder?: {
    preferredOrder: string[];
    description: string;
  };
  quizOrderDescription?: string;
  conditions?: string[];
}

/**
 * Type definition for the study configuration
 */
export interface StudyConfig {
  scenarios: Record<string, StudyScenario>;
}

/**
 * The loaded study configuration
 */
export const config: StudyConfig = studyConfig as StudyConfig;

/**
 * Get metadata for a specific scenario
 */
export function getScenarioMetadata(
  scenarioId: string
): ScenarioMetadata | null {
  const scenario = config.scenarios[scenarioId];
  if (!scenario) return null;

  // Create a ScenarioMetadata-compatible object
  return {
    ...scenario,
    // If quizOrder is missing, create a default one based on conditions
    quizOrder: scenario.quizOrder || {
      preferredOrder: scenario.conditions || [],
      description: scenario.quizOrderDescription || "Default order",
    },
  } as ScenarioMetadata;
}

/**
 * Get all available scenario IDs
 */
export function getAvailableScenarioIds(): string[] {
  return Object.keys(config.scenarios);
}

/**
 * Get all available scenarios with their metadata
 */
export function getAvailableScenarios(): ScenarioMetadata[] {
  return Object.keys(config.scenarios)
    .map((id) => getScenarioMetadata(id))
    .filter(Boolean) as ScenarioMetadata[];
}

/**
 * Get the data sources for a specific stage in a scenario
 */
export function getStageDataSources(
  scenarioId: string,
  stageType: string,
  stageIndex?: number
) {
  const scenario = getScenarioMetadata(scenarioId);
  if (!scenario) return null;

  // Two different behaviors:
  // 1. If stageIndex is provided, get the specific stage at that index
  // 2. If stageIndex is not provided but stageType is, find the first stage of that type

  let stageData = null;

  if (stageIndex !== undefined) {
    // CASE 1: Get exact stage at the flow index
    if (stageIndex >= 0 && stageIndex < scenario.studyFlow.length) {
      const stage = scenario.studyFlow[stageIndex];

      // Verify this stage matches the requested type
      if (stage.type === stageType) {
        stageData = stage;
      } else {
        console.error(
          `[study-config] Stage at index ${stageIndex} has type ${stage.type}, but requested type is ${stageType}`
        );
      }
    } else {
      console.error(
        `[study-config] Invalid stage index ${stageIndex} for scenario ${scenarioId} (studyFlow length: ${scenario.studyFlow.length})`
      );
    }
  } else {
    // CASE 2: Find first stage of requested type
    stageData =
      scenario.studyFlow.find((stage) => stage.type === stageType) || null;
  }

  // Return the stage data sources if present
  if (stageData?.dataSources) {
    console.log(
      `[study-config] Found dataSources for scenario ${scenarioId}, type ${stageType}, index ${stageIndex}:`,
      stageData.dataSources
    );
    return stageData.dataSources;
  }

  // No dataSources found
  console.warn(
    `[study-config] No dataSources found for scenario ${scenarioId}, type ${stageType}, index ${stageIndex}`
  );
  return null;
}
