import React from "react";
import { Timer, AlertCircle } from "lucide-react";
import { QuizItem } from "./quiz-types"; // Adjust path as needed

interface TaskHeaderProps {
  isTraining: boolean;
  completedTasksCount: number;
  totalTasksCount: number;
  currentTaskIndex: number;
  currentTaskTimeLeftFormatted: string | null;
  currentTaskTimerColorClass: string;
  isDomainExpert: boolean;
  onSkipToNextStage?: () => void; // Optional: domain experts can skip to the next stage in flow
  onDotClick?: (index: number) => void; // Optional: for navigating by dots
  tasksForDots: Pick<QuizItem, "id" | "completed">[]; // Only need id and completed status for dots
}

export function TaskHeader({
  isTraining,
  completedTasksCount,
  totalTasksCount,
  currentTaskIndex,
  currentTaskTimeLeftFormatted,
  currentTaskTimerColorClass,
  isDomainExpert,
  onSkipToNextStage,
  onDotClick,
  tasksForDots,
}: TaskHeaderProps) {
  return (
    <div className="border-b p-2 flex flex-wrap items-center gap-2 bg-white sticky top-0 z-10">
      <div className="flex-grow">
        <div className="flex items-center">
          <h2 className="text-sm font-semibold">
            {isTraining ? "Training Tasks" : "Tasks"}
          </h2>
          {isTraining && (
            <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800 border border-amber-300">
              Training
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500">
          {completedTasksCount} of {totalTasksCount} completed
        </div>
      </div>

      {!isTraining && (
        <div className="flex-grow flex justify-center items-center">
          <div
            className={`flex items-center px-4 py-2 rounded-lg border shadow-sm ${currentTaskTimerColorClass}`}
          >
            <div className="flex flex-col items-center">
              <div className="flex items-center">
                {currentTaskTimeLeftFormatted &&
                currentTaskTimeLeftFormatted.startsWith("00:2") &&
                currentTaskTimeLeftFormatted <= "00:20" &&
                !isDomainExpert ? (
                  <AlertCircle className="h-4 w-4 mr-2" />
                ) : (
                  <Timer className="h-4 w-4 mr-2" />
                )}
                <span className="text-sm font-bold">
                  {currentTaskTimeLeftFormatted || "--:--"}
                </span>
              </div>
              <span className="text-xs mt-0.5">
                Question {currentTaskIndex + 1} Timer
              </span>
            </div>
          </div>
        </div>
      )}

      {isDomainExpert && (
        <>
          {(isTraining || !isTraining) && onSkipToNextStage && (
            <button
              onClick={onSkipToNextStage}
              className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 flex-shrink-0"
            >
              Skip to Next Stage
            </button>
          )}
        </>
      )}

      <div className="flex items-center space-x-1 flex-shrink-0 ml-auto">
        {tasksForDots.map((task, idx) => (
          <div
            key={task.id}
            onClick={() => {
              if (onDotClick && (isDomainExpert || !task.completed)) {
                onDotClick(idx);
              }
            }}
            className={`w-2 h-2 rounded-full ${
              (isDomainExpert || !task.completed) && onDotClick
                ? "cursor-pointer"
                : "cursor-default"
            } ${
              idx === currentTaskIndex
                ? "bg-blue-600"
                : task.completed
                ? "bg-green-500"
                : "bg-gray-300"
            }`}
            title={`Question ${idx + 1}${task.completed ? " (Completed)" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
