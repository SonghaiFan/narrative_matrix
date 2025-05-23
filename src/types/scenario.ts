/**
 * Unified scenario type definition for the application
 * This is used across different components to ensure consistency
 */
export type ScenarioType = string;

/**
 * Study flow configuration defining the sequence of stages for a scenario
 */
export interface StudyStage {
  type: "intro" | "training" | "task" | "complete";
  title?: string;
  description?: string;
  dataSources?: {
    eventsDataPath?: string;
    quizDataPath?: string;
  };
}

/**
 * Scenario metadata interface
 */
export interface ScenarioMetadata {
  id: ScenarioType;
  name: string;
  description: string;
  topic?: string;
  author?: string;
  publishDate?: string;
  quizOrder?: {
    preferredOrder: string[];
    description: string;
  };
  studyFlow: StudyStage[]; // Ordered array of study stages
}

/**
 * Complete scenario information with ID and metadata
 */
export interface ScenarioInfo {
  id: ScenarioType;
  metadata: ScenarioMetadata;
}
