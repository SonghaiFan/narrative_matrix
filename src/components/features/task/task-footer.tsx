import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  HelpCircle,
} from "lucide-react";

interface TaskFooterProps {
  // Navigation
  onPrevious: () => void;
  canGoToPrevious: boolean;
  onNext: () => void;
  canGoToNext: boolean;
  // Actions
  onSubmit: () => void;
  canSubmit: boolean;
  isSubmitting: boolean;
  onShowAnswer?: () => void; // Optional: for domain experts
  canShowAnswer?: boolean; // To manage toggle state text
  showAnswerActive?: boolean; // To indicate if "Show Answer" is currently active
  onInformationNotFound?: () => void; // Optional: for skipping
  // State
  isTaskCompleted: boolean;
  isDomainExpert: boolean;
}

export function TaskFooter({
  onPrevious,
  canGoToPrevious,
  onNext,
  canGoToNext,
  onSubmit,
  canSubmit,
  isSubmitting,
  onShowAnswer,
  canShowAnswer, // Not directly used for disabling, but for text
  showAnswerActive,
  onInformationNotFound,
  isTaskCompleted,
  isDomainExpert,
}: TaskFooterProps) {
  const showSubmitButton =
    !isTaskCompleted || (isDomainExpert && showAnswerActive);
  const showInfoNotFoundButton =
    !isTaskCompleted && !showAnswerActive && onInformationNotFound;
  const showDomainExpertRevealButton =
    isDomainExpert && !isTaskCompleted && onShowAnswer;

  return (
    <div className="border-t bg-white sticky bottom-0 p-3 z-10">
      <div className="flex justify-between items-center gap-2">
        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevious}
            disabled={!canGoToPrevious}
            className="p-2 rounded-full border border-gray-200 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 transition-colors"
            aria-label="Previous question"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={onNext}
            disabled={!canGoToNext}
            className="p-2 rounded-full border border-gray-200 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 transition-colors"
            aria-label="Next question"
          >
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {showDomainExpertRevealButton && (
            <button
              onClick={onShowAnswer}
              disabled={!canShowAnswer} // Can be always true if button is shown
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors ${
                showAnswerActive
                  ? "bg-blue-100 text-blue-700"
                  : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              }`}
            >
              <HelpCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {showAnswerActive ? "Hide Answer" : "Show Answer"}
              </span>
            </button>
          )}

          {showSubmitButton && (
            <button
              onClick={onSubmit}
              disabled={!canSubmit || isSubmitting} // Disable if cannot submit or already submitting
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {isSubmitting
                  ? "Submitting..."
                  : isTaskCompleted && isDomainExpert && showAnswerActive
                  ? "Resubmit with Answer"
                  : "Submit"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* "Information Not Found" button full-width below others if applicable */}
      {showInfoNotFoundButton && (
        <div className="mt-3 border-t pt-3">
          <button
            onClick={onInformationNotFound}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-amber-300 bg-amber-50 text-amber-700 rounded-md hover:bg-amber-100 hover:border-amber-400 transition-colors text-sm font-medium shadow-sm"
          >
            <HelpCircle className="h-4 w-4" />
            Mark as "Information Not Found"
          </button>
        </div>
      )}
    </div>
  );
}
