import { ScenarioMetadata } from "@/types/lite";

let cachedMetadata: Record<string, any> | null = null;

// Function to fetch metadata from JSON file
async function fetchMetadata(): Promise<Record<string, any>> {
  if (cachedMetadata !== null) return cachedMetadata;

  try {
    const response = await fetch("/scenario_data.json");
    if (!response.ok) throw new Error("Failed to fetch scenario metadata");
    const data = await response.json();
    cachedMetadata = data;
    return data;
  } catch (error) {
    console.error("Error loading scenario metadata:", error);
    return {};
  }
}

// Function to get metadata from the JSON file
export async function getScenarioMetadata(
  scenarioId: string
): Promise<ScenarioMetadata | null> {
  const metadata = await fetchMetadata();
  const [studyId, sessionId] = scenarioId.split("-");
  return metadata[studyId]?.sessions[sessionId] || null;
}

// Function to get quiz order for a specific scenario
export async function getQuizOrder(
  studyId: string,
  sessionId: string
): Promise<string[] | null> {
  const metadata = await fetchMetadata();
  return (
    metadata[studyId]?.sessions[sessionId]?.quizOrder?.preferredOrder || null
  );
}

// Function to get all available scenario IDs
export async function getAvailableScenarioIds(): Promise<string[]> {
  const metadata = await fetchMetadata();
  const scenarios: string[] = [];

  Object.entries(metadata).forEach(([studyId, studyData]) => {
    Object.keys(studyData.sessions).forEach((sessionId) => {
      scenarios.push(`${studyId}-${sessionId}`);
    });
  });

  return scenarios;
}

// Function to get all available scenarios with their metadata
export async function getAvailableScenarios(): Promise<ScenarioMetadata[]> {
  const metadata = await fetchMetadata();
  const scenarios: ScenarioMetadata[] = [];

  Object.entries(metadata).forEach(([studyId, studyData]) => {
    Object.entries(studyData.sessions).forEach(([sessionId, sessionData]) => {
      scenarios.push(sessionData as ScenarioMetadata);
    });
  });

  return scenarios;
}

// Synchronous version for initial render (uses cached data if available)
export function getAvailableScenariosSync(): ScenarioMetadata[] {
  if (cachedMetadata === null) {
    // If no cached data, trigger fetch but return empty array
    fetchMetadata();
    return [];
  }

  const scenarios: ScenarioMetadata[] = [];
  Object.entries(cachedMetadata).forEach(([studyId, studyData]) => {
    Object.entries(studyData.sessions).forEach(([sessionId, sessionData]) => {
      scenarios.push(sessionData as ScenarioMetadata);
    });
  });

  return scenarios;
}
