/**
 * Base types for scenario components
 */
export type StudyId = string;
export type SessionId = number;

/**
 * Unified scenario type definition for the application
 * Format: "{studyId}-{sessionId}" (e.g., "text-visual-1")
 */
export type ScenarioType = `${string}-${number}`;

/**
 * Parsed scenario components
 */
export interface ParsedScenario {
  studyId: StudyId;
  sessionId: SessionId;
}

/**
 * Utility function to parse a scenario ID into its components
 */
export function parseScenarioId(scenarioId: ScenarioType): ParsedScenario {
  const [studyId, sessionId] = scenarioId.split(/-(?=[^-]+$)/);
  return {
    studyId,
    sessionId: parseInt(sessionId, 10),
  };
}

/**
 * Utility function to create a scenario ID from components
 */
export function createScenarioId(
  studyId: StudyId,
  sessionId: SessionId
): ScenarioType {
  return `${studyId}-${sessionId}`;
}

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
