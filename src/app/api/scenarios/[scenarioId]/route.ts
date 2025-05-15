import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { NarrativeMatrixData, DatasetMetadata } from "@/types/data";

// Import the study configuration
import studyConfig from "@/lib/scenarios/study_config.json";
import { getScenarioMetadata } from "@/lib/scenarios/study-config";

// Import the new server-only file reader utility
import { readAndParseScenarioFiles } from "@/lib/server/file-operations";

// Define types needed from study_config.json if not imported
interface StudyFlowStep {
  type: "intro" | "training" | "task" | "complete";
  title: string;
  dataSources?: {
    eventsDataPath?: string;
    quizDataPath?: string;
  };
}

/**
 * API Route Handler for fetching scenario data.
 * Uses study_config.json to determine file paths, then reads files using a server utility.
 * Supports fetching based on scenarioId and isTraining query parameter.
 * Note: Currently selects the *first* matching training/task step if multiple exist for a scenario.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { scenarioId: string } }
) {
  try {
    const { scenarioId } = params;

    // Extract training status from the request query parameters
    const { searchParams } = new URL(request.url);
    const isTraining = searchParams.get("isTraining") === "true";

    // Validate scenarioId format
    if (!scenarioId || typeof scenarioId !== "string") {
      return NextResponse.json(
        { error: "Invalid scenario ID" },
        { status: 400 }
      );
    }

    console.log(
      `[API Route] Request for scenario: ${scenarioId}, isTraining: ${isTraining}`
    );

    // --- Determine File Paths using study_config.json ---
    let eventsRelativePath: string | undefined;
    let quizRelativePath: string | undefined;

    // Use getScenarioMetadata which reads from study_config.json
    const scenarioConfig = getScenarioMetadata(scenarioId);

    if (scenarioConfig?.studyFlow) {
      console.log(`[API Route] Found scenario config for ${scenarioId}`);
      const studyFlow = scenarioConfig.studyFlow as StudyFlowStep[]; // Type assertion

      // Find the first relevant studyFlow step based on isTraining flag
      const relevantStep = studyFlow.find(
        (step) =>
          (isTraining && step.type === "training") ||
          (!isTraining && step.type === "task")
      );

      if (relevantStep?.dataSources) {
        eventsRelativePath = relevantStep.dataSources.eventsDataPath;
        quizRelativePath = relevantStep.dataSources.quizDataPath;
        console.log(
          `[API Route] Paths from study_config: events=${eventsRelativePath}, quiz=${quizRelativePath}`
        );
      } else {
        console.log(
          `[API Route] No matching ${
            isTraining ? "training" : "task"
          } step with dataSources found in studyFlow for ${scenarioId}.`
        );
      }
    } else {
      console.log(
        `[API Route] Scenario config or studyFlow not found for ${scenarioId}.`
      );
    }

    // --- Fallback Logic (Optional - if needed when config lookup fails) ---
    // If paths weren't found via config, you *could* implement the naming convention fallback here,
    // but currently, the design relies on study_config.json being accurate.
    // If fallback is desired, it would mirror the logic previously in this file.
    // For now, we proceed assuming config provided the paths.

    if (!eventsRelativePath || !quizRelativePath) {
      console.error(
        `[API Route] Could not determine file paths for scenario: ${scenarioId} (training: ${isTraining})`
      );
      return NextResponse.json(
        { error: "Scenario configuration or data paths not found" },
        { status: 404 } // Use 404 for configuration/path issues
      );
    }

    // --- Read Files using Server Utility ---
    const { eventsData, quizData } = await readAndParseScenarioFiles(
      eventsRelativePath,
      quizRelativePath
    );

    // --- Construct Response ---
    // Construct metadata, ensuring it fits the DatasetMetadata type
    let metadata: DatasetMetadata;
    const scenarioType =
      scenarioId.split("-").slice(0, -1).join("-") || scenarioId; // Fallback if no dashes

    if (scenarioConfig) {
      metadata = {
        title: scenarioConfig.name || `${scenarioId.toUpperCase()} Scenario`,
        description: scenarioConfig.description || `Data for ${scenarioId}`,
        topic: scenarioConfig.topic || scenarioType, // Ensure topic is a string
        author: scenarioConfig.author || "Unknown",
        publishDate: scenarioConfig.publishDate || new Date().toISOString(),
        studyType: scenarioType,
      };
    } else {
      // Basic fallback metadata
      metadata = {
        title: `${scenarioId.toUpperCase()}`,
        description: `${scenarioId} ${isTraining ? "(Training)" : ""}`,
        topic: scenarioType,
        author: "System",
        publishDate: new Date().toISOString(),
        studyType: scenarioType,
      };
    }

    // Construct the complete data object
    // Note: API route doesn't perform quiz reordering; that's handled by the loadAndProcess functions if needed.
    const responseData: NarrativeMatrixData = {
      metadata,
      events: eventsData.events, // Assuming events are under .events key
      quiz: quizData, // Return the raw quiz data object from the file
    };

    return NextResponse.json(responseData);
  } catch (error: unknown) {
    const scenarioIdForError = params.scenarioId || "unknown"; // Get scenarioId safely
    console.error(
      `[API Route] Error processing scenario ${scenarioIdForError}:`,
      error
    );

    let errorMessage =
      "Failed to load scenario data due to an internal server error.";
    let status = 500;

    if (error instanceof Error) {
      // Map specific errors from readAndParseScenarioFiles to HTTP status codes
      if (
        error.message.includes("cannot be accessed") ||
        error.message.includes("do not exist")
      ) {
        errorMessage = "Scenario data files not found or inaccessible";
        status = 404;
      } else if (error.message.includes("Failed to parse")) {
        errorMessage = "Error parsing scenario data files";
        status = 500;
      } else if (error.message.includes("Missing data source paths")) {
        errorMessage = "Server configuration error: missing data paths";
        status = 500;
      } else if (error.message.includes("Invalid scenario ID")) {
        errorMessage = "Invalid scenario ID provided";
        status = 400;
      }
    } else {
      // Handle non-Error objects if necessary
      errorMessage = String(error);
    }

    // Generic internal server error response
    return NextResponse.json({ error: errorMessage }, { status });
  }
}
