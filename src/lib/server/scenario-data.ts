// import { loadDataFile } from "@/lib/data-storage";
import { NarrativeMatrixData } from "@/types/data";
import { QuizItem } from "@/components/features/task/quiz-types";
import { promises as fs } from "fs";
import path from "path";
import {
  getScenarioMetadata,
  getStageDataSources,
  getAvailableScenarios as getAllScenarios,
} from "../scenarios/study-config";
import groupBy from "lodash/groupBy";
import flatMap from "lodash/flatMap";

// Import the new server-only file reader utility
import { readAndParseScenarioFiles } from "./file-operations";

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

// Helper function to fetch data from the API
async function fetchFromScenarioApi(
  scenarioId: string,
  isTraining: boolean
): Promise<NarrativeMatrixData> {
  // Determine if this is running on server or client
  const isServer = typeof window === "undefined";

  let url: string;
  if (isServer) {
    // In server environment, we need an absolute URL
    // For local development, use localhost
    // For production, use the appropriate host from environment variables
    const host =
      process.env.VERCEL_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:3000";
    // Ensure the host has a protocol
    const baseUrl = host.startsWith("http") ? host : `http://${host}`;
    url = `${baseUrl}/api/scenarios/${scenarioId}?isTraining=${isTraining}`;
  } else {
    // In browser, we can use relative URL
    url = `/api/scenarios/${scenarioId}?isTraining=${isTraining}`;
  }

  console.log(`Fetching scenario data from: ${url}`);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(`API error: ${errorData.error || response.statusText}`);
  }

  return await response.json();
}

/**
 * Load the scenario data for a specific flow stage
 * @param scenarioId The scenario ID
 * @param flowIndex The index of the stage in the study flow (if not provided, assumes current stage)
 * @returns The loaded and processed scenario data
 */
export async function loadAndProcessScenarioData(
  scenarioId: string,
  flowIndex?: number
): Promise<NarrativeMatrixData> {
  try {
    const stageIndex = flowIndex ?? 0; // Default to stage 0 if index not provided
    console.log(
      `[server/scenario-data] Loading data for scenario ${scenarioId} at flow index ${stageIndex}`
    );

    // Get scenario metadata
    const metadata = getScenarioMetadata(scenarioId);
    if (!metadata) {
      console.error(
        `[server/scenario-data] No metadata found for scenario ${scenarioId}`
      );
      throw new Error(`No metadata found for scenario ${scenarioId}`);
    }
    console.log(`[server/scenario-data] Metadata found: ${metadata.name}`);

    // Get stage type from the study flow
    const studyFlow = metadata.studyFlow || [];
    if (stageIndex < 0 || stageIndex >= studyFlow.length) {
      console.error(
        `[server/scenario-data] Invalid flow index: ${stageIndex} for scenario ${scenarioId}`
      );
      throw new Error(`Invalid flow index: ${stageIndex}`);
    }
    const stageType = studyFlow[stageIndex].type;
    const isTraining = stageType === "training";
    console.log(
      `[server/scenario-data] Stage type: ${stageType}, isTraining: ${isTraining}`
    );

    // Get appropriate relative data source paths from study config
    const stageDataSources = getStageDataSources(
      scenarioId,
      stageType,
      stageIndex
    );

    if (!stageDataSources?.eventsDataPath || !stageDataSources?.quizDataPath) {
      console.error(
        `[server/scenario-data] Missing data source paths for scenario ${scenarioId}, stageType ${stageType}, stageIndex ${stageIndex}`
      );
      throw new Error(
        `Missing data source paths for scenario ${scenarioId}, stage ${stageType}:${stageIndex}`
      );
    }

    const eventsRelativePath = stageDataSources.eventsDataPath;
    const quizRelativePath = stageDataSources.quizDataPath;
    console.log(
      `[server/scenario-data] Relative paths determined: events=${eventsRelativePath}, quiz=${quizRelativePath}`
    );

    // Use the server-only utility to read and parse the files
    const { eventsData, quizData } = await readAndParseScenarioFiles(
      eventsRelativePath,
      quizRelativePath
    );

    // Check quiz data structure
    if (!quizData?.quiz || !Array.isArray(quizData.quiz)) {
      console.error(
        "[server/scenario-data] Quiz data from file does not have expected structure:",
        quizData
      );
      throw new Error(
        "Loaded quiz data is missing the expected 'quiz' array structure."
      );
    }

    // Prepare the base response data
    let finalQuizItems = quizData.quiz;

    // Apply reordering only for non-training scenarios if preferred order is specified
    if (!isTraining && metadata?.quizOrder?.preferredOrder) {
      const preferredOrder = metadata.quizOrder.preferredOrder;
      console.log(
        `[server/scenario-data] Applying preferred order for ${scenarioId}:`,
        preferredOrder
      );

      const prefixToItemsMap = groupBy(
        quizData.quiz,
        (item: QuizItem) =>
          preferredOrder.find((prefix) => item.id.startsWith(prefix)) || "other"
      );

      const reorderedQuizItems = flatMap(
        preferredOrder,
        (prefix) => prefixToItemsMap[prefix] || []
      );

      if (reorderedQuizItems.length > 0) {
        finalQuizItems = reorderedQuizItems;
      } else {
        console.warn(
          `[server/scenario-data] Reordering resulted in empty quiz list for ${scenarioId}, using original order.`
        );
      }
    } else {
      console.log(
        `[server/scenario-data] Skipping quiz reordering for ${scenarioId} (training=${isTraining}, no preferred order=${!metadata
          ?.quizOrder?.preferredOrder})`
      );
    }

    // Construct the final data object, adding currentFlowIndex to metadata
    const processedData: NarrativeMatrixData = {
      metadata: {
        title: metadata.name,
        description: metadata.description,
        topic: metadata.topic || "",
        author: metadata.author || "unknown",
        publishDate: metadata.publishDate || "",
        studyType: scenarioId,
        currentFlowIndex: stageIndex, // Add the current flow index
      },
      events: eventsData.events,
      quiz: {
        ...quizData,
        quiz: finalQuizItems,
      },
    };

    return processedData;
  } catch (error) {
    console.error(
      `[server/scenario-data] Error in loadAndProcessScenarioData for ${scenarioId}:`,
      error
    );
    throw error;
  }
}
