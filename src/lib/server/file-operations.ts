import "server-only";
import fs from "fs/promises";
import path from "path";

interface ScenarioFileBundle {
  eventsData: any; // Consider defining a more specific type for events structure
  quizData: any; // Consider defining a more specific type for quiz structure
}

/**
 * Utility function to read and parse scenario files on the server
 * @param eventsRelativePath Relative path to the events JSON file
 * @param quizRelativePath Relative path to the quiz JSON file
 * @returns Parsed events and quiz data
 */
export async function readAndParseScenarioFiles(
  eventsRelativePath: string,
  quizRelativePath: string
): Promise<ScenarioFileBundle> {
  try {
    console.log(`[file-operations] Reading scenario files:
      - Events: ${eventsRelativePath}
      - Quiz: ${quizRelativePath}
    `);

    // Resolve paths relative to project root
    const projectRoot = process.cwd();
    const dataDir = path.join(projectRoot, "src", "data");

    // Full absolute paths for debugging
    const eventsAbsolutePath = path.join(dataDir, eventsRelativePath);
    const quizAbsolutePath = path.join(dataDir, quizRelativePath);

    console.log(`[file-operations] Absolute paths:
      - Project root: ${projectRoot}
      - Data directory: ${dataDir}
      - Events file: ${eventsAbsolutePath}
      - Quiz file: ${quizAbsolutePath}
    `);

    // Check if files exist before trying to read them
    await Promise.all([
      fs.access(eventsAbsolutePath).catch(() => {
        throw new Error(`Events file not found at: ${eventsAbsolutePath}`);
      }),
      fs.access(quizAbsolutePath).catch(() => {
        throw new Error(`Quiz file not found at: ${quizAbsolutePath}`);
      }),
    ]);

    // Read files in parallel
    const [eventsRaw, quizRaw] = await Promise.all([
      fs.readFile(eventsAbsolutePath, "utf-8"),
      fs.readFile(quizAbsolutePath, "utf-8"),
    ]);

    // Parse JSON data
    let eventsData;
    let quizData;

    try {
      eventsData = JSON.parse(eventsRaw);
      console.log(
        `[file-operations] Successfully parsed events data from: ${eventsRelativePath}`
      );
    } catch (error) {
      console.error(
        `[file-operations] Failed to parse events JSON from: ${eventsRelativePath}`,
        error
      );
      throw new Error(
        `Failed to parse events data: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    try {
      quizData = JSON.parse(quizRaw);
      console.log(
        `[file-operations] Successfully parsed quiz data from: ${quizRelativePath}`
      );
    } catch (error) {
      console.error(
        `[file-operations] Failed to parse quiz JSON from: ${quizRelativePath}`,
        error
      );
      throw new Error(
        `Failed to parse quiz data: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    return { eventsData, quizData };
  } catch (error) {
    console.error(
      `[file-operations] Error in readAndParseScenarioFiles:`,
      error
    );
    throw error;
  }
}
