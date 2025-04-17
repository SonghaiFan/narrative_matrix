// import { loadDataFile } from "@/lib/data-storage";
import { NarrativeMatrixData } from "@/types/lite";
import { Quiz, QuizItem } from "@/components/features/task/quiz-types";
import { promises as fs } from "fs";
import path from "path";

// Helper function to read JSON files directly from the public directory
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

// --- Metadata Loading ---

// Function to load scenario metadata directly from its JSON file on the server
async function loadScenarioMetadata(scenarioId: string): Promise<any> {
  // Construct the path to the metadata file
  const filePath = path.join(
    process.cwd(),
    "src",
    "app",
    "(scenarios)",
    scenarioId,
    "metadata.json"
  );
  try {
    const fileContent = await fs.readFile(filePath, "utf8");
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error loading metadata for ${scenarioId}:`, error);
    // Fallback or throw error? For now, return null.
    // In a real app, you might want to load default metadata or throw a not found error.
    return null;
  }
}

// --- Data Processing (Server-Side Equivalent of processData) ---

// Server-side function to load and process scenario data including quiz ordering
async function loadAndProcessScenarioData(
  scenarioId: string,
  isTraining = false
): Promise<NarrativeMatrixData | null> {
  try {
    // 1. Load the base scenario data directly using fs
    const baseDataSource = isTraining ? "train_data.json" : "data.json";
    // Use the new helper function
    const rawData = await readPublicJsonFile<NarrativeMatrixData>(
      baseDataSource
    );

    // Ensure rawData and metadata exist
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

    // 2. Load the corresponding scenario metadata
    const scenarioMeta = await loadScenarioMetadata(scenarioId);

    // 3. Load the quiz data directly using fs
    const quizDataSource = isTraining
      ? "train_quiz_data.json"
      : "quiz_data.json";
    // Use the new helper function
    const quizData = await readPublicJsonFile<Quiz>(quizDataSource);
    const loadedQuizItems = quizData?.quiz || [];

    // 4. Filter and sort quiz items based on metadata (if available)
    let finalQuizItems = loadedQuizItems;
    if (
      scenarioMeta?.quizOrder?.preferredOrder &&
      Array.isArray(scenarioMeta.quizOrder.preferredOrder)
    ) {
      const preferredOrder = scenarioMeta.quizOrder.preferredOrder as string[];
      console.log(
        `[Server Scenario: ${scenarioId}] Using preferred order:`,
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

    // 5. Assign the processed quiz data to the narrative data
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

export { loadScenarioMetadata, loadAndProcessScenarioData };
