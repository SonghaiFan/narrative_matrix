"use client";

import { useState, Suspense, useEffect, FormEvent } from "react";
import { LoginForm } from "@/components/features/auth/login-form";
import { ConsentForm } from "@/components/features/auth/consent-from";
import { UsabilityTest } from "@/components/features/auth/usability-test";
import { useAuth } from "@/contexts/auth-context";
import { useNavigationStore } from "@/store/navigation-store";
import { useRouter } from "next/navigation";
import { ScenarioType } from "@/types/scenario";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

/**
 * Manual parameter input form when URL doesn't have parameters
 */
function ManualParamInput({
  onComplete,
}: {
  onComplete: (prolificId: string, studyId: string, sessionId: string) => void;
}) {
  const [prolificId, setProlificId] = useState("");
  const [studyId, setStudyId] = useState("text-visual");
  const [sessionId, setSessionId] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!prolificId.trim()) {
      setError("Prolific ID is required");
      return;
    }

    if (!sessionId.trim()) {
      setError("Session ID is required");
      return;
    }

    onComplete(prolificId, studyId, sessionId);
  };

  return (
    <div className="max-w-md w-full mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-center">
        Study Parameters
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Please enter your Prolific ID and session details to continue.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="prolificId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Prolific ID
          </label>
          <input
            id="prolificId"
            type="text"
            value={prolificId}
            onChange={(e) => setProlificId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your Prolific ID"
          />
        </div>

        <div>
          <label
            htmlFor="studyId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Study ID
          </label>
          <input
            id="studyId"
            type="text"
            value={studyId}
            onChange={(e) => setStudyId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Default: text-visual"
          />
        </div>

        <div>
          <label
            htmlFor="sessionId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Session ID
          </label>
          <input
            id="sessionId"
            type="text"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter the session ID"
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm p-2 bg-red-50 border border-red-200 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Continue
        </button>
      </form>
    </div>
  );
}

// Function to check if URL has Prolific params
function hasUrlParameters() {
  if (typeof window === "undefined") return false;

  const params = new URLSearchParams(window.location.search);
  const prolificPid = params.get("PROLIFIC_PID");
  return !!prolificPid; // Return true if prolificPid exists
}

/**
 * Main page content with study onboarding flow
 */
function HomeContent() {
  // State management
  const [currentStep, setCurrentStep] = useState<
    "test" | "consent" | "login" | "welcome"
  >("test");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [useManualInput, setUseManualInput] = useState(false);

  // Hooks
  const {
    userId,
    setUserId,
    scenarioId,
    setScenarioId,
    loadUrlParams,
    hasLoadedParams,
  } = useAuth();
  const router = useRouter();
  const { setCurrentScenario, goToStage } = useNavigationStore();

  // Handle step completion
  const handleTestComplete = () => setCurrentStep("consent");
  const handleConsentComplete = () => setCurrentStep("login");

  // Handle manual parameter input
  const handleManualParamInput = (
    prolificId: string,
    studyId: string,
    sessionId: string
  ) => {
    // Create proper scenarioId format
    const formattedScenarioId = `${studyId}-${sessionId}`;

    // Update auth context with the manually entered values
    setUserId(prolificId);
    setScenarioId(formattedScenarioId);

    // Move to welcome step
    setCurrentStep("welcome");
  };

  // Start the study
  const startStudy = () => {
    if (!scenarioId) return;

    setIsRedirecting(true);
    setCurrentScenario(scenarioId as ScenarioType);
    const introUrl = goToStage("intro");
    router.push(introUrl);
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case "test":
        return <UsabilityTest onComplete={handleTestComplete} />;

      case "consent":
        return <ConsentForm onConsent={handleConsentComplete} />;

      case "login":
        // Check if we have URL parameters available
        const urlHasParams = hasUrlParameters();

        if (urlHasParams && !useManualInput) {
          return (
            <div className="max-w-md w-full mx-auto">
              <div className="text-center">
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h2 className="text-xl font-semibold text-blue-800 mb-2">
                    Parameters Available
                  </h2>
                  <p className="text-blue-700">
                    We detected Prolific parameters in the URL. You can use
                    these or enter your own.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <button
                    onClick={() => {
                      loadUrlParams();
                      setCurrentStep("welcome");
                    }}
                    className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Use URL Parameters
                  </button>
                  <button
                    onClick={() => setUseManualInput(true)}
                    className="py-2 px-4 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Enter Manually
                  </button>
                </div>
              </div>
            </div>
          );
        } else {
          return <ManualParamInput onComplete={handleManualParamInput} />;
        }

      case "welcome":
        return (
          <div className="text-center max-w-md w-full mx-auto">
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h2 className="text-xl font-semibold text-green-800 mb-2">
                Welcome, {userId}!
              </h2>
              <p className="text-green-700">
                You've been assigned scenario:{" "}
                <code className="font-mono bg-green-100 px-2 py-1 rounded">
                  {scenarioId}
                </code>
              </p>
            </div>

            {isRedirecting ? (
              <div className="p-4">
                <LoadingSpinner
                  size="sm"
                  text="Redirecting to introduction..."
                />
              </div>
            ) : (
              <button
                onClick={startStudy}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Begin Study
              </button>
            )}
          </div>
        );
    }
  };

  // Progress indicator
  const steps = [
    { key: "test", label: "Usability" },
    { key: "consent", label: "Consent" },
    { key: "login", label: "Login" },
    { key: "welcome", label: "Ready" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* App title */}
        <header className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Narrative Matrix</h1>
          <p className="text-gray-500">User Study Platform</p>
        </header>

        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex justify-between items-center max-w-md mx-auto">
            {steps.map((step, index) => (
              <div key={step.key} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep === step.key
                      ? "bg-blue-600 text-white"
                      : index < steps.findIndex((s) => s.key === currentStep)
                      ? "bg-green-100 text-green-800 border border-green-300"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {index < steps.findIndex((s) => s.key === currentStep)
                    ? "✓"
                    : index + 1}
                </div>
                <span
                  className={`text-xs mt-1 ${
                    currentStep === step.key
                      ? "text-blue-600 font-medium"
                      : "text-gray-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="h-1 w-full bg-gray-200 mt-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{
                width: `${
                  (steps.findIndex((s) => s.key === currentStep) /
                    (steps.length - 1)) *
                  100
                }%`,
              }}
            />
          </div>
        </div>

        {/* Main content card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6">{renderStepContent()}</div>
        </div>
      </div>
    </main>
  );
}

/**
 * Main page component with suspense
 */
export default function Home() {
  return (
    <Suspense fallback={<LoadingSpinner fullPage text="Loading..." />}>
      <HomeContent />
    </Suspense>
  );
}
