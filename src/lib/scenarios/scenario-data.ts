// import { loadDataFile } from "@/lib/data-storage";
import { NarrativeMatrixData } from "@/types/lite";
import { QuizItem } from "@/components/features/task/quiz-types";
import { promises as fs } from "fs";
import path from "path";
import {
  getScenarioMetadata,
  getStageDataSources,
  getAvailableScenarios as getAllScenarios,
} from "./study-config";
import groupBy from "lodash/groupBy";
import flatMap from "lodash/flatMap";

// Server-specific function for scenarios, augments with server-only fields
export function getAvailableScenarios() {
  return getAllScenarios().map((metadata) => {
    return {
      id: metadata.id,
      name: metadata.name,
      description: metadata.description,
      quizOrder: metadata.quizOrder,
    };
  });
}

// --- Data Processing ---
export async function loadAndProcessScenarioData(
  scenarioId: string,
  isTraining = false,
  stageIndex?: number
): Promise<NarrativeMatrixData> {
  try {
    console.log(`Loading scenario data for: ${scenarioId}`);
    console.log(`Training mode: ${isTraining}`);
    console.log(`Stage index: ${stageIndex}`);

    // Get metadata and data sources
    const metadata = getScenarioMetadata(scenarioId);
    if (!metadata) {
      console.error(`No metadata found for scenario ${scenarioId}`);
      throw new Error(`Scenario not found: ${scenarioId}`);
    }

    // Get appropriate data sources based on stage
    let eventsDataPath;
    let quizDataPath;

    if (stageIndex !== undefined) {
      // Get data sources for a specific stage by index
      console.log(`Loading data for specific stage index: ${stageIndex}`);
      const stageType = isTraining ? "training" : "task";

      // Find all stages of this type
      const stageDataSources = getStageDataSources(
        scenarioId,
        stageType,
        stageIndex
      );

      if (!stageDataSources) {
        console.error(
          `No data sources found for ${stageType} stage at index ${stageIndex}`
        );
        throw new Error(`No data sources for stage ${stageType}:${stageIndex}`);
      }

      eventsDataPath = stageDataSources.eventsDataPath;
      quizDataPath = stageDataSources.quizDataPath;
    } else {
      // Use default data sources based on training/task mode
      const stageType = isTraining ? "training" : "task";
      const stageDataSources = getStageDataSources(scenarioId, stageType);

      if (!stageDataSources) {
        console.error(`No data sources found for ${stageType} stage`);
        throw new Error(`No data sources for stage ${stageType}`);
      }

      eventsDataPath = stageDataSources.eventsDataPath;
      quizDataPath = stageDataSources.quizDataPath;
    }

    // Verify paths are available
    if (!eventsDataPath || !quizDataPath) {
      console.error("Missing data source paths:", {
        eventsDataPath,
        quizDataPath,
      });
      throw new Error("Missing data source paths");
    }

    console.log(`Loading events data from: ${eventsDataPath}`);
    console.log(`Loading quiz data from: ${quizDataPath}`);

    // Load data files
    const baseDataPath = path.join(process.cwd(), "public", eventsDataPath);
    const baseData = JSON.parse(await fs.readFile(baseDataPath, "utf-8"));

    const quizDataFullPath = path.join(process.cwd(), "public", quizDataPath);
    const quizData = JSON.parse(await fs.readFile(quizDataFullPath, "utf-8"));

    console.log(
      `Quiz data loaded. Number of quiz items: ${quizData.quiz?.length || 0}`
    );

    if (!quizData.quiz || !Array.isArray(quizData.quiz)) {
      console.error("Quiz data does not have expected structure:", quizData);
      throw new Error("Quiz data does not have expected structure");
    }

    console.log(
      "Available quiz item IDs:",
      quizData.quiz.map((item: QuizItem) => item.id)
    );

    // For training scenarios, simply return the data without reordering
    if (isTraining) {
      console.log(
        "Training mode detected: skipping reordering based on preferred pattern"
      );
      const processedData: NarrativeMatrixData = {
        events: baseData.events,
        metadata: {
          title: metadata.name,
          description: metadata.description,
          topic: metadata.topic || "",
          author: metadata.author || "unknown",
          publishDate: metadata.publishDate || "",
          studyType: scenarioId, // Add the scenario ID as the study type
        },
        quiz: {
          ...quizData,
        },
      };
      return processedData;
    }

    // For non-training scenarios, apply quiz item reordering if specified
    if (!metadata?.quizOrder?.preferredOrder) {
      console.error(`No quiz order found for scenario ${scenarioId}`);
      const processedData: NarrativeMatrixData = {
        events: baseData.events,
        metadata: {
          title: metadata.name,
          description: metadata.description,
          topic: metadata.topic || "",
          author: metadata.author || "unknown",
          publishDate: metadata.publishDate || "",
          studyType: scenarioId, // Add the scenario ID as the study type
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
      events: baseData.events,
      metadata: {
        title: metadata.name,
        description: metadata.description,
        topic: metadata.topic || "",
        author: metadata.author || "unknown",
        publishDate: metadata.publishDate || "",
        studyType: scenarioId, // Add the scenario ID as the study type
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
