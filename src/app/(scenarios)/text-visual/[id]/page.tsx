import { VisualizationScenario } from "@/components/features/visualization/visualization-scenario";
import {
  loadAndProcessScenarioData,
  getScenarioMetadataFromServer,
} from "@/lib/server/scenario-data";
import { notFound } from "next/navigation";
import { ScenarioContextSync } from "@/contexts/scenario-context-sync";

// Define the list of available scenario IDs (excluding the 'text-visual-' prefix)
// Based on the known directories: 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
const availableScenarioIds = [
  "1",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
];

// This function tells Next.js which dynamic routes to pre-render at build time
export async function generateStaticParams() {
  // Map the list of IDs to the format required by Next.js
  return availableScenarioIds.map((id) => ({
    id: id,
  }));
}

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

  // Determine the title, using metadata.name, fallback to "Scenario X"
  const title = scenarioData.metadata.name || `Scenario ${awaitedParams.id}`;

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
      />
    </>
  );
}

// --- Metadata Generation ---

// This async function generates metadata for the page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Await params before accessing id
  const { id } = await params;
  const scenarioId = `text-visual-${id}`;
  const metadata = getScenarioMetadataFromServer(scenarioId);

  // Handle case where metadata loading fails
  if (!metadata) {
    return {
      title: "Scenario Not Found",
      description: "The requested scenario could not be found.",
    };
  }

  // Return the title and description from the loaded metadata
  return {
    title: metadata.name || `Scenario ${id}`,
    description: metadata.description || "An interactive narrative scenario.",
    // We can add more metadata here like OpenGraph tags later
  };
}
