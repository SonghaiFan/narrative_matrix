import { VisualizationScenario } from "@/components/features/visualization/visualization-scenario";
import {
  loadAndProcessScenarioData,
  loadScenarioMetadata,
} from "@/lib/server/scenario-data";
import { notFound } from "next/navigation";
import { ScenarioContextSync } from "@/components/features/scenario-context-sync";

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
  params: {
    id: string;
  };
  searchParams: {
    // Example: Check for training mode via URL query param
    mode?: string;
  };
}

// This is now an async Server Component
export default async function DynamicVisualizationPage({
  params,
  searchParams,
}: ScenarioPageProps) {
  const scenarioId = `text-visual-${params.id}`;
  const isTraining = searchParams.mode === "training";

  // Fetch data on the server using the new utility function
  const scenarioData = await loadAndProcessScenarioData(scenarioId, isTraining);

  // Handle case where data loading fails or scenario doesn't exist
  if (!scenarioData) {
    // This function notifies Next.js to render the nearest not-found page
    notFound();
  }

  return (
    <>
      {/* This client component will run on the client and update the context */}
      <ScenarioContextSync />
      {/* The main scenario component */}
      <VisualizationScenario
        title={scenarioData.metadata.title || `Scenario ${params.id}`}
        // Pass necessary data down. We might need to refine how data is passed.
        // For now, let VisualizationScenario fetch its own detailed data using the
        // synchronized context, or we pass scenarioData directly if modified.
        is_training={isTraining}
      />
    </>
  );
}

// --- Metadata Generation ---

// This async function generates metadata for the page
export async function generateMetadata({ params }: { params: { id: string } }) {
  const scenarioId = `text-visual-${params.id}`;
  const metadata = await loadScenarioMetadata(scenarioId);

  // Handle case where metadata loading fails
  if (!metadata) {
    return {
      title: "Scenario Not Found",
      description: "The requested scenario could not be found.",
    };
  }

  // Return the title and description from the loaded metadata
  return {
    title: metadata.name || `Scenario ${params.id}`,
    description: metadata.description || "An interactive narrative scenario.",
    // We can add more metadata here like OpenGraph tags later
  };
}
