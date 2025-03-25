"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Copy, ArrowLeft, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import {
  resetTaskProgress,
  resetAllTaskProgress,
  updateTaskProgress,
  SurveyData,
} from "@/lib/task-progress";

interface CompletionPageProps {
  totalTasks: number;
  userRole?: "domain" | "normal";
  studyType?: string;
  onRestart?: () => void;
}

// Define NASA-TLX categories
const TLX_CATEGORIES = [
  {
    id: "mental",
    label: "Mental Demand",
    description: "How mentally demanding was the task?",
  },
  {
    id: "physical",
    label: "Physical Demand",
    description: "How physically demanding was the task?",
  },
  {
    id: "temporal",
    label: "Temporal Demand",
    description: "How hurried or rushed was the pace of the task?",
  },
  {
    id: "performance",
    label: "Performance",
    description:
      "How successful were you in accomplishing what you were asked to do?",
  },
  {
    id: "effort",
    label: "Effort",
    description:
      "How hard did you have to work to accomplish your level of performance?",
  },
  {
    id: "frustration",
    label: "Frustration",
    description:
      "How insecure, discouraged, irritated, stressed, and annoyed were you?",
  },
];

// Define SUS questions
const SUS_QUESTIONS = [
  "I think that I would like to use this system frequently",
  "I found the system unnecessarily complex",
  "I thought the system was easy to use",
  "I think that I would need the support of a technical person to be able to use this system",
  "I found the various functions in this system were well integrated",
  "I thought there was too much inconsistency in this system",
  "I would imagine that most people would learn to use this system very quickly",
  "I found the system very cumbersome to use",
  "I felt very confident using the system",
  "I needed to learn a lot of things before I could get going with this system",
];

