"use client";

import { VisualizationScenario } from "@/components/features/visualization/visualization-scenario";
import { Loading } from "@/components/ui/loading-spring";
import { useEffect, useState } from "react";

interface ScenarioPageProps {
  params: Promise<{
    study: string;
    id: string;
  }>;
  searchParams: Promise<{ mode?: string }>;
}

export default function ScenarioPage({
  params,
  searchParams,
}: ScenarioPageProps) {
  const [data, setData] = useState<{
    scenarioId: string;
    fetchedData: any | null;
    isLoading: boolean;
    error: string | null;
  }>({
    scenarioId: "",
    fetchedData: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    async function loadData() {
      try {
        const awaitedParams = await params;
        const awaitedSearchParams = await searchParams;

        const studyId = awaitedParams.study;
        const sessionId = awaitedParams.id;
        const scenarioId = `${studyId}-${sessionId}`;
        const isTraining = awaitedSearchParams.mode === "training";

        // Fetch scenario data using the API endpoint
        const response = await fetch(
          `/api/data?study_id=${studyId}&session_id=${sessionId}&type=scenario`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const fetchedData = await response.json();

        setData({
          scenarioId,
          fetchedData,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        console.error(`[Scenario Page] Error loading data:`, err);
        setData((prev) => ({
          ...prev,
          error:
            err instanceof Error ? err.message : "Failed to load scenario data",
          isLoading: false,
        }));
      }
    }

    loadData();
  }, [params, searchParams]);

  // Handle error state
  if (data.error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">Error: {data.error}</p>
      </div>
    );
  }

  // Handle loading/null data state
  if (data.isLoading || !data.fetchedData) {
    return <Loading fullScreen text="Loading scenario data..." />;
  }

  // Determine the title
  const title = data.fetchedData.metadata?.title || data.scenarioId;

  return (
    <VisualizationScenario
      title={title}
      is_training={searchParams.mode === "training"}
      metadata={data.fetchedData.metadata}
      events={data.fetchedData.events}
      isLoading={data.isLoading}
      error={data.error}
      quiz={data.fetchedData.quiz}
    />
  );
}
