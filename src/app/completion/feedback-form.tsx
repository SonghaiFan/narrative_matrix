"use client";

import { useState } from "react";

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

type FrequencyKey = keyof VisualizationTaskFeedback["frequency"];
type HelpfulnessKey = keyof VisualizationTaskFeedback["helpfulness"];
type PreferredMethodKey = keyof VisualizationTaskFeedback["preferredMethod"];

interface StudyFeedbackFormProps {
  onSubmit: (feedback: FeedbackState) => Promise<void>;
  isSubmitting: boolean;
}

export function StudyFeedbackForm({
  onSubmit,
  isSubmitting,
}: StudyFeedbackFormProps) {
  const [feedback, setFeedback] = useState<FeedbackState>({
    visualizationTasks: {
      frequency: {
        alwaysUsed: 0,
        sometimesUsed: 0,
        rarelyUsed: 0,
      },
      helpfulness: {
        veryHelpful: 0,
        somewhatHelpful: 0,
        notHelpful: 0,
      },
      preferredMethod: {
        visualization: 0,
        text: 0,
        both: 0,
      },
    },
    textOnlyTasks: {
      difficulty: 3,
      wouldHaveBenefitedFromVisualization: 3,
    },
    overall: {
      visualizationPreference: "sometimes",
      visualizationImpact: "neutral",
      suggestions: "",
    },
    priorExperience: 3,
    comments: "",
  });

  const handleVisualizationTaskFeedback = (
    category: keyof VisualizationTaskFeedback,
    subcategory: FrequencyKey | HelpfulnessKey | PreferredMethodKey,
    value: number
  ) => {
    setFeedback((prev) => ({
      ...prev,
      visualizationTasks: {
        ...prev.visualizationTasks,
        [category]: {
          ...prev.visualizationTasks[category],
          [subcategory]: value,
        },
      },
    }));
  };

  const handleTextOnlyTaskFeedback = (
    field: keyof TextOnlyTaskFeedback,
    value: number
  ) => {
    setFeedback((prev) => ({
      ...prev,
      textOnlyTasks: {
        ...prev.textOnlyTasks,
        [field]: value,
      },
    }));
  };

  const handleOverallFeedback = (
    field: keyof OverallFeedback,
    value: OverallFeedback[keyof OverallFeedback]
  ) => {
    setFeedback((prev) => ({
      ...prev,
      overall: {
        ...prev.overall,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(feedback);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Study Feedback</h2>
        <p className="mt-2 text-sm text-gray-600">
          Please help us understand your experience with the different task
          types
        </p>
      </div>

      {/* Visualization Tasks Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">
          Tasks with Visualizations (6 tasks)
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How often did you use the visualizations?
            </label>
            <div className="grid grid-cols-3 gap-4">
              {(
                [
                  { value: "alwaysUsed", label: "Always Used" },
                  { value: "sometimesUsed", label: "Sometimes Used" },
                  { value: "rarelyUsed", label: "Rarely Used" },
                ] as const
              ).map(({ value, label }) => (
                <div key={value} className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    max="6"
                    value={feedback.visualizationTasks.frequency[value]}
                    onChange={(e) =>
                      handleVisualizationTaskFeedback(
                        "frequency",
                        value,
                        parseInt(e.target.value)
                      )
                    }
                    className="w-16 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How helpful were the visualizations?
            </label>
            <div className="grid grid-cols-3 gap-4">
              {(
                [
                  { value: "veryHelpful", label: "Very Helpful" },
                  { value: "somewhatHelpful", label: "Somewhat Helpful" },
                  { value: "notHelpful", label: "Not Helpful" },
                ] as const
              ).map(({ value, label }) => (
                <div key={value} className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    max="6"
                    value={feedback.visualizationTasks.helpfulness[value]}
                    onChange={(e) =>
                      handleVisualizationTaskFeedback(
                        "helpfulness",
                        value,
                        parseInt(e.target.value)
                      )
                    }
                    className="w-16 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              When you used visualizations, what was your primary method?
            </label>
            <div className="grid grid-cols-3 gap-4">
              {(
                [
                  { value: "visualization", label: "Mostly Visualization" },
                  { value: "text", label: "Mostly Text" },
                  { value: "both", label: "Both Equally" },
                ] as const
              ).map(({ value, label }) => (
                <div key={value} className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    max="6"
                    value={feedback.visualizationTasks.preferredMethod[value]}
                    onChange={(e) =>
                      handleVisualizationTaskFeedback(
                        "preferredMethod",
                        value,
                        parseInt(e.target.value)
                      )
                    }
                    className="w-16 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Text-Only Tasks Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">
          Tasks without Visualizations (6 tasks)
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How difficult were these tasks compared to tasks with
              visualizations?
            </label>
            <div className="flex items-center space-x-4">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    handleTextOnlyTaskFeedback("difficulty", value)
                  }
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    feedback.textOnlyTasks.difficulty === value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Much Easier</span>
              <span>Much Harder</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Would visualizations have helped in these tasks?
            </label>
            <div className="flex items-center space-x-4">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    handleTextOnlyTaskFeedback(
                      "wouldHaveBenefitedFromVisualization",
                      value
                    )
                  }
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    feedback.textOnlyTasks
                      .wouldHaveBenefitedFromVisualization === value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Not at All</span>
              <span>Very Much</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Experience Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">
          Overall Experience
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Given the choice, how would you prefer visualizations to be used?
            </label>
            <select
              value={feedback.overall.visualizationPreference}
              onChange={(e) =>
                handleOverallFeedback(
                  "visualizationPreference",
                  e.target.value as "always" | "sometimes" | "never"
                )
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="always">Always show visualizations</option>
              <option value="sometimes">
                Current balance (half with visualizations)
              </option>
              <option value="never">Never show visualizations</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How did the presence/absence of visualizations affect your
              performance?
            </label>
            <select
              value={feedback.overall.visualizationImpact}
              onChange={(e) =>
                handleOverallFeedback(
                  "visualizationImpact",
                  e.target.value as "positive" | "neutral" | "negative"
                )
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="positive">Improved my performance</option>
              <option value="neutral">No significant impact</option>
              <option value="negative">Hindered my performance</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How familiar are you with using visualizations in similar tasks?
            </label>
            <div className="flex items-center space-x-4">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setFeedback((prev) => ({ ...prev, priorExperience: value }))
                  }
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    feedback.priorExperience === value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Not Familiar</span>
              <span>Very Familiar</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What improvements would you suggest for the visualization design?
            </label>
            <textarea
              value={feedback.overall.suggestions}
              onChange={(e) =>
                handleOverallFeedback("suggestions", e.target.value)
              }
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Please share your suggestions..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional comments
            </label>
            <textarea
              value={feedback.comments}
              onChange={(e) =>
                setFeedback((prev) => ({ ...prev, comments: e.target.value }))
              }
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Any other feedback you'd like to share..."
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isSubmitting ? "Submitting..." : "Submit Feedback"}
      </button>
    </form>
  );
}
