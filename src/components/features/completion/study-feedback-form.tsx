import React from "react";
import { useState, ChangeEvent, FormEvent } from "react";
import Image from "next/image";
import { Send } from "lucide-react";

interface StudyFeedbackFormProps {
  onSubmit: () => void;
}

type RatingValue = number | null;

interface RatingConfig {
  id: string;
  label: string;
  leftLabel: string;
  rightLabel: string;
}

interface VisualizationType {
  id: keyof FeedbackState["visualizationRatings"];
  name: string;
  previewSrc: string;
  iconSrc: string;
}

const RATING_SCALE = [1, 2, 3, 4, 5] as const;

const VISUALIZATION_USAGE_RATINGS: RatingConfig[] = [
  {
    id: "frequency",
    label: "How frequently did you use the visualizations?",
    leftLabel: "Rarely",
    rightLabel: "Very Often",
  },
  {
    id: "helpfulness",
    label: "How helpful were the visualizations?",
    leftLabel: "Not Helpful",
    rightLabel: "Very Helpful",
  },
  {
    id: "preference",
    label: "Which interface did you prefer?",
    leftLabel: "Text Only",
    rightLabel: "With Visualizations",
  },
];

const EXPERIENCE_RATINGS: RatingConfig[] = [
  {
    id: "withVisualization",
    label: "How was your experience with tasks using visualizations?",
    leftLabel: "Very Poor",
    rightLabel: "Very Good",
  },
  {
    id: "withoutVisualization",
    label: "How was your experience with tasks without visualizations?",
    leftLabel: "Very Poor",
    rightLabel: "Very Good",
  },
  {
    id: "overall",
    label: "Overall experience with the study?",
    leftLabel: "Very Poor",
    rightLabel: "Very Good",
  },
];

const VISUALIZATION_TYPES: VisualizationType[] = [
  {
    id: "entity",
    name: "Entity Swimlane",
    previewSrc: "/icons/entity-pre.png",
    iconSrc: "/icons/entity-icon.png",
  },
  {
    id: "topic",
    name: "Topic Stream",
    previewSrc: "/icons/topic-pre.png",
    iconSrc: "/icons/topic-icon.png",
  },
  {
    id: "time",
    name: "Story Time",
    previewSrc: "/icons/time-pre.png",
    iconSrc: "/icons/time-icon.png",
  },
];

type FeedbackState = {
  visualizationUsage: {
    frequency: RatingValue;
    helpfulness: RatingValue;
    preference: RatingValue;
  };
  experience: {
    withVisualization: RatingValue;
    withoutVisualization: RatingValue;
    overall: RatingValue;
  };
  visualizationRatings: {
    entity: RatingValue;
    topic: RatingValue;
    time: RatingValue;
  };
  comments: string;
};

interface RatingScaleProps {
  value: RatingValue;
  onChange: (value: number) => void;
  error?: string;
  label: React.ReactNode;
  leftLabel: string;
  rightLabel: string;
}

function RatingScale({
  value,
  onChange,
  error,
  label,
  leftLabel,
  rightLabel,
}: RatingScaleProps) {
  return (
    <div className="bg-white rounded-lg p-3">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-800">
          {label}
        </label>
        <div className="grid grid-cols-[100px_auto_100px] items-center bg-white rounded-lg">
          <span className="text-xs font-medium text-gray-500 text-right pr-3">
            {leftLabel}
          </span>
          <div className="flex items-center justify-center">
            {RATING_SCALE.map((num) => (
              <button
                key={num}
                type="button"
                className={`w-9 h-9 rounded-full border-2 ${
                  value === num
                    ? "bg-blue-600 border-blue-700 text-white shadow-sm"
                    : "bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50"
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all mx-1 text-sm font-medium`}
                onClick={() => onChange(num)}
                aria-label={String(num)}
              >
                {num}
              </button>
            ))}
          </div>
          <span className="text-xs font-medium text-gray-500 pl-3">
            {rightLabel}
          </span>
        </div>
      </div>
      {error && (
        <div className="text-xs text-red-500 text-center mt-1 font-medium">
          {error}
        </div>
      )}
    </div>
  );
}

interface RatingGroupProps {
  title: string;
  ratings: RatingConfig[];
  values: Record<string, RatingValue>;
  errors: Record<string, string>;
  onChange: (field: string, value: number) => void;
}

function RatingGroup({
  title,
  ratings,
  values,
  errors,
  onChange,
}: RatingGroupProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4 shadow-sm">
      <div className="border-b border-gray-100 pb-2">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="space-y-4">
        {ratings.map((rating) => (
          <RatingScale
            key={rating.id}
            value={values[rating.id]}
            onChange={(value) => onChange(rating.id, value)}
            error={errors[rating.id]}
            label={rating.label}
            leftLabel={rating.leftLabel}
            rightLabel={rating.rightLabel}
          />
        ))}
      </div>
    </div>
  );
}