export function CompletionPage({
  totalTasks,
  userRole = "normal",
  studyType = "visualization",
  onRestart,
}: CompletionPageProps) {
  const router = useRouter();
  const [codeCopied, setCodeCopied] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<
    "main" | "tlx" | "sus" | "feedback"
  >(userRole === "domain" ? "main" : "main");

  // NASA-TLX state
  const [tlxRatings, setTlxRatings] = useState<Record<string, number>>(
    Object.fromEntries(TLX_CATEGORIES.map((cat) => [cat.id, 5]))
  );

  // SUS state
  const [susRatings, setSusRatings] = useState<number[]>(Array(10).fill(3));

  // Feedback state
  const [feedback, setFeedback] = useState("");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Fixed completion code for Prolific
  const completionCode = `PROLIFIC-PUR-4529`;

  // Get user ID from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserId(user.id);
      } catch (error) {
        console.error("Failed to parse stored user:", error);
      }
    }
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(completionCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleReturnHome = () => {
    router.push("/");
  };

  const handleReturnToDashboard = () => {
    router.push("/dashboard");
  };

  // Handle NASA-TLX rating change
  const handleTlxRatingChange = (categoryId: string, value: number) => {
    setTlxRatings((prev) => ({
      ...prev,
      [categoryId]: value,
    }));
  };

  // Handle SUS rating change
  const handleSusRatingChange = (index: number, value: number) => {
    const newRatings = [...susRatings];
    newRatings[index] = value;
    setSusRatings(newRatings);
  };

  // Handle feedback change
  const handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFeedback(e.target.value);
  };

  // Move to the next step - domain users never proceed to surveys
  const handleNext = () => {
    // Domain users never see the assessment forms
    if (userRole === "domain") {
      return;
    }

    if (currentStep === "main") {
      setCurrentStep("tlx");
    } else if (currentStep === "tlx") {
      setCurrentStep("sus");
    } else if (currentStep === "sus") {
      setCurrentStep("feedback");
    } else {
      handleSubmitAll();
    }
  };

  // Submit all data
  const handleSubmitAll = async () => {
    if (!userId || userRole === "domain") return;

    setIsSubmitting(true);

    try {
      // Prepare the data
      const surveyData: SurveyData = {
        userId,
        tlxRatings,
        susRatings,
        feedback,
        timestamp: new Date().toISOString(),
      };

      // Save to local storage
      localStorage.setItem(
        `survey_results_${userId}`,
        JSON.stringify(surveyData)
      );

      // Update task progress to include this survey data
      updateTaskProgress(userId, {
        surveyData,
      });

      // Mark as complete
      setIsComplete(true);
      setIsSubmitting(false);
    } catch (error) {
      console.error("Failed to submit survey data:", error);
      setIsSubmitting(false);
    }
  };

  // Render NASA-TLX component
  const renderTlxSection = () => (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">
          Cognitive Workload Assessment
        </h2>
        <p className="text-sm text-gray-500">
          Please rate your experience on the following dimensions:
        </p>
      </div>

      {TLX_CATEGORIES.map((category) => (
        <div key={category.id} className="space-y-2">
          <div className="flex justify-between items-baseline">
            <label className="block text-sm font-medium text-gray-700">
              {category.label}
            </label>
            <span className="text-sm text-gray-500">
              {tlxRatings[category.id]}/10
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-1">{category.description}</p>
          <input
            type="range"
            min="1"
            max="10"
            value={tlxRatings[category.id]}
            onChange={(e) =>
              handleTlxRatingChange(category.id, parseInt(e.target.value))
            }
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>
      ))}

      <button
        onClick={handleNext}
        className="w-full py-2 px-4 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center justify-center mt-6"
      >
        Continue
      </button>
    </div>
  );

  // Render SUS component
  const renderSusSection = () => (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">
          System Usability Scale
        </h2>
        <p className="text-sm text-gray-500">
          Please rate your agreement with the following statements:
        </p>
      </div>

      {SUS_QUESTIONS.map((question, index) => (
        <div key={index} className="space-y-2">
          <p className="text-sm text-gray-700">
            {index + 1}. {question}
          </p>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Strongly disagree</span>
            <div className="flex space-x-1 flex-grow justify-center">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => handleSusRatingChange(index, value)}
                  className={`w-8 h-8 rounded-full ${
                    susRatings[index] === value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
            <span className="text-xs text-gray-500">Strongly agree</span>
          </div>
        </div>
      ))}

      <button
        onClick={handleNext}
        className="w-full py-2 px-4 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center justify-center mt-6"
      >
        Continue
      </button>
    </div>
  );

  // Render feedback form
  const renderFeedbackSection = () => (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Feedback</h2>
        <p className="text-sm text-gray-500">
          Please share any additional thoughts about your experience:
        </p>
      </div>

      <textarea
        value={feedback}
        onChange={handleFeedbackChange}
        placeholder="Please provide any additional feedback about your experience with the system..."
        className="w-full h-40 p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      />

      <button
        onClick={handleSubmitAll}
        disabled={isSubmitting}
        className="w-full py-2 px-4 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center justify-center mt-6 disabled:bg-blue-300"
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
            <Send className="h-4 w-4 mr-1" />
            Submit Feedback
          </span>
        )}
      </button>
    </div>
  );

  // Main completion page content
  const renderMainContent = () => (
    <>
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="h-5 w-5 text-green-600" />
        </div>
        <div className="ml-3">
          <h1 className="text-lg font-medium text-gray-900">
            {userRole === "domain" ? "Scenario Completed" : "Study Completed"}
          </h1>
          <p className="text-xs text-gray-500">
            {userRole === "domain"
              ? "You can return to dashboard or explore other scenarios"
              : "Thank you for your participation"}
          </p>
        </div>
      </div>

      {/* Study Information */}
      <div className="bg-gray-50 rounded p-3 mb-4">
        <div className="flex items-center mb-2">
          <h2 className="text-sm font-medium text-gray-700">
            {userRole === "domain"
              ? "Scenario Information"
              : "Study Information"}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white p-2 rounded border border-gray-100">
            <div className="text-gray-500">Tasks Completed</div>
            <div className="font-medium">
              {totalTasks}/{totalTasks}
            </div>
          </div>

          <div className="bg-white p-2 rounded border border-gray-100">
            <div className="text-gray-500">Interface</div>
            <div className="font-medium capitalize">{studyType}</div>
          </div>
        </div>
      </div>

      {/* Completion Code - only shown for normal users */}
      {userRole === "normal" && (
        <div className="bg-gray-50 border border-gray-100 rounded p-3 mb-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-medium text-gray-800">
              Completion Code
            </h2>
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
      )}

      {/* Action buttons based on user role */}
      <div className="space-y-2">
        {userRole === "domain" ? (
          <button
            onClick={handleReturnToDashboard}
            className="w-full py-2 px-4 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Return to Dashboard
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="w-full py-2 px-4 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center justify-center"
          >
            Continue to Survey
          </button>
        )}
      </div>
    </>
  );

  // Success message after submitting everything
  const renderSuccessContent = () => (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      <h2 className="text-xl font-medium text-gray-900 mb-2">Thank You!</h2>
      <p className="text-sm text-gray-500 mb-6">
        Your feedback has been submitted successfully.
      </p>

      {/* Show completion code again */}
      <div className="bg-gray-50 border border-gray-100 rounded p-3 mb-6 mx-auto max-w-xs">
        <h3 className="text-sm font-medium text-gray-800 mb-2">
          Your Completion Code
        </h3>
        <code className="block bg-white p-2 rounded border border-gray-100 font-mono text-sm text-center">
          {completionCode}
        </code>
      </div>

      <button
        onClick={handleReturnHome}
        className="py-2 px-4 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 inline-flex items-center"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Return to Home
      </button>
    </div>
  );

  return (
    <div
      className={`bg-white rounded-lg shadow-sm p-5 ${
        currentStep === "main" ? "max-w-md" : "max-w-lg"
      } w-full`}
    >
      {/* Domain users only ever see the main content */}
      {userRole === "domain"
        ? renderMainContent()
        : isComplete
        ? renderSuccessContent()
        : currentStep === "main"
        ? renderMainContent()
        : currentStep === "tlx"
        ? renderTlxSection()
        : currentStep === "sus"
        ? renderSusSection()
        : renderFeedbackSection()}
    </div>
  );
}
