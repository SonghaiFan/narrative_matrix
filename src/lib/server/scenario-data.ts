// import { loadDataFile } from "@/lib/data-storage";
import { NarrativeMatrixData } from "@/types/lite";
import { QuizItem } from "@/components/features/task/quiz-types";
import { promises as fs } from "fs";
import path from "path";
import { getScenarioMetadata } from "../client/scenario-metadata";

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

// --- Data Processing ---
export async function loadAndProcessScenarioData(
  scenarioId: string,
  isTraining = false
): Promise<NarrativeMatrixData> {
  try {
    console.log(
      `Loading data for scenario ${scenarioId} (training: ${isTraining})`
    );

    // Load base data from public/data.json
    const baseDataPath = path.join(
      process.cwd(),
      "public",
      isTraining ? "train_data.json" : "data.json"
    );
    const baseData = JSON.parse(await fs.readFile(baseDataPath, "utf-8"));

    // Load quiz data from public/quiz_data.json
    const quizDataPath = path.join(
      process.cwd(),
      "public",
      isTraining ? "train_quiz_data.json" : "quiz_data.json"
    );
    const quizData = JSON.parse(await fs.readFile(quizDataPath, "utf-8"));

    console.log(
      `Quiz data loaded. Number of quiz items: ${quizData.quiz?.length || 0}`
    );

    // Get metadata for scenario
    console.log(`Getting metadata for scenario ${scenarioId}`);
    const metadata = getScenarioMetadata(scenarioId);
    console.log(
      `Found metadata:`,
      JSON.stringify({
        name: metadata?.name,
        hasPreferredOrder: !!metadata?.quizOrder?.preferredOrder,
      })
    );

    // Check if quiz data has the expected structure
    if (!quizData.quiz || !Array.isArray(quizData.quiz)) {
      console.error("Quiz data does not have expected structure:", quizData);
      throw new Error("Quiz data does not have expected structure");
    }

    // Log the IDs of the quiz items
    console.log(
      "Available quiz item IDs:",
      quizData.quiz.map((item: QuizItem) => item.id)
    );

    // SPECIAL CASE: For training mode, the IDs don't follow the expected pattern
    // We skip reordering for training mode - training items are already in the correct order
    if (isTraining) {
      console.log(
        "Training mode detected: skipping reordering based on preferred pattern"
      );

      // Create the processed data structure with original order
      const processedData: NarrativeMatrixData = {
        ...baseData,
        metadata: {
          ...baseData.metadata,
          ...metadata,
        },
        quiz: {
          ...quizData,
        },
      };

      return processedData;
    }

    // For regular (non-training) mode, reorder based on metadata pattern
    if (!metadata?.quizOrder?.preferredOrder) {
      console.error(`No quiz order found for scenario ${scenarioId}`);
      // Fall back to original order
      const processedData: NarrativeMatrixData = {
        ...baseData,
        metadata: {
          ...baseData.metadata,
          ...metadata,
        },
        quiz: {
          ...quizData,
        },
      };
      return processedData;
    }

    const preferredOrder = metadata.quizOrder.preferredOrder;
    console.log(`Preferred order for ${scenarioId}:`, preferredOrder);

    // Group quiz items by their prefix
    const prefixToItemsMap: Record<string, QuizItem[]> = {};

    // For each quiz item, find which prefix it matches
    quizData.quiz.forEach((item: QuizItem) => {
      if (!item.id) return;

      // Find the matching prefix from preferred order
      for (const prefix of preferredOrder) {
        if (item.id.startsWith(prefix)) {
          // Initialize array if needed
          if (!prefixToItemsMap[prefix]) {
            prefixToItemsMap[prefix] = [];
          }
          // Add the item to the array for this prefix
          prefixToItemsMap[prefix].push(item);
          break;
        }
      }
    });

    // Create the reordered list following the preferred order
    const reorderedQuizItems: QuizItem[] = [];

    // For each prefix in the preferred order
    for (const prefix of preferredOrder) {
      const itemsForPrefix = prefixToItemsMap[prefix] || [];
      if (itemsForPrefix.length > 0) {
        // Add all items with this prefix to the reordered list
        reorderedQuizItems.push(...itemsForPrefix);
        console.log(
          `Found ${itemsForPrefix.length} items for prefix ${prefix}:`,
          itemsForPrefix.map((item) => item.id)
        );
      } else {
        console.warn(`No items found for prefix ${prefix}`);
      }
    }

    // Log the reordering results
    console.log(
      `Reordered items (${reorderedQuizItems.length}/${quizData.quiz.length}):`,
      reorderedQuizItems.map((item) => item.id)
    );

    // If no items were reordered, keep the original order
    const finalQuizItems =
      reorderedQuizItems.length > 0 ? reorderedQuizItems : quizData.quiz;

    // Create the processed data structure
    const processedData: NarrativeMatrixData = {
      ...baseData,
      metadata: {
        ...baseData.metadata,
        ...metadata,
      },
      quiz: {
        ...quizData,
        quiz: finalQuizItems,
      },
    };

    return processedData;
  } catch (error) {
    console.error("Error loading scenario data:", error);
    throw error;
  }
}
