"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getTaskProgress } from "@/lib/task-progress";
import { CheckCircle, Copy, ArrowLeft } from "lucide-react";
import { updateSessionCompletion } from "@/lib/firebase-operations";
import { StudyFeedbackForm } from "./feedback-form";

interface VisualizationTaskFeedback {
  frequency: {
    alwaysUsed: number;
    sometimesUsed: number;
    rarelyUsed: number;
  };
  helpfulness: {
    veryHelpful: number;
    somewhatHelpful: number;
    notHelpful: number;
  };
  preferredMethod: {
    visualization: number;
    text: number;
    both: number;
  };
}

type FrequencyKey = keyof VisualizationTaskFeedback["frequency"];
type HelpfulnessKey = keyof VisualizationTaskFeedback["helpfulness"];
type PreferredMethodKey = keyof VisualizationTaskFeedback["preferredMethod"];

interface TextOnlyTaskFeedback {
  difficulty: number;
  wouldHaveBenefitedFromVisualization: number;
}

interface OverallFeedback {
  visualizationPreference: "always" | "sometimes" | "never";
  visualizationImpact: "positive" | "neutral" | "negative";
  suggestions: string;
}

interface FeedbackState {
  visualizationTasks: VisualizationTaskFeedback;
  textOnlyTasks: TextOnlyTaskFeedback;
  overall: OverallFeedback;
  priorExperience: number;
  comments: string;
}

function CompletionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [pageData, setPageData] = useState({
    totalTasks: 0,
    studyType: "text-visual",
    sessionTime: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [codeCopied, setCodeCopied] = useState(false);
  const [currentStep, setCurrentStep] = useState<"main" | "feedback">("main");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Fixed completion code for Prolific
  const completionCode = `PROLIFIC-PUR-4529`;

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

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
      const progress = getTaskProgress(user.id);
      if (progress) {
        setPageData({
          totalTasks: progress.totalTasks,
          studyType: "text-visual",
          sessionTime: progress.totalSessionTime || 0,
        });
        setLoading(false);
      } else {
        setError("No completion data found");
        setLoading(false);
      }
    } else {
      setError("Missing required parameters");
      setLoading(false);
    }
  }, [searchParams, user, router]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(completionCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleNext = () => {
    if (currentStep === "main") {
      setCurrentStep("feedback");
    }
  };

  const handleSubmitFeedback = async (feedback: any) => {
    setIsSubmitting(true);
    try {
      if (user?.id) {
        await updateSessionCompletion(user.id, feedback);
      }
      setIsComplete(true);
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
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
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="h-5 w-5 text-green-600" />
        </div>
        <div className="ml-3">
          <h1 className="text-lg font-medium text-gray-900">Study Completed</h1>
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
  );

  const renderSuccessContent = () => (
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
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div
          className={`bg-white rounded-lg shadow-sm p-5 ${
            currentStep === "main" ? "max-w-md mx-auto" : "max-w-lg mx-auto"
          } w-full`}
        >
          {isComplete ? (
            renderSuccessContent()
          ) : currentStep === "main" ? (
            renderMainContent()
          ) : (
            <StudyFeedbackForm
              onSubmit={handleSubmitFeedback}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-12 h-12 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );
}

// Main page component that wraps the content in Suspense
export default function CompletionRoute() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CompletionContent />
    </Suspense>
  );
}
