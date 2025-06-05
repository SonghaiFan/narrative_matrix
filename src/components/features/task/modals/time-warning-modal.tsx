import React from "react";
import { AlertCircle, X, Clock } from "lucide-react";

export type TimeWarningType = "taskStart" | "twentySecondsLeft";

interface TimeWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  warningType: TimeWarningType;
}

export function TimeWarningModal({
  isOpen,
  onClose,
  warningType,
}: TimeWarningModalProps) {
  if (!isOpen) return null;

  const getWarningContent = () => {
    switch (warningType) {
      case "taskStart":
        return {
          icon: <Clock className="h-5 w-5 text-blue-500" />,
          title: "Real Task Starting",
          message:
            "This is the real task and the timer is about to start. Are you ready to proceed?",
          buttonText: "I'm Ready",
        };
      case "twentySecondsLeft":
        return {
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
          title: "Time Warning",
          message:
            "You have only 20 seconds remaining. Please finish your task soon, otherwise it will automatically move to the next question.",
          buttonText: "Continue",
        };
      default:
        return {
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
          title: "Time Warning",
          message: "Please check your progress.",
          buttonText: "Continue",
        };
    }
  };

  const { icon, title, message, buttonText } = getWarningContent();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-4">
        <div className="flex items-start mb-3">
          <div className="flex-shrink-0 mr-3">{icon}</div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500 mt-1">{message}</p>
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
            className={`px-3 py-1.5 text-xs border rounded-md hover:bg-gray-50 ${
              warningType === "taskStart"
                ? "border-blue-300 text-blue-700 bg-blue-50"
                : "border-gray-300 text-gray-700"
            }`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
