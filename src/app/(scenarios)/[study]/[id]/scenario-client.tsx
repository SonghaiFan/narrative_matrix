"use client";

interface ScenarioClientProps {
  params: {
    study: string;
    id: string;
  };
  scenarioData: any;
  eventsData: any[];
  quizData: any[];
}

export default function ScenarioClient({
  params,
  scenarioData,
  eventsData,
  quizData,
}: ScenarioClientProps) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Scenario Data</h1>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Route Parameters:</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify({ study: params.study, id: params.id }, null, 2)}
        </pre>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Scenario Data:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[300px]">
          {JSON.stringify(scenarioData, null, 2)}
        </pre>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Events Data:</h2>
        <p className="text-sm text-gray-600 mb-2">
          Total Events: {eventsData?.length || 0}
        </p>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[500px]">
          {JSON.stringify(eventsData, null, 2)}
        </pre>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Quiz Data:</h2>
        <p className="text-sm text-gray-600 mb-2">
          Total Questions: {quizData?.length || 0}
        </p>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[500px]">
          {JSON.stringify(quizData, null, 2)}
        </pre>
      </div>
    </div>
  );
}
