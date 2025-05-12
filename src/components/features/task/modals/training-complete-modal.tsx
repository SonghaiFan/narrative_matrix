import React from "react";
import { Timer, X } from "lucide-react"; // Assuming Timer icon is appropriate

interface TrainingCompleteModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isSkippingTraining?: boolean; // To adjust text if user explicitly skipped
}

export function TrainingCompleteModal({
  isOpen,
  onConfirm,
  onCancel,
  isSkippingTraining = false,
}: TrainingCompleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-4">
        <div className="flex items-start mb-3">
          <div className="flex-shrink-0 mr-3">
            <Timer className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900">
              {isSkippingTraining
                ? "Proceed to Real Task"
                : "Training Complete"}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {isSkippingTraining
                ? "Are you sure you want to skip the training and proceed to the real task? Once you proceed, a timer will start and cannot be paused."
                : "You've completed the training tasks! Once you proceed to the real task, a timer will start and cannot be paused. Make sure you're ready to complete the real task without interruptions."}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="flex-shrink-0 ml-1 text-gray-400 hover:text-gray-500"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            I'm Ready
          </button>
        </div>
      </div>
    </div>
  );
}
