"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  HelpCircle,
  AlertCircle,
  X,
  Brain,
} from "lucide-react";

interface Task {
  id: string;
  level?: string;
  question: string;
  answer: string;
  completed: boolean;
  correct?: boolean;
}

interface TaskPanelProps {
  events: any[];
  metadata?: any;
  className?: string;
  userRole?: "domain" | "normal";
}

export function TaskPanel({
  events,
  metadata = {},
  className = "",
  userRole = "normal",
}: TaskPanelProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const isDomainExpert = userRole === "domain";

  // Generate tasks based on events data or use quiz from metadata
  useEffect(() => {
    if (!events || events.length === 0) return;

    // Check if metadata contains quiz questions
    if (
      metadata?.quiz &&
      Array.isArray(metadata.quiz) &&
      metadata.quiz.length > 0
    ) {
      // Use quiz questions from metadata
      const quizTasks: Task[] = metadata.quiz.map((q: any, index: number) => ({
        id: q.id || String(index + 1),
        level: q.level || "Information Retrieval",
        question: q.question,
        answer: q.answer,
        completed: false,
      }));
      setTasks(quizTasks);
    } else {
      // Create auto-generated tasks based on the events data
      const generatedTasks: Task[] = [
        {
          id: "1",
          level: "Information Retrieval",
          question: "What was the date of the first major event?",
          answer: new Date(
            events[0].date || events[0].temporal_anchoring?.real_time || ""
          ).toLocaleDateString(),
          completed: false,
        },
        {
          id: "2",
          level: "Information Retrieval",
          question: "How many total events are in this dataset?",
          answer: events.length.toString(),
          completed: false,
        },
        {
          id: "3",
          level: "Information Retrieval",
          question: "What is the main topic of this dataset?",
          answer: metadata?.topic || events[0].topic?.main_topic || "Conflict",
          completed: false,
        },
        {
          id: "4",
          level: "Information Retrieval",
          question: "Name one key entity mentioned in multiple events.",
          answer: events[0].entities?.[0]?.name || "Hamas",
          completed: false,
        },
        {
          id: "5",
          level: "Information Retrieval",
          question: "What is the time span covered by these events?",
          answer: `${new Date(
            events[0].date || events[0].temporal_anchoring?.real_time || ""
          ).toLocaleDateString()} to ${new Date(
            events[events.length - 1].date ||
              events[events.length - 1].temporal_anchoring?.real_time ||
              ""
          ).toLocaleDateString()}`,
          completed: false,
        },
      ];

      setTasks(generatedTasks);
    }
  }, [events, metadata]);

  const currentTask = tasks[currentTaskIndex];

  const handlePrevious = () => {
    if (currentTaskIndex > 0) {
      setCurrentTaskIndex(currentTaskIndex - 1);
      setShowAnswer(false);
      setUserAnswer("");
    }
  };

  const handleNext = () => {
    if (currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
      setShowAnswer(false);
      setUserAnswer("");
    } else if (isDomainExpert) {
      // For domain experts, when they reach the last task and click next,
      // redirect to the completion page
      navigateToCompletionPage();
    }
  };

  const handleReveal = () => {
    setShowAnswer(true);
  };

  const handleConfirmSubmit = () => {
    setShowConfirmModal(false);
    processSubmission();
  };

  const handleCancelSubmit = () => {
    setShowConfirmModal(false);
  };

  const handleSubmit = () => {
    // For non-domain users, show confirmation modal before submitting
    if (!isDomainExpert && !currentTask.completed && !showAnswer) {
      setShowConfirmModal(true);
      return;
    }

    // For domain experts, proceed directly
    processSubmission();
  };

  const processSubmission = () => {
    setIsSubmitting(true);

    // Simple string comparison - in a real app, you might want more sophisticated answer checking
    const isCorrect = userAnswer
      .toLowerCase()
      .includes(currentTask.answer.toLowerCase());

    // Update the current task as completed
    const updatedTasks = tasks.map((task, index) =>
      index === currentTaskIndex
        ? { ...task, completed: true, correct: isCorrect }
        : task
    );

    setTasks(updatedTasks);
    setShowAnswer(true);
    setIsSubmitting(false);

    // Check if this was the last task to complete
    const allCompleted = updatedTasks.every((task) => task.completed);

    if (allCompleted) {
      // Wait a moment before redirecting to the completion page
      setTimeout(() => {
        const correctCount = updatedTasks.filter(
          (t) => t.completed && t.correct
        ).length;
        const studyType =
          metadata?.studyType ||
          (window.location.pathname.includes("visualization")
            ? "visualization"
            : "pure-text");

        console.log("All tasks completed, redirecting to completion page...");

        // Use window.location.href for more reliable navigation
        window.location.href = `/completion?total=${updatedTasks.length}&correct=${correctCount}&type=${studyType}`;
      }, 1500);
    }
  };

  const handleRestartTasks = () => {
    // Reset all tasks
    setTasks(
      tasks.map((task) => ({ ...task, completed: false, correct: undefined }))
    );
    setCurrentTaskIndex(0);
    setShowAnswer(false);
    setUserAnswer("");
  };

  // Get the color for the cognitive level badge
  const getLevelColor = (level?: string) => {
    if (!level) return "bg-gray-100 text-gray-600";

    switch (level) {
      case "Information Retrieval":
        return "bg-blue-100 text-blue-700";
      case "Pattern Recognition":
        return "bg-green-100 text-green-700";
      case "Causal Reasoning":
        return "bg-purple-100 text-purple-700";
      case "Bias Analysis":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  // Function to navigate to completion page
  const navigateToCompletionPage = () => {
    const correctCount = tasks.filter((t) => t.completed && t.correct).length;
    const studyType =
      metadata?.studyType ||
      (window.location.pathname.includes("visualization")
        ? "visualization"
        : "pure-text");

    console.log("Redirecting to completion page...");

    // Use window.location.href for more reliable navigation
    window.location.href = `/completion?total=${tasks.length}&correct=${correctCount}&type=${studyType}`;
  };

  if (!currentTask) {
    return (
      <div className={`flex flex-col h-full bg-white p-2 ${className}`}>
        <h2 className="text-sm font-semibold mb-2">Tasks</h2>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-gray-500">No tasks available</p>
        </div>
      </div>
    );
  }

  const progress = Math.round(
    (tasks.filter((t) => t.completed).length / tasks.length) * 100
  );
  const completedTasks = tasks.filter((t) => t.completed).length;
  const correctTasks = tasks.filter((t) => t.completed && t.correct).length;

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Compact header with progress */}
      <div className="border-b p-2 flex flex-wrap items-center gap-2">
        <div className="flex-grow">
          <h2 className="text-sm font-semibold">Tasks</h2>
          <div className="text-xs text-gray-500">
            {completedTasks} of {tasks.length} completed
          </div>
        </div>

        {/* Domain expert skip button */}
        {isDomainExpert && (
          <button
            onClick={navigateToCompletionPage}
            className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 flex-shrink-0"
          >
            Skip to Completion
          </button>
        )}

        <div className="flex items-center space-x-1 flex-shrink-0 ml-auto">
          {tasks.map((task, idx) => (
            <div
              key={task.id}
              onClick={() =>
                isDomainExpert || !task.completed
                  ? setCurrentTaskIndex(idx)
                  : null
              }
              className={`w-2 h-2 rounded-full ${
                isDomainExpert || !task.completed
                  ? "cursor-pointer"
                  : "cursor-default"
              } ${
                idx === currentTaskIndex
                  ? "bg-blue-600"
                  : task.completed
                  ? task.correct
                    ? "bg-green-500"
                    : "bg-red-500"
                  : "bg-gray-300"
              }`}
              title={`Question ${idx + 1}${
                task.completed
                  ? task.correct
                    ? " (Correct)"
                    : " (Incorrect)"
                  : ""
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question card */}
      <div className="flex-1 p-2 flex flex-col overflow-hidden">
        {/* Cognitive level badge */}
        {currentTask.level && (
          <div className="flex items-center mb-1">
            <div
              className={`text-[10px] px-1.5 py-0.5 rounded-full flex items-center ${getLevelColor(
                currentTask.level
              )}`}
            >
              <Brain className="h-2.5 w-2.5 mr-0.5" />
              <span>{currentTask.level}</span>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 mb-1">
          Question {currentTaskIndex + 1}:
        </div>
        <div className="bg-gray-50 p-2 rounded text-sm mb-2">
          {currentTask.question}
        </div>

        {/* Answer input or result */}
        {!currentTask.completed ? (
          <div className="mb-2">
            <textarea
              className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={
                currentTask.level &&
                currentTask.level !== "Information Retrieval"
                  ? 4
                  : 2
              }
              placeholder="Enter your answer..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              disabled={showAnswer}
            ></textarea>
          </div>
        ) : (
          <div
            className={`p-2 mb-2 rounded text-xs flex items-start ${
              currentTask.correct
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {currentTask.correct ? (
              <CheckCircle className="h-3 w-3 mr-1 flex-shrink-0 text-green-500" />
            ) : (
              <XCircle className="h-3 w-3 mr-1 flex-shrink-0 text-red-500" />
            )}
            <div>
              <p className="font-medium">
                {currentTask.correct ? "Correct!" : "Incorrect"}
              </p>
              <p className="mt-0.5">Your answer: {userAnswer}</p>
            </div>
          </div>
        )}

        {/* Answer reveal */}
        {showAnswer && (
          <div className="bg-blue-50 p-2 rounded text-xs mb-2 overflow-auto max-h-40">
            <p className="font-medium text-blue-800">Answer:</p>
            <p className="text-blue-700">{currentTask.answer}</p>
          </div>
        )}

        {/* Compact controls */}
        <div className="flex justify-between mt-auto pt-1 text-xs">
          <button
            onClick={handlePrevious}
            disabled={
              currentTaskIndex === 0 ||
              (!isDomainExpert && tasks[currentTaskIndex].completed)
            }
            className="flex items-center px-2 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-3 w-3 mr-0.5" />
            Prev
          </button>

          <div className="flex space-x-1">
            {!showAnswer && !currentTask.completed && (
              <button
                onClick={handleReveal}
                className="flex items-center px-2 py-1 text-blue-600"
              >
                <HelpCircle className="h-3 w-3 mr-0.5" />
                Hint
              </button>
            )}

            {!currentTask.completed && !showAnswer ? (
              <button
                onClick={handleSubmit}
                disabled={!userAnswer.trim() || isSubmitting}
                className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit
              </button>
            ) : !currentTask.completed && showAnswer ? (
              <button
                onClick={handleSubmit}
                className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Mark
              </button>
            ) : null}
          </div>

          <button
            onClick={handleNext}
            disabled={
              currentTaskIndex === tasks.length - 1 ||
              (!isDomainExpert && !tasks[currentTaskIndex].completed)
            }
            className="flex items-center px-2 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="h-3 w-3 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
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
                  Once you submit your answer, you won't be able to go back or
                  change it. Are you sure you want to proceed?
                </p>
              </div>
              <button
                onClick={handleCancelSubmit}
                className="flex-shrink-0 ml-1 text-gray-400 hover:text-gray-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCancelSubmit}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
