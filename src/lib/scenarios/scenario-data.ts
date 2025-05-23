// import { loadDataFile } from "@/lib/data-storage";
import { NarrativeMatrixData } from "@/types/data";
import { QuizItem } from "@/components/features/task/quiz-types";
import {
  getScenarioMetadata,
  getStageDataSources,
  getAvailableScenarios as getAllScenarios,
} from "./study-config";

// Import the new server-only file reader utility
import { readAndParseScenarioFiles } from "../server/file-operations";

// Server-specific function for scenarios, augments with server-only fields
export function getAvailableScenarios() {
  return getAllScenarios().map((metadata) => {
    return {
      id: metadata.id,
      name: metadata.name,
      description: metadata.description,
    };
  });
}

// --- Data Processing ---
/**
 * @deprecated This function is kept for backward compatibility.
 * Use src/lib/server/scenario-data.ts version which handles flow stages properly.
 */
export async function loadAndProcessScenarioData(
  scenarioId: string,
  isTraining = false,
  stageIndex?: number
): Promise<NarrativeMatrixData> {
  console.warn(
    "[DEPRECATED] loadAndProcessScenarioData in scenarios/scenario-data.ts is deprecated. Use the version from src/lib/server/scenario-data.ts instead."
  );

  try {
    console.log(
      `[scenario-data] Loading scenario data for: ${scenarioId}, training: ${isTraining}, stage: ${stageIndex}`
    );

    // Get metadata
    const metadata = getScenarioMetadata(scenarioId);
    if (!metadata) {
      console.error(
        `[scenario-data] No metadata found for scenario ${scenarioId}`
      );
      throw new Error(`Scenario not found: ${scenarioId}`);
    }

    // Determine which stage type to load
    const stageType = isTraining ? "training" : "task";

    // Get appropriate relative data source paths from study config
    const stageDataSources = getStageDataSources(
      scenarioId,
      stageType,
      stageIndex // Pass stageIndex if provided
    );

    if (!stageDataSources?.eventsDataPath || !stageDataSources?.quizDataPath) {
      console.error(
        `[scenario-data] Missing data source paths for scenario ${scenarioId}, stageType ${stageType}, stageIndex ${stageIndex}`
      );
      throw new Error(
        `Missing data source paths for scenario ${scenarioId}, stage ${stageType}${
          stageIndex !== undefined ? ":" + stageIndex : ""
        }`
      );
    }

    const eventsRelativePath = stageDataSources.eventsDataPath;
    const quizRelativePath = stageDataSources.quizDataPath;
    console.log(
      `[scenario-data] Relative paths determined: events=${eventsRelativePath}, quiz=${quizRelativePath}`
    );

    // Use the server-only utility to read and parse the files
    const { eventsData, quizData } = await readAndParseScenarioFiles(
      eventsRelativePath,
      quizRelativePath
    );

    // Check if quiz data structure is valid before proceeding
    if (!quizData?.quiz || !Array.isArray(quizData.quiz)) {
      console.error(
        "[scenario-data] Quiz data from file does not have expected structure:",
        quizData
      );
      // Depending on requirements, either throw or return potentially partial data
      // Let's throw for now to indicate a data integrity issue
      throw new Error(
        "Loaded quiz data is missing the expected 'quiz' array structure."
      );
    }

    // Use the original quiz items as they are in the data
    const finalQuizItems = quizData.quiz;

    console.log(`[scenario-data] Using original quiz order for ${scenarioId}`);

    // Construct the final data object
    const processedData: NarrativeMatrixData = {
      // Combine metadata from study config with file data
      metadata: {
        title: metadata.name,
        description: metadata.description,
        topic: metadata.topic || "",
        author: metadata.author || "unknown",
        publishDate: metadata.publishDate || "",
        studyType: scenarioId, // Use scenario ID as study type for now
      },
      events: eventsData.events, // Assuming events data is structured under an 'events' key
      quiz: {
        ...quizData, // Keep other potential properties from quiz file (e.g., quiz_recall)
        quiz: finalQuizItems, // Use the original list
      },
    };

    return processedData;
  } catch (error) {
    console.error(
      `[scenario-data] Error in loadAndProcessScenarioData for ${scenarioId}:`,
      error
    );
    // Re-throw the error to be handled by the caller
    throw error;
  }
}

/**
 * @deprecated This function is kept for backward compatibility.
 * Use src/lib/server/scenario-data.ts version which handles flow stages properly.
 */
export async function legacyLoadAndProcessScenarioData(
  scenarioId: string,
  isTraining = false,
  stageIndex?: number
): Promise<NarrativeMatrixData> {
  console.warn(
    "[DEPRECATED] legacyLoadAndProcessScenarioData is deprecated. Use the version from src/lib/server/scenario-data.ts instead."
  );

  try {
    console.log(
      `[scenario-data] Loading scenario data for: ${scenarioId}, training: ${isTraining}, stage: ${stageIndex}`
    );

    // Just call the main function since the implementation would be the same
    return loadAndProcessScenarioData(scenarioId, isTraining, stageIndex);
  } catch (error) {
    console.error(
      `[scenario-data] Error in legacyLoadAndProcessScenarioData for ${scenarioId}:`,
      error
    );
    // Re-throw the error to be handled by the caller
    throw error;
  }
}
