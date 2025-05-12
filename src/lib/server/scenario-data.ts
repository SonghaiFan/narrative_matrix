// import { loadDataFile } from "@/lib/data-storage";
import { NarrativeMatrixData } from "@/types/lite";
import { QuizItem } from "@/components/features/task/quiz-types";
import { promises as fs } from "fs";
import path from "path";
import {
  allScenarioMetadataMap,
  getScenarioMetadata,
} from "../scenarios/scenario-metadata";
import groupBy from "lodash/groupBy";
import flatMap from "lodash/flatMap";

// Server-specific function for scenarios, augments with server-only fields
export function getAvailableScenarios() {
  return Object.keys(allScenarioMetadataMap).map((id) => {
    const metadata = allScenarioMetadataMap[id];
    return {
      id,
      name: metadata.name,
      description: metadata.description,
      quizOrder: metadata.quizOrder,
    };
  });
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

    const baseDataPath = path.join(
      process.cwd(),
      "public",
      isTraining ? "train_data.json" : "data.json"
    );
    const baseData = JSON.parse(await fs.readFile(baseDataPath, "utf-8"));

    const quizDataPath = path.join(
      process.cwd(),
      "public",
      isTraining ? "train_quiz_data.json" : "quiz_data.json"
    );
    const quizData = JSON.parse(await fs.readFile(quizDataPath, "utf-8"));

    console.log(
      `Quiz data loaded. Number of quiz items: ${quizData.quiz?.length || 0}`
    );

    console.log(`Getting metadata for scenario ${scenarioId}`);
    const metadata = getScenarioMetadata(scenarioId);
    console.log(
      `Found metadata:`,
      JSON.stringify({
        name: metadata?.name,
        hasPreferredOrder: !!metadata?.quizOrder?.preferredOrder,
      })
    );

    if (!quizData.quiz || !Array.isArray(quizData.quiz)) {
      console.error("Quiz data does not have expected structure:", quizData);
      throw new Error("Quiz data does not have expected structure");
    }

    console.log(
      "Available quiz item IDs:",
      quizData.quiz.map((item: QuizItem) => item.id)
    );

    if (isTraining) {
      console.log(
        "Training mode detected: skipping reordering based on preferred pattern"
      );
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

    if (!metadata?.quizOrder?.preferredOrder) {
      console.error(`No quiz order found for scenario ${scenarioId}`);
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

    // Lodash-based grouping and flattening
    const prefixToItemsMap = groupBy(
      quizData.quiz,
      (item) =>
        preferredOrder.find((prefix) => item.id.startsWith(prefix)) || "other"
    );
    const reorderedQuizItems = flatMap(
      preferredOrder,
      (prefix) => prefixToItemsMap[prefix] || []
    );

    const finalQuizItems =
      reorderedQuizItems.length > 0 ? reorderedQuizItems : quizData.quiz;

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
