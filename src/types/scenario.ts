/**
 * Unified scenario type definition for the application
 * This is used across different components to ensure consistency
 */
export type ScenarioType =
  | "text-visual-1"
  | "text-visual-2"
  | "text-visual-3"
  | "text-visual-4"
  | "text-visual-5"
  | "text-visual-6"
  | "text-visual-7"
  | "text-visual-8"
  | "text-visual-9"
  | "text-visual-10"
  | "text-visual-11"
  | "text-visual-12";

/**
 * Scenario metadata interface
 */
export interface ScenarioMetadata {
  name: string;
  description: string;
  order: number;
  quizOrder?: {
    preferredOrder: string[];
    description?: string;
  };
}

/**
 * Complete scenario information with ID and metadata
 */
export interface ScenarioInfo {
  id: ScenarioType;
  metadata: ScenarioMetadata;
}
