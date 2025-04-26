import { VisualizationScenario } from "@/components/features/visualization/visualization-scenario";
import { loadAndProcessScenarioData } from "@/lib/server/scenario-data";
import { ScenarioContextSync } from "@/contexts/scenario-context-sync";

// Define the props type, including the dynamic route parameter `id`
interface ScenarioPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}

// This is now an async Server Component
export default async function DynamicVisualizationPage({
  params,
  searchParams,
}: ScenarioPageProps) {
  // Await params and searchParams
  const awaitedParams = await params;
  const awaitedSearchParams = await searchParams;

  const scenarioId = `text-visual-${awaitedParams.id}`;
  const isTraining = awaitedSearchParams.mode === "training";

  // Initialize variables for error and loading state
  let isLoading = true;
  let error: string | null = null;

  // Fetch data on the server using the new utility function
  const scenarioData = await loadAndProcessScenarioData(scenarioId, isTraining);
  isLoading = false;

  // Handle case where data loading fails or scenario doesn't exist
  if (!scenarioData) {
    // Either show a custom error UI or redirect to not-found
    error = "Failed to load scenario data";
    // For a more graceful error display rather than a 404
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
    // Or use notFound() to render the 404 page
    // notFound();
  }

  // Determine the title, using metadata.title, fallback to "Scenario X"
  const title = scenarioData.metadata.title || `Scenario ${awaitedParams.id}`;

  return (
    <>
      {/* This client component will run on the client and update the context */}
      <ScenarioContextSync />
      {/* The main scenario component with all necessary props */}
      <VisualizationScenario
        title={title}
        is_training={isTraining}
        // Pass the fetched data directly as props
        metadata={scenarioData.metadata}
        events={scenarioData.events}
        isLoading={isLoading}
        error={error}
        quiz={scenarioData.quiz}
      />
    </>
  );
}
