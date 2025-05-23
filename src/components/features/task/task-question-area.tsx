import React from "react";
import { Brain, AlertCircle, HelpCircle } from "lucide-react";
import { QuizItem } from "./quiz-types"; // Adjust path as needed

interface TaskQuestionAreaProps {
  currentTask: QuizItem;
  currentTaskIndex: number;
  isDomainExpert: boolean;
}

const getLevelColor = (level?: string) => {
  if (!level) return "bg-gray-100 text-gray-600";
  switch (level) {
    case "Information Retrieval":
      return "bg-blue-100 text-blue-700";
    case "Pattern Recognition":
      return "bg-green-100 text-green-700";
    case "Causal Reasoning":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

export function TaskQuestionArea({
  currentTask,
  currentTaskIndex,
  isDomainExpert,
}: TaskQuestionAreaProps) {
  if (!currentTask) return null;

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      {isDomainExpert && currentTask.level && (
        <div className="px-3 py-2 border-b bg-gray-50">
          <div className="flex flex-wrap gap-2">
            <div
              className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] ${getLevelColor(
                currentTask.level
              )}`}
            >
              <Brain className="h-2.5 w-2.5 mr-0.5" />
              <span>{currentTask.level}</span>
            </div>
            {currentTask.prone && (
              <div className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-700">
                <span className="font-medium">prone:</span>
                <span className="ml-1">{currentTask.prone}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="p-3">
        <div className="flex flex-col">
          <div className="text-xs text-gray-500 mb-1.5">
            Question {currentTaskIndex + 1}:
          </div>
          <div className="text-normal font-medium text-gray-900">
            {currentTask.question}
          </div>
          {currentTask.questionCaption && (
            <div className="text-xs text-gray-500 mt-1">
              {currentTask.questionCaption}
            </div>
          )}
        </div>
      </div>

      <div className="px-3 pb-3">
        <div className="space-y-2">
          <div className="bg-red-50 border border-red-200 rounded-md p-2.5">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-3.5 w-3.5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-800">
                Please answer based ONLY on the text you have read, not your
                prior knowledge. Some details may differ from real-world events.
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-md p-2.5">
            <div className="flex items-start gap-2">
              <HelpCircle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">
                Tip: If you cannot find the specific information in the text,
                use the "Information Not Found" button below to skip this
                question.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
