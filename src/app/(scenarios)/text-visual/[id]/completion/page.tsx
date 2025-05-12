"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getTaskProgress } from "@/lib/task-progress";
import { CheckCircle, Copy, ArrowLeft, Send } from "lucide-react";
import { saveFeedback } from "@/lib/firebase-operations";
import Image from "next/image";
import { useNavigationStore } from "@/store/navigation-store";
import { ScenarioType } from "@/types/scenario";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

function CompletionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const { setCurrentScenario, completeCurrentStage } = useNavigationStore();

  const [pageData, setPageData] = useState({
    totalTasks: 0,
    studyType: "text-visual",
    sessionTime: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [codeCopied, setCodeCopied] = useState(false);
  const [currentStep, setCurrentStep] = useState<"main" | "feedback">("main");
  const [feedback, setFeedback] = useState({
    visualizationUsage: {
      frequency: 0,
      helpfulness: 0,
      preference: 0,
    },
    experience: {
      withVisualization: 0,
      withoutVisualization: 0,
      overall: 0,
    },
    visualizationRatings: {
      entity: 0,
      topic: 0,
      time: 0,
    },
    comments: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, boolean>
  >({});

  // Fixed completion code for Prolific
  const completionCode = `C5QC5X93`;

  useEffect(() => {
    // Set current scenario from URL parameter
    if (params && params.id) {
      const scenarioId = `text-visual-${params.id}` as ScenarioType;
      setCurrentScenario(scenarioId);

      // Mark this stage as complete in the navigation store
      completeCurrentStage();
    }

    // In simplified mode, we don't need to redirect if no user
    // Instead, just use default or parameter data

    const totalParam = searchParams.get("total");
    const sessionTimeParam = searchParams.get("time");
    const sessionTime = sessionTimeParam ? parseInt(sessionTimeParam, 10) : 0;

    if (totalParam) {
      const totalTasks = parseInt(totalParam, 10);
      if (isNaN(totalTasks) || totalTasks <= 0) {
        setError("Invalid task count");
        setLoading(false);
        return;
      }

      setPageData({
        totalTasks,
        studyType: "text-visual",
        sessionTime,
      });
      setLoading(false);
    } else if (user) {
      // If user exists, try to get progress
      const progress = getTaskProgress(user.id);
      if (progress) {
        setPageData({
          totalTasks: progress.totalTasks,
          studyType: "text-visual",
          sessionTime: progress.totalSessionTime || 0,
        });
        setLoading(false);
      } else {
        // Use defaults if no progress found
        setPageData({
          totalTasks: 10, // Default task count
          studyType: "text-visual",
          sessionTime: 0,
        });
        setLoading(false);
      }
    } else {
      // No user but also no error - just use defaults
      setPageData({
        totalTasks: 10, // Default task count
        studyType: "text-visual",
        sessionTime: 0,
      });
      setLoading(false);
    }
  }, [
    searchParams,
    user,
    router,
    params,
    setCurrentScenario,
    completeCurrentStage,
  ]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(completionCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFeedback((prev) => ({
      ...prev,
      comments: e.target.value,
    }));
  };

  const handleVisualizationUsageChange = (
    category: "frequency" | "helpfulness" | "preference",
    value: number
  ) => {
    setFeedback((prev) => ({
      ...prev,
      visualizationUsage: {
        ...prev.visualizationUsage,
        [category]: value,
      },
    }));
  };

  const handleExperienceChange = (
    category: "withVisualization" | "withoutVisualization" | "overall",
    value: number
  ) => {
    setFeedback((prev) => ({
      ...prev,
      experience: {
        ...prev.experience,
        [category]: value,
      },
    }));
  };

  const handleVisualizationRatingChange = (
    type: "entity" | "topic" | "time",
    value: number
  ) => {
    setFeedback((prev) => ({
      ...prev,
      visualizationRatings: {
        ...prev.visualizationRatings,
        [type]: value,
      },
    }));
  };

  const handleNext = () => {
    if (currentStep === "main") {
      setCurrentStep("feedback");
    } else {
      handleSubmitAll();
    }
  };

  const validateFeedback = () => {
    const errors: Record<string, boolean> = {};

    // Check all required ratings
    // Visualization Usage
    if (feedback.visualizationUsage.frequency === 0) errors.frequency = true;
    if (feedback.visualizationUsage.helpfulness === 0)
      errors.helpfulness = true;
    if (feedback.visualizationUsage.preference === 0) errors.preference = true;

    // Experience
    if (feedback.experience.withVisualization === 0)
      errors.withVisualization = true;
    if (feedback.experience.withoutVisualization === 0)
      errors.withoutVisualization = true;
    if (feedback.experience.overall === 0) errors.overall = true;

    // Visualization Types
    if (feedback.visualizationRatings.entity === 0) errors.entity = true;
    if (feedback.visualizationRatings.topic === 0) errors.topic = true;
    if (feedback.visualizationRatings.time === 0) errors.time = true;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitAll = async () => {
    console.log("Starting handleSubmitAll...");
    console.log("Current feedback state:", feedback);

    if (!validateFeedback()) {
      console.log("Feedback validation failed");
      return;
    }
    console.log("Feedback validation passed");

    setIsSubmitting(true);
    try {
      // In simplified mode, we don't actually need to save to Firebase or localStorage
      console.log(
        "SIMPLIFIED MODE: No actual data saving, just logging feedback"
      );
      console.log("Feedback data:", feedback);

      // Just simulate a short delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mark completion
      console.log("Setting isComplete to true...");
      setIsComplete(true);
      console.log("isComplete set to true");

      console.log("Setting currentStep to main...");
      setCurrentStep("main");
      console.log("currentStep set to main");

      console.log("Feedback submission completed successfully");
    } catch (error) {
      console.error("Failed to submit survey data. Full error:", error);
      console.error(
        "Error stack trace:",
        error instanceof Error ? error.stack : "No stack trace"
      );
      setError(
        error instanceof Error ? error.message : "Failed to submit feedback"
      );
    } finally {
      console.log("Setting isSubmitting to false");
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const renderRatingScale = (
    value: number,
    onChange: (value: number) => void,
    error: boolean,
    label: React.ReactNode,
    leftLabel: string,
    rightLabel: string
  ) => (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {error && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            onClick={() => onChange(rating)}
            className={`flex-1 h-8 rounded-md border transition-colors ${
              value === rating
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            } ${error ? "border-red-300" : ""}`}
          >
            {rating}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      {error && <p className="text-xs text-red-500">Please provide a rating</p>}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <LoadingSpinner size="md" text="Loading..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm p-4 max-w-md w-full">
          <h1 className="text-lg font-medium text-red-600 mb-2">Error</h1>
          <p className="text-sm text-gray-700 mb-3">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-2 px-4 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const renderMainContent = () => (
    <>
      {isComplete ? (
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">Thank You!</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your feedback has been submitted successfully.
          </p>

          <div className="bg-gray-50 border border-gray-100 rounded p-3 mb-6 mx-auto max-w-xs">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-800">
                Your Completion Code
              </h3>
              {codeCopied && (
                <span className="text-xs text-gray-600">✓ Copied</span>
              )}
            </div>
            <div className="flex items-center">
              <code className="bg-white p-2 rounded border border-gray-100 font-mono text-sm flex-grow text-center">
                {completionCode}
              </code>
              <button
                onClick={handleCopyCode}
                className="ml-2 p-1.5 bg-gray-800 text-white rounded hover:bg-gray-700 flex items-center justify-center"
                aria-label="Copy completion code"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          <button
            onClick={() => router.push("/")}
            className="py-2 px-4 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 inline-flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Return to Home
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-medium text-gray-900">
                Study Completed
              </h1>
              <p className="text-xs text-gray-500">
                Thank you for your participation
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded p-3 mb-4">
            <div className="flex items-center mb-2">
              <h2 className="text-sm font-medium text-gray-700">
                Study Information
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2 rounded border border-gray-100">
                <div className="text-gray-500">Tasks Completed</div>
                <div className="font-medium">
                  {pageData.totalTasks}/{pageData.totalTasks}
                </div>
              </div>

              <div className="bg-white p-2 rounded border border-gray-100">
                <div className="text-gray-500">Interface</div>
                <div className="font-medium capitalize">Text-Visual</div>
              </div>

              <div className="bg-white p-2 rounded border border-gray-100">
                <div className="text-gray-500">Session Time</div>
                <div className="font-medium">
                  {formatTime(pageData.sessionTime)}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleNext}
            className="w-full py-2 px-4 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center justify-center"
          >
            Continue to Feedback
          </button>
        </>
      )}
    </>
  );

  const renderFeedbackSection = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Study Feedback</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Please share your experience with the different task interfaces
        </p>
      </div>

      <div className="space-y-4">
        {/* Visualization Usage Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-900">
            Visualization Usage
          </h3>

          {renderRatingScale(
            feedback.visualizationUsage.frequency,
            (value) => handleVisualizationUsageChange("frequency", value),
            validationErrors.frequency,
            "How frequently did you use the visualizations?",
            "Rarely",
            "Very Often"
          )}

          {renderRatingScale(
            feedback.visualizationUsage.helpfulness,
            (value) => handleVisualizationUsageChange("helpfulness", value),
            validationErrors.helpfulness,
            "How helpful were the visualizations?",
            "Not Helpful",
            "Very Helpful"
          )}

          {renderRatingScale(
            feedback.visualizationUsage.preference,
            (value) => handleVisualizationUsageChange("preference", value),
            validationErrors.preference,
            "Which interface did you prefer?",
            "Text Only",
            "With Visualizations"
          )}
        </div>

        {/* Experience Comparison Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-900">
            Experience Comparison
          </h3>

          {renderRatingScale(
            feedback.experience.withVisualization,
            (value) => handleExperienceChange("withVisualization", value),
            validationErrors.withVisualization,
            "How was your experience with tasks using visualizations?",
            "Very Poor",
            "Very Good"
          )}

          {renderRatingScale(
            feedback.experience.withoutVisualization,
            (value) => handleExperienceChange("withoutVisualization", value),
            validationErrors.withoutVisualization,
            "How was your experience with tasks without visualizations?",
            "Very Poor",
            "Very Good"
          )}

          {renderRatingScale(
            feedback.experience.overall,
            (value) => handleExperienceChange("overall", value),
            validationErrors.overall,
            "Overall experience with the study?",
            "Very Poor",
            "Very Good"
          )}
        </div>

        {/* Visualization Types Rating Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-900">
            Visualization Types
          </h3>
          <p className="text-xs text-gray-500 mb-2">
            Please rate how helpful each type of visualization was for your
            tasks:
          </p>

          {renderRatingScale(
            feedback.visualizationRatings.entity,
            (value) => handleVisualizationRatingChange("entity", value),
            validationErrors.entity,
            <span className="flex items-center gap-2">
              <Image
                src="/icons/entity-pre.png"
                alt="Entity Visualization"
                width={128}
                height={128}
              />
              <Image
                src="/icons/entity-icon.png"
                alt="Entity Visualization"
                width={128}
                height={128}
              />
              Entity Swimlane
            </span>,
            "Not Helpful",
            "Very Helpful"
          )}

          {renderRatingScale(
            feedback.visualizationRatings.topic,
            (value) => handleVisualizationRatingChange("topic", value),
            validationErrors.topic,
            <span className="flex items-center gap-2">
              <Image
                src="/icons/topic-pre.png"
                alt="Topic Visualization"
                width={128}
                height={128}
              />
              <Image
                src="/icons/topic-icon.png"
                alt="Topic Visualization"
                width={128}
                height={128}
              />
              Topic Stream
            </span>,
            "Not Helpful",
            "Very Helpful"
          )}

          {renderRatingScale(
            feedback.visualizationRatings.time,
            (value) => handleVisualizationRatingChange("time", value),
            validationErrors.time,
            <span className="flex items-center gap-2">
              <Image
                src="/icons/time-pre.png"
                alt="Time Visualization"
                width={128}
                height={128}
              />
              <Image
                src="/icons/time-icon.png"
                alt="Time Visualization"
                width={128}
                height={128}
              />
              Story Time
            </span>,
            "Not Helpful",
            "Very Helpful"
          )}
        </div>

        {/* Additional Comments */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Additional Comments
          </label>
          <textarea
            value={feedback.comments}
            onChange={handleFeedbackChange}
            placeholder="Please share any additional thoughts about your experience with the different interfaces..."
            className="w-full h-32 p-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <button
        onClick={handleSubmitAll}
        disabled={isSubmitting}
        className="w-full py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? (
          <span className="inline-flex items-center">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Submitting...
          </span>
        ) : (
          <span className="inline-flex items-center">
            <Send className="h-4 w-4 mr-2" />
            Submit Feedback
          </span>
        )}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div
          className={`bg-white rounded-lg shadow-sm p-5 ${
            currentStep === "main" ? "max-w-md mx-auto" : "max-w-lg mx-auto"
          } w-full`}
        >
          {isComplete
            ? renderMainContent()
            : currentStep === "main"
            ? renderMainContent()
            : renderFeedbackSection()}
        </div>
      </div>
    </div>
  );
}

// Main page component that wraps the content in Suspense
export default function CompletionRoute() {
  return (
    <Suspense fallback={<LoadingSpinner size="md" text="Loading..." />}>
      <CompletionContent />
    </Suspense>
  );
}
