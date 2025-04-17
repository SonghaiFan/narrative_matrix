import { VisualizationScenario } from "@/components/features/visualization/visualization-scenario";
import { loadAndProcessScenarioData } from "@/lib/server/scenario-data";
import { ScenarioType } from "@/types/scenario";
import { NarrativeMatrixData } from "@/types/lite";

interface VisualizationTrainingPageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function VisualizationTrainingPage({
  params: paramsPromise,
}: VisualizationTrainingPageProps) {
  // Await the params to get the id
  const params = await paramsPromise;

  const scenarioId = `text-visual-${params.id}` as ScenarioType;
  const isTraining = true;
  let isLoading = true;
  let error: string | null = null;
  let fetchedData: NarrativeMatrixData | null = null;

  try {
    // Fetch data server-side
    fetchedData = await loadAndProcessScenarioData(scenarioId, isTraining);
    isLoading = false;
    if (!fetchedData) {
      error = "Scenario data could not be loaded.";
    }
  } catch (err) {
    console.error(`[Training Page ${scenarioId}] Error loading data:`, err);
    error =
      err instanceof Error ? err.message : "Failed to load scenario data.";
    isLoading = false;
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  // Handle loading/null data state
  if (!fetchedData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading scenario data...</p>
      </div>
    );
  }

  // Pass the processed data and states
  return (
    <VisualizationScenario
      title={`${scenarioId} - Training`}
      is_training={isTraining}
      metadata={fetchedData.metadata}
      events={fetchedData.events}
      isLoading={isLoading}
      error={error}
    />
  );
}
