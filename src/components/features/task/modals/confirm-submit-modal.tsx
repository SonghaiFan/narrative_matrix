import React from "react";
import { AlertCircle, X } from "lucide-react";

interface ConfirmSubmitModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmSubmitModal({
  isOpen,
  onConfirm,
  onCancel,
}: ConfirmSubmitModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-4">
        <div className="flex items-start mb-3">
          <div className="flex-shrink-0 mr-3">
            <AlertCircle className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900">
              Confirm Submission
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Are you ready to submit your answer? You can review your marked
              reference events if needed, but marking events is optional. Once
              submitted, you won't be able to change your answer.
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
            Yes, Submit
          </button>
        </div>
      </div>
    </div>
  );
}
