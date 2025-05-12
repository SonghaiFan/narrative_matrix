import React from "react";
import { AlertCircle, X } from "lucide-react";

interface IncorrectAnswerModalProps {
  isOpen: boolean;
  onClose: () => void;
  correctAnswer?: string;
}

export function IncorrectAnswerModal({
  isOpen,
  onClose,
  correctAnswer,
}: IncorrectAnswerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-4">
        <div className="flex items-start mb-3">
          <div className="flex-shrink-0 mr-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900">
              Incorrect Answer
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Your answer is not correct. Please review the information
              carefully and try again.
            </p>
            {correctAnswer && (
              <div className="mt-3 p-2 bg-blue-50 rounded-md">
                <p className="text-xs font-medium text-blue-800">
                  Correct Answer:
                </p>
                <p className="text-xs text-blue-700 mt-1">{correctAnswer}</p>
              </div>
            )}
            <ul className="text-xs text-gray-500 mt-3 list-disc ml-4">
              <li>Read all events thoroughly</li>
              <li>Mark the relevant events that contain the answer</li>
              <li>Double-check your answer before submitting</li>
            </ul>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-1 text-gray-400 hover:text-gray-500"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
