import { NarrativeMatrixData } from "@/types/lite";
import { Quiz, QuizItem } from "@/components/features/task/quiz-types";

// --- Hardcoded Metadata Map ---
export const allScenarioMetadataMap: Record<string, any> = {
  "text-visual-1": {
    name: "Text with Visualizations 1",
    description:
      "A narrative experience that combines text content with interactive data visualizations to enhance understanding.",
    icon: "BarChart3",
    color: "#0891B2",
    order: 2,
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
    name: "Text with Visualizations 2",
    description:
      "A narrative experience that combines text content with interactive data visualizations to enhance understanding.",
    icon: "BarChart3",
    color: "#0891B2",
    order: 2,
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
    name: "Text with Visualizations 3",
    description:
      "A narrative experience that combines text content with interactive data visualizations to enhance understanding.",
    icon: "BarChart3",
    color: "#0891B2",
    order: 2,
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
    name: "Text with Visualizations 4",
    description:
      "A narrative experience that combines text content with interactive data visualizations to enhance understanding.",
    icon: "BarChart3",
    color: "#0891B2",
    order: 2,
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
    name: "Text with Visualizations 5",
    description:
      "A narrative experience that combines text content with interactive data visualizations to enhance understanding.",
    icon: "BarChart3",
    color: "#0891B2",
    order: 2,
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
    name: "Text with Visualizations 6",
    description:
      "A narrative experience that combines text content with interactive data visualizations to enhance understanding.",
    icon: "BarChart3",
    color: "#0891B2",
    order: 2,
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
    name: "Text with Visualizations 7",
    description:
      "A narrative experience that combines text content with interactive data visualizations to enhance understanding.",
    icon: "BarChart3",
    color: "#0891B2",
    order: 2,
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
    name: "Text with Visualizations 8",
    description:
      "A narrative experience that combines text content with interactive data visualizations to enhance understanding.",
    icon: "BarChart3",
    color: "#0891B2",
    order: 2,
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
    name: "Text with Visualizations 9",
    description:
      "A narrative experience that combines text content with interactive data visualizations to enhance understanding.",
    icon: "BarChart3",
    color: "#0891B2",
    order: 2,
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
    name: "Text with Visualizations 10",
    description:
      "A narrative experience that combines text content with interactive data visualizations to enhance understanding.",
    icon: "BarChart3",
    color: "#0891B2",
    order: 2,
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
    name: "Text with Visualizations 11",
    description:
      "A narrative experience that combines text content with interactive data visualizations to enhance understanding.",
    icon: "BarChart3",
    color: "#0891B2",
    order: 2,
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
    name: "Text with Visualizations 12",
    description:
      "A narrative experience that combines text content with interactive data visualizations to enhance understanding.",
    icon: "BarChart3",
    color: "#0891B2",
    order: 2,
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

// Function to get metadata from the hardcoded map
export function getScenarioMetadata(scenarioId: string): any {
  return allScenarioMetadataMap[scenarioId] || null;
}

// Function to get all available scenario IDs
export function getAvailableScenarioIds(): string[] {
  return Object.keys(allScenarioMetadataMap);
}

// Function to get all available scenarios with their metadata
export function getAvailableScenarios() {
  return Object.keys(allScenarioMetadataMap).map((id) => ({
    id,
    ...allScenarioMetadataMap[id],
  }));
}
