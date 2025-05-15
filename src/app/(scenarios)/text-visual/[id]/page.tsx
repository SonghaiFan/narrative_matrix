import { ScenarioType } from "@/types/scenario";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import DynamicVisualizationClient from "./page.client";

// Server Component Wrapper
export default async function DynamicVisualizationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Process the params at the server level - await before accessing properties
  const { id } = await params;
  const scenarioId = `text-visual-${id}` as ScenarioType;

  return (
    <Suspense fallback={<LoadingSpinner text="Loading..." fullPage />}>
      <DynamicVisualizationClient scenarioId={scenarioId} paramId={id} />
    </Suspense>
  );
}
