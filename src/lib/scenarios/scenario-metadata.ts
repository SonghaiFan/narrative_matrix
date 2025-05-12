import { ScenarioMetadata, ScenarioInfo, ScenarioType } from "@/types/scenario";

/**
 * Central source of truth for all scenario metadata
 * This map contains all the scenarios available in the application
 */
export const allScenarioMetadataMap: Record<string, ScenarioMetadata> = {
  "text-visual-1": {
    id: "text-visual-1",
    name: "Text with Visualizations 1",
    description:
      "A narrative experience that combines text content with interactive data visualizations to enhance understanding.",
    quizOrder: {
      preferredOrder: [
        "ir_e_n_",
        "ir_e_v_",
        "ir_t_n_",
        "ir_t_v_",
        "ir_tm_n_",
        "ir_tm_v_",
        "pr_e_n_",
        "pr_e_v_",
        "pr_t_n_",
        "pr_t_v_",
        "pr_tm_n_",
        "pr_tm_v_",
      ],
      description:
        "Order: IR first, PR second. Category order: entity, topic, time. Visual order: non-visual then visual.",
    },
  },
  "text-visual-2": {
    id: "text-visual-2",
    name: "Text with Visualizations 2",
    description:
      "A narrative experience that combines text content with interactive data visualizations to enhance understanding.",
    quizOrder: {
      preferredOrder: [
        "ir_e_v_",
        "ir_e_n_",
        "ir_t_v_",
        "ir_t_n_",
        "ir_tm_v_",
        "ir_tm_n_",
        "pr_e_v_",
        "pr_e_n_",
        "pr_t_v_",
        "pr_t_n_",
        "pr_tm_v_",
        "pr_tm_n_",
      ],
      description:
        "Order: IR first, PR second. Category order: entity, topic, time. Visual order: visual then non-visual.",
    },
  },
  "text-visual-3": {
    id: "text-visual-3",
    name: "Text with Visualizations 3",
    description:
      "A narrative experience that combines text content with interactive data visualizations to enhance understanding.",
    quizOrder: {
      preferredOrder: [
        "ir_e_n_",
        "ir_e_v_",
        "ir_tm_n_",
        "ir_tm_v_",
        "ir_t_n_",
        "ir_t_v_",
        "pr_e_n_",
        "pr_e_v_",
        "pr_tm_n_",
        "pr_tm_v_",
        "pr_t_n_",
        "pr_t_v_",
      ],
      description:
        "Order: IR first, PR second. Category order: entity, time, topic. Visual order: non-visual then visual.",
    },
  },
  "text-visual-4": {
    id: "text-visual-4",
    name: "Text with Visualizations 4",
    description:
      "A narrative experience that combines text content with interactive data visualizations to enhance understanding.",
    quizOrder: {
      preferredOrder: [
        "ir_e_v_",
        "ir_e_n_",
        "ir_tm_v_",
        "ir_tm_n_",
        "ir_t_v_",
        "ir_t_n_",
        "pr_e_v_",
        "pr_e_n_",
        "pr_tm_v_",
        "pr_tm_n_",
        "pr_t_v_",
        "pr_t_n_",
      ],
      description:
        "Order: IR first, PR second. Category order: entity, time, topic. Visual order: visual then non-visual.",
    },
  },
  "text-visual-5": {
    id: "text-visual-5",
    name: "Text with Visualizations 5",
    description:
      "A narrative experience that combines text content with interactive data visualizations to enhance understanding.",
    quizOrder: {
      preferredOrder: [
        "ir_t_n_",
        "ir_t_v_",
        "ir_e_n_",
        "ir_e_v_",
        "ir_tm_n_",
        "ir_tm_v_",
        "pr_t_n_",
        "pr_t_v_",
        "pr_e_n_",
        "pr_e_v_",
        "pr_tm_n_",
        "pr_tm_v_",
      ],
      description:
        "Order: IR first, PR second. Category order: topic, entity, time. Visual order: non-visual then visual.",
    },
  },
  "text-visual-6": {
    id: "text-visual-6",
    name: "Text with Visualizations 6",
    description:
      "A narrative experience that combines text content with interactive data visualizations to enhance understanding.",
    quizOrder: {
      preferredOrder: [
        "ir_t_v_",
        "ir_t_n_",
        "ir_e_v_",
        "ir_e_n_",
        "ir_tm_v_",
        "ir_tm_n_",
        "pr_t_v_",
        "pr_t_n_",
        "pr_e_v_",
        "pr_e_n_",
        "pr_tm_v_",
        "pr_tm_n_",
      ],
      description:
        "Order: IR first, PR second. Category order: topic, entity, time. Visual order: visual then non-visual.",
    },
  },
  "text-visual-7": {
    id: "text-visual-7",
    name: "Text with Visualizations 7",
    description:
      "A narrative experience that combines text content with interactive data visualizations to enhance understanding.",
    quizOrder: {
      preferredOrder: [
        "ir_t_n_",
        "ir_t_v_",
        "ir_tm_n_",
        "ir_tm_v_",
        "ir_e_n_",
        "ir_e_v_",
        "pr_t_n_",
        "pr_t_v_",
        "pr_tm_n_",
        "pr_tm_v_",
        "pr_e_n_",
        "pr_e_v_",
      ],
      description:
        "Order: IR first, PR second. Category order: topic, time, entity. Visual order: non-visual then visual.",
    },
  },
  "text-visual-8": {
    id: "text-visual-8",
    name: "Text with Visualizations 8",
    description:
      "A narrative experience that combines text content with interactive data visualizations to enhance understanding.",
    quizOrder: {
      preferredOrder: [
        "ir_t_v_",
        "ir_t_n_",
        "ir_tm_v_",
        "ir_tm_n_",
        "ir_e_v_",
        "ir_e_n_",
        "pr_t_v_",
        "pr_t_n_",
        "pr_tm_v_",
        "pr_tm_n_",
        "pr_e_v_",
        "pr_e_n_",
      ],
      description:
        "Order: IR first, PR second. Category order: topic, time, entity. Visual order: visual then non-visual.",
    },
  },
  "text-visual-9": {
    id: "text-visual-9",
    name: "Text with Visualizations 9",
    description:
      "A narrative experience that combines text content with interactive data visualizations to enhance understanding.",
    quizOrder: {
      preferredOrder: [
        "ir_tm_n_",
        "ir_tm_v_",
        "ir_e_n_",
        "ir_e_v_",
        "ir_t_n_",
        "ir_t_v_",
        "pr_tm_n_",
        "pr_tm_v_",
        "pr_e_n_",
        "pr_e_v_",
        "pr_t_n_",
        "pr_t_v_",
      ],
      description:
        "Order: IR first, PR second. Category order: time, entity, topic. Visual order: non-visual then visual.",
    },
  },
  "text-visual-10": {
    id: "text-visual-10",
    name: "Text with Visualizations 10",
    description:
      "A narrative experience that combines text content with interactive data visualizations to enhance understanding.",
    quizOrder: {
      preferredOrder: [
        "ir_tm_v_",
        "ir_tm_n_",
        "ir_e_v_",
        "ir_e_n_",
        "ir_t_v_",
        "ir_t_n_",
        "pr_tm_v_",
        "pr_tm_n_",
        "pr_e_v_",
        "pr_e_n_",
        "pr_t_v_",
        "pr_t_n_",
      ],
      description:
        "Order: IR first, PR second. Category order: time, entity, topic. Visual order: visual then non-visual.",
    },
  },
  "text-visual-11": {
    id: "text-visual-11",
    name: "Text with Visualizations 11",
    description:
      "A narrative experience that combines text content with interactive data visualizations to enhance understanding.",
    quizOrder: {
      preferredOrder: [
        "ir_tm_n_",
        "ir_tm_v_",
        "ir_t_n_",
        "ir_t_v_",
        "ir_e_n_",
        "ir_e_v_",
        "pr_tm_n_",
        "pr_tm_v_",
        "pr_t_n_",
        "pr_t_v_",
        "pr_e_n_",
        "pr_e_v_",
      ],
      description:
        "Order: IR first, PR second. Category order: time, topic, entity. Visual order: non-visual then visual.",
    },
  },
  "text-visual-12": {
    id: "text-visual-12",
    name: "Text with Visualizations 12",
    description:
      "A narrative experience that combines text content with interactive data visualizations to enhance understanding.",
    quizOrder: {
      preferredOrder: [
        "ir_tm_v_",
        "ir_tm_n_",
        "ir_t_v_",
        "ir_t_n_",
        "ir_e_v_",
        "ir_e_n_",
        "pr_tm_v_",
        "pr_tm_n_",
        "pr_t_v_",
        "pr_t_n_",
        "pr_e_v_",
        "pr_e_n_",
      ],
      description:
        "Order: IR first, PR second. Category order: time, topic, entity. Visual order: visual then non-visual.",
    },
  },
};

/**
 * Get metadata for a specific scenario
 */
export function getScenarioMetadata(
  scenarioId: string
): ScenarioMetadata | null {
  return allScenarioMetadataMap[scenarioId] || null;
}

/**
 * Get all available scenario IDs
 */
export function getAvailableScenarioIds(): string[] {
  return Object.keys(allScenarioMetadataMap);
}

/**
 * Get all available scenarios with their metadata
 */
export function getAvailableScenarios(): ScenarioMetadata[] {
  return Object.values(allScenarioMetadataMap);
}

/**
 * Get all available scenarios with additional info structure
 */
export function getAvailableScenariosWithInfo(): ScenarioInfo[] {
  return getAvailableScenarios().map((scenario) => ({
    id: scenario.id,
    metadata: scenario,
  }));
}

/**
 * Get the name of a scenario from its type
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
