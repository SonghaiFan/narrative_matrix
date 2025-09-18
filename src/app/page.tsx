"use client";

// Demo scenarios with direct links
const DEMO_SCENARIOS = [
  {
    id: "pure-text",
    name: "Pure Text",
    description: "Text-only narrative visualization",
    route: "/pure-text",
    color: "bg-green-50 border-green-200 hover:bg-green-100 text-green-800",
  },
  {
    id: "text-visual",
    name: "Text + Visual",
    description: "Text with interactive visualizations",
    route: "/text-visual",
    color: "bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-800",
  },
  {
    id: "text-chat",
    name: "Text + Chat",
    description: "Text with AI chat interface",
    route: "/text-chat",
    color: "bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-800",
  },
  {
    id: "mixed",
    name: "Mixed Mode",
    description: "Combined visualizations and AI chat",
    route: "/mixed",
    color: "bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-800",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Narrative Grid</h1>
          <p className="text-gray-500">Interactive Demo Platform</p>
        </div>

        <div className="space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Choose a Demo Scenario
            </h2>
            <p className="text-sm text-gray-600">
              Click any scenario to start exploring different narrative
              visualization approaches
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {DEMO_SCENARIOS.map((scenario) => (
              <a
                key={scenario.id}
                href={scenario.route}
                className={`p-4 text-left border-2 rounded-lg transition-colors hover:scale-105 transform ${scenario.color}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-sm">{scenario.name}</h3>
                    <p className="text-xs opacity-80 mt-1">
                      {scenario.description}
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 opacity-60"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
