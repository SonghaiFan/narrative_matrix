import { ScenarioMetadata, StudyStage } from "@/types/scenario";

/**
 * Default study flow with standard progression
 */
export const DEFAULT_STUDY_FLOW: StudyStage[] = [
  {
    type: "intro",
    title: "Introduction",
    description: "Introduction to the study",
  },
  {
    type: "training",
    title: "Training",
    description: "Practice with sample tasks",
    dataSources: {
      eventsDataPath: "scenarios/default/training_events.json",
      quizDataPath: "scenarios/default/training_quiz.json",
    },
  },
  {
    type: "task",
    title: "Main Tasks",
    description: "Complete the main study tasks",
    dataSources: {
      eventsDataPath: "scenarios/default/events.json",
      quizDataPath: "scenarios/default/quiz.json",
    },
  },
  {
    type: "complete",
    title: "Completion",
    description: "Study completed",
  },
];

/**
 * Helper function to create a new scenario metadata configuration
 * @param id Scenario ID
 * @param name Scenario display name
 * @param description Scenario description
 * @param preferredOrder Preferred quiz order
 * @param options Additional options (topic, author, etc.)
 * @returns Complete scenario metadata configuration
 */
export function createScenario(
  id: string,
  name: string,
  description: string,
  preferredOrder: string[],
  options: {
    topic?: string;
    author?: string;
    publishDate?: string;
    quizOrderDescription?: string;
    studyFlow?: StudyStage[];
  } = {}
): ScenarioMetadata {
  return {
    id,
    name,
    description,
    topic: options.topic || "General Topic",
    author: options.author || "Research Team",
    publishDate: options.publishDate || new Date().toISOString().split("T")[0],
    quizOrder: {
      preferredOrder,
      description:
        options.quizOrderDescription || "Default quiz order preference",
    },
    studyFlow: options.studyFlow || DEFAULT_STUDY_FLOW,
  };
}

/**
 * Creates a custom study flow with multiple training and task phases
 * @param stages Array of study stage configurations
 * @returns Configured study flow
 */
export function createCustomStudyFlow(
  stages: Array<{
    type: "intro" | "training" | "task" | "complete";
    title?: string;
    description?: string;
    dataSources?: {
      eventsDataPath?: string;
      quizDataPath?: string;
    };
  }>
): StudyStage[] {
  return stages.map((stage) => ({
    type: stage.type,
    title:
      stage.title ||
      `${stage.type.charAt(0).toUpperCase() + stage.type.slice(1)} Phase`,
    description:
      stage.description ||
      `${
        stage.type.charAt(0).toUpperCase() + stage.type.slice(1)
      } phase of the study`,
    dataSources: stage.dataSources,
  }));
}

/**
 * Example usage:
 *
 * Import this function to create a new scenario:
 *
 * ```
 * import { createScenario, createCustomStudyFlow } from '@/lib/scenarios/create-scenario'
 *
 * // Create a scenario with two training and task phases
 * const customFlow = createCustomStudyFlow([
 *   { type: 'intro', title: 'Welcome' },
 *   { type: 'training', title: 'First Training', dataSources: { eventsDataPath: 'training1_events.json', quizDataPath: 'training1_quiz.json' } },
 *   { type: 'task', title: 'First Tasks', dataSources: { eventsDataPath: 'task1_events.json', quizDataPath: 'task1_quiz.json' } },
 *   { type: 'training', title: 'Second Training', dataSources: { eventsDataPath: 'training2_events.json', quizDataPath: 'training2_quiz.json' } },
 *   { type: 'task', title: 'Second Tasks', dataSources: { eventsDataPath: 'task2_events.json', quizDataPath: 'task2_quiz.json' } },
 *   { type: 'complete', title: 'Thank You' }
 * ]);
 *
 * const newScenario = createScenario(
 *   'text-visual-4',
 *   'Text with Visualizations 4',
 *   'A narrative experience with visualizations',
 *   ['ir_e_n_', 'ir_e_v_'],
 *   {
 *     topic: 'Middle East Conflict',
 *     studyFlow: customFlow
 *   }
 * )
 * ```
 */
