import { Suspense } from "react";
import ScenarioClient from "./scenario-client";
import { VisualizationScenario } from "@/components/features/visualization/visualization-scenario";
interface PageProps {
  params: {
    study: string;
    id: string;
  };
}

export default async function Page({ params }: PageProps) {
  // Server-side data fetching
  const [scenarioData, eventsData, quizData] = await Promise.all([
    fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/api/data?study_id=${params.study}&session_id=${
        params.id
      }&type=scenario`,
      { cache: "no-store" } // Disable caching for now during development
    ).then((res) => res.json()),
    fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/api/data?study_id=${params.study}&session_id=${params.id}&type=events`,
      { cache: "no-store" } // Disable caching for now during development
    ).then((res) => res.json()),
    fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/api/data?study_id=${params.study}&session_id=${params.id}&type=quiz`,
      { cache: "no-store" } // Disable caching for now during development
    ).then((res) => res.json()),
  ]);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4">Loading data...</p>
          </div>
        </div>
      }
    >
      <ScenarioClient
        params={params}
        scenarioData={scenarioData}
        eventsData={eventsData}
        quizData={quizData}
      />
    </Suspense>
  );
}
