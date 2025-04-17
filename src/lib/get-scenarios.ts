import { promises as fs } from "fs";
import path from "path";
import { ScenarioType, ScenarioMetadata, ScenarioInfo } from "@/types/scenario";

/**
 * Gets all available scenarios based on the directory structure
 * @returns Promise that resolves to an array of scenario information
 */
export async function getAvailableScenarios(): Promise<ScenarioInfo[]> {
  try {
    // Get the absolute path to the scenarios directory
    const scenariosPath = path.join(process.cwd(), "src/app/(scenarios)");

    // Read all directories in the scenarios path
    const directories = await fs.readdir(scenariosPath, {
      withFileTypes: true,
    });

    // Filter out only directories (not files)
    const scenarioDirs = directories
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    // Only include valid scenario types (matches those defined in ScenarioType)
    const validScenarios = scenarioDirs.filter((dir) => {
      return /^text-visual-\d+$/.test(dir);
    }) as ScenarioType[];

    // Read metadata for each scenario
    const scenariosWithMetadata = await Promise.all(
      validScenarios.map(async (scenarioId) => {
        try {
          // Try to read the metadata.json file for this scenario
          const metadataPath = path.join(
            scenariosPath,
            scenarioId,
            "metadata.json"
          );
          const metadataContent = await fs.readFile(metadataPath, "utf-8");
          const metadata = JSON.parse(metadataContent) as ScenarioMetadata;

          return {
            id: scenarioId,
            metadata,
          };
        } catch (error) {
          // If metadata file doesn't exist or has invalid format, use default metadata
          return {
            id: scenarioId,
            metadata: getDefaultMetadata(scenarioId),
          };
        }
      })
    );

    return scenariosWithMetadata;
  } catch (error) {
    console.error("Error reading scenario directories:", error);
    // Return default scenarios if there's an error
    return [
      { id: "text-visual-1", metadata: getDefaultMetadata("text-visual-1") },
      { id: "text-visual-2", metadata: getDefaultMetadata("text-visual-2") },
      { id: "text-visual-3", metadata: getDefaultMetadata("text-visual-3") },
    ];
  }
}

/**
 * Gets default metadata for a scenario type
 */
function getDefaultMetadata(type: ScenarioType): ScenarioMetadata {
  // Extract the number from the scenario ID
  const scenarioNum = type.replace("text-visual-", "");

  return {
    name: `Text with Visualizations ${scenarioNum}`,
    description:
      "A narrative experience that combines text content with interactive data visualizations to enhance understanding.",
    icon: "BarChart3",
    color: "#0891B2",
    order: parseInt(scenarioNum, 10),
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
      description: "Default quiz order",
    },
  };
}

/**
 * Maps a scenario type to a human-readable name
 */
export function getScenarioName(type: ScenarioType): string {
  const metadata = getDefaultMetadata(type);
  return metadata.name;
}

/**
 * Gets scenario with simplified format for backward compatibility
 */
export async function getScenariosWithNames() {
  const scenarios = await getAvailableScenarios();

  return scenarios.map((scenario) => ({
    id: scenario.id,
    name: scenario.metadata.name,
  }));
}
