import React from "react";
import { AlertCircle, X } from "lucide-react";

interface TimeWarningModalProps {
  isOpen: boolean;
  onClose: () => void; // Changed from onConfirm/onCancel as it's just a close action
}

export function TimeWarningModal({ isOpen, onClose }: TimeWarningModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-4">
        <div className="flex items-start mb-3">
          <div className="flex-shrink-0 mr-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900">Time Warning</h3>
            <p className="text-xs text-gray-500 mt-1">
              You have only 20 seconds remaining. Please finish your task soon,
              otherwise it will automatically move to the next question.
            </p>
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
            className="px-3 py-1.5 text-xs border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