interface VisualizationPreviewProps {
  type: VisualizationType;
  value: RatingValue;
  error?: string;
  onChange: (value: number) => void;
}

function VisualizationPreview({
  type,
  value,
  error,
  onChange,
}: VisualizationPreviewProps) {
  return (
    <div className="space-y-4 bg-white rounded-lg p-4">
      <div className="flex items-center justify-center gap-6 p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
        <Image
          src={type.previewSrc}
          alt={`${type.name} Preview`}
          width={160}
          height={160}
          className="object-contain w-auto h-auto"
        />
        <Image
          src={type.iconSrc}
          alt={`${type.name} Icon`}
          width={160}
          height={160}
          className="object-contain w-auto h-auto"
        />
      </div>
      <RatingScale
        value={value}
        onChange={onChange}
        error={error}
        label={type.name}
        leftLabel="Not Helpful"
        rightLabel="Very Helpful"
      />
    </div>
  );
}

export function StudyFeedbackForm({ onSubmit }: StudyFeedbackFormProps) {
  const [feedback, setFeedback] = useState<FeedbackState>({
    visualizationUsage: {
      frequency: null,
      helpfulness: null,
      preference: null,
    },
    experience: {
      withVisualization: null,
      withoutVisualization: null,
      overall: null,
    },
    visualizationRatings: {
      entity: null,
      topic: null,
      time: null,
    },
    comments: "",
  });
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleVisualizationUsageChange(field: string, value: number) {
    setFeedback((f) => ({
      ...f,
      visualizationUsage: { ...f.visualizationUsage, [field]: value },
    }));
  }

  function handleExperienceChange(field: string, value: number) {
    setFeedback((f) => ({
      ...f,
      experience: { ...f.experience, [field]: value },
    }));
  }

  function handleVisualizationRatingChange(
    field: keyof FeedbackState["visualizationRatings"],
    value: number
  ) {
    setFeedback((f) => ({
      ...f,
      visualizationRatings: { ...f.visualizationRatings, [field]: value },
    }));
  }

  function handleFeedbackChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setFeedback((f) => ({ ...f, comments: e.target.value }));
  }

  function validate() {
    const errors: Record<string, string> = {};

    // Check visualization usage ratings
    Object.keys(feedback.visualizationUsage).forEach((key) => {
      if (
        !feedback.visualizationUsage[
          key as keyof typeof feedback.visualizationUsage
        ]
      ) {
        errors[key] = "Required";
      }
    });

    // Check experience ratings
    Object.keys(feedback.experience).forEach((key) => {
      if (!feedback.experience[key as keyof typeof feedback.experience]) {
        errors[key] = "Required";
      }
    });

    // Check visualization type ratings
    Object.keys(feedback.visualizationRatings).forEach((key) => {
      if (
        !feedback.visualizationRatings[
          key as keyof typeof feedback.visualizationRatings
        ]
      ) {
        errors[key] = "Required";
      }
    });

    return errors;
  }

  function handleSubmitAll(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errors = validate();
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSubmit();
    }, 1000);
  }

  return (
    <form onSubmit={handleSubmitAll} className="space-y-6">
      <RatingGroup
        title="Visualization Usage"
        ratings={VISUALIZATION_USAGE_RATINGS}
        values={feedback.visualizationUsage}
        errors={validationErrors}
        onChange={handleVisualizationUsageChange}
      />

      <RatingGroup
        title="Experience Comparison"
        ratings={EXPERIENCE_RATINGS}
        values={feedback.experience}
        errors={validationErrors}
        onChange={handleExperienceChange}
      />

      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4 shadow-sm">
        <div className="border-b border-gray-100 pb-2">
          <h3 className="text-base font-semibold text-gray-900">
            Visualization Types
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Please rate how helpful each type of visualization was for your
            tasks:
          </p>
        </div>
        <div className="space-y-8">
          {VISUALIZATION_TYPES.map((type) => (
            <VisualizationPreview
              key={type.id}
              type={type}
              value={feedback.visualizationRatings[type.id]}
              error={validationErrors[type.id]}
              onChange={(value) =>
                handleVisualizationRatingChange(type.id, value)
              }
            />
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <label className="block text-base font-semibold text-gray-900 mb-2">
          Additional Comments
        </label>
        <textarea
          value={feedback.comments}
          onChange={handleFeedbackChange}
          placeholder="Please share any additional thoughts about your experience with the different interfaces..."
          className="w-full h-24 p-3 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
      </div>

      <div className="text-center text-sm text-gray-500">
        <p>Your completion code will be shown after submitting the feedback</p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        {isSubmitting ? (
          <span className="inline-flex items-center justify-center">
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
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Submitting...
          </span>
        ) : (
          <span className="inline-flex items-center justify-center">
            <Send className="h-4 w-4 mr-2" />
            Submit to Get Completion Code
          </span>
        )}
      </button>
    </form>
  );
}
