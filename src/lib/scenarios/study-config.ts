import studyConfig from "./study_config.json";
import { ScenarioMetadata, ScenarioType, StudyStage } from "@/types/scenario";

/**
 * Study configuration is now loaded from a JSON file (study_config.json)
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
 * Get the study flow for a specific scenario
 */
export function getScenarioStudyFlow(scenarioId: string): StudyStage[] {
  const scenario = getScenarioMetadata(scenarioId);
  return scenario?.studyFlow || [];
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

  let stageData = null;

  // If a specific stage index is provided (for cases with multiple stages of the same type)
  if (stageIndex !== undefined) {
    const stagesOfType = scenario.studyFlow.filter(
      (stage) => stage.type === stageType
    );
    stageData = stagesOfType[stageIndex] || null;
  } else {
    // Otherwise find the first stage of the requested type
    stageData =
      scenario.studyFlow.find((stage) => stage.type === stageType) || null;
  }

  // Return either the stage-specific data sources or the scenario default
  if (stageData?.dataSources) {
    return stageData.dataSources;
  }

  // Fallback to scenario defaults based on stage type
  switch (stageType) {
    case "training":
      return {
        eventsDataPath:
          scenario.dataSources.trainingEventsDataPath ||
          scenario.dataSources.eventsDataPath,
        quizDataPath:
          scenario.dataSources.trainingQuizDataPath ||
          scenario.dataSources.quizDataPath,
      };
    case "task":
      return {
        eventsDataPath: scenario.dataSources.eventsDataPath,
        quizDataPath: scenario.dataSources.quizDataPath,
      };
    default:
      return null;
  }
}

/**
 * Get scenario name from its ID
 */
export function getScenarioName(type: ScenarioType): string {
  const scenario = getAvailableScenarios().find((s) => s.id === type);
  return scenario?.name || `Scenario ${type.replace("text-visual-", "")}`;
}

/**
 * Get an array of scenarios with just their ID and name
 */
export function getScenariosWithNames() {
  return getAvailableScenarios().map((scenario) => ({
    id: scenario.id,
    name: scenario.name,
  }));
}
