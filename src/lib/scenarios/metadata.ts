import { ScenarioMetadata, ScenarioInfo, ScenarioType } from "@/types/scenario";

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
  // ... Add other scenarios as needed
};

export function getScenarioMetadata(
  scenarioId: string
): ScenarioMetadata | null {
  return allScenarioMetadataMap[scenarioId] || null;
}

export function getAvailableScenarioIds(): string[] {
  return Object.keys(allScenarioMetadataMap);
}

export function getAvailableScenarios(): ScenarioMetadata[] {
  return Object.values(allScenarioMetadataMap);
}

export function getAvailableScenariosWithInfo(): ScenarioInfo[] {
  return getAvailableScenarios().map((scenario) => ({
    id: scenario.id,
    metadata: scenario,
  }));
}

export function getScenarioName(type: ScenarioType): string {
  const scenario = getAvailableScenarios().find((s) => s.id === type);
  return scenario?.name || `Scenario ${type.replace("text-visual-", "")}`;
}

export function getScenariosWithNames() {
  return getAvailableScenarios().map((scenario) => ({
    id: scenario.id,
    name: scenario.name,
  }));
}
