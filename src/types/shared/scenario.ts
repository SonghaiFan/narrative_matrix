/**
 * Unified scenario type definition for the application
 * This is used across different components to ensure consistency
 */
export type ScenarioType =
  | "pure-text" // Text-only view
  | "text-visual" // Text with visualizations
  | "text-chat" // Text with AI chat
  | "mixed"; // Mixed view with visualizations and AI chat
