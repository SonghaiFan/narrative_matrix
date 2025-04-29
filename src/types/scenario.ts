/**
 * Unified scenario type definition for the application
 * This is used across different components to ensure consistency
 */
export type ScenarioType = string;

/**
 * Scenario metadata interface
 */
export interface ScenarioMetadata {
  id: ScenarioType;
  name: string;
  description: string;
  quizOrder: {
    preferredOrder: string[];
    description: string;
  };
}

/**
 * Complete scenario information with ID and metadata
 */
export interface ScenarioInfo {
  id: ScenarioType;
  metadata: ScenarioMetadata;
}
