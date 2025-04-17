// import { loadDataFile } from "@/lib/data-storage";
import { NarrativeMatrixData } from "@/types/lite";
import { Quiz, QuizItem } from "@/components/features/task/quiz-types";
import { promises as fs } from "fs";
import path from "path";

// --- Hardcoded Metadata Map ---
// Export the map so it can be imported elsewhere
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
function getScenarioMetadataFromServer(scenarioId: string): any {
  console.log(`[Server] Getting metadata for ${scenarioId} from map.`);
  return allScenarioMetadataMap[scenarioId] || null;
}

// --- File Reading Helper (for data/quiz files) ---
async function readPublicJsonFile<T>(fileName: string): Promise<T> {
  const filePath = path.join(process.cwd(), "public", fileName);
  try {
    const fileContent = await fs.readFile(filePath, "utf8");
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(
      `[Server] Failed to read public JSON file ${filePath}:`,
      error
    );
    throw new Error(
      `Failed to load data file ${fileName} from public dir on server`
    );
  }
}

// --- Data Processing (Updated to use hardcoded metadata) ---
async function loadAndProcessScenarioData(
  scenarioId: string,
  isTraining = false
): Promise<NarrativeMatrixData | null> {
  try {
    // 1. Load base data (unchanged)
    const baseDataSource = isTraining ? "train_data.json" : "data.json";
    const rawData = await readPublicJsonFile<NarrativeMatrixData>(
      baseDataSource
    );
    if (!rawData) {
      console.error(`Failed to load base data from ${baseDataSource}`);
      return null;
    }
    if (!rawData.metadata) {
      rawData.metadata = {
        title: "",
        description: "",
        topic: "",
        author: "",
        publishDate: new Date().toISOString(),
        quiz: [],
      };
    }

    // 2. Get scenario metadata from the hardcoded map
    const scenarioMeta = getScenarioMetadataFromServer(scenarioId);

    // 3. Load quiz data (unchanged)
    const quizDataSource = isTraining
      ? "train_quiz_data.json"
      : "quiz_data.json";
    const quizData = await readPublicJsonFile<Quiz>(quizDataSource);
    const loadedQuizItems = quizData?.quiz || [];

    // 4. Filter and sort quiz items (using scenarioMeta from map)
    let finalQuizItems = loadedQuizItems;
    if (
      scenarioMeta?.quizOrder?.preferredOrder &&
      Array.isArray(scenarioMeta.quizOrder.preferredOrder)
    ) {
      const preferredOrder = scenarioMeta.quizOrder.preferredOrder as string[];
      console.log(
        `[Server Scenario: ${scenarioId}] Using preferred order from map:`,
        preferredOrder
      );
      finalQuizItems.sort((a, b) => {
        const findPosition = (q: QuizItem) => {
          const pattern = q.id || (q as any).pattern || "";
          const index = preferredOrder.findIndex(
            (p) =>
              pattern.toString().startsWith(p) || pattern.toString().includes(p)
          );
          return index === -1 ? Number.MAX_SAFE_INTEGER : index;
        };
        return findPosition(a) - findPosition(b);
      });
    }

    // 5. Assign processed quiz data (unchanged)
    rawData.metadata.quiz = finalQuizItems;

    return rawData;
  } catch (error) {
    console.error(
      `Error loading or processing data for scenario ${scenarioId}:`,
      error
    );
    return null;
  }
}

// Export the new metadata getter and the processor
export { getScenarioMetadataFromServer, loadAndProcessScenarioData };
