"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  X,
  Brain,
  Timer,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  saveTaskProgress,
  updateTaskProgress,
  markTaskAsCompleted,
  hasCompletedTasks,
  getTaskProgress,
} from "@/lib/task-progress";
import {
  RadioOptions,
  SingleInput,
  CommaSeparated,
  NumberedSequence,
  GridMatching,
  LongText,
  MultipleSelect,
} from "./quiz-types";
import { useCenterControl } from "@/contexts/center-control-context";
import React from "react";

interface Task {
  id: string;
  level?: string;
  question: string;
  answer: string;
  completed: boolean;
  userAnswer?: string;
  startTimestamp?: number;
  submitTimestamp?: number;
  event_reference?: number | number[] | null;
  type?:
    | "radio-options"
    | "single-input"
    | "comma-separated"
    | "numbered-sequence"
    | "grid-matching"
    | "long-text"
    | "multiple-select";
  options?:
    | string[]
    | {
        events?: Array<{ id: number; text: string }>;
        countries?: string[];
        roles?: string[];
        causes?: string[];
        effects?: string[];
      };
}

interface TaskPanelProps {
  events: any[];
  metadata?: any;
  className?: string;
  userRole?: "domain" | "normal";
  is_training?: boolean;
}

export function TaskPanel({
  events,
  metadata = {},
  className = "",
  userRole = "normal",
  is_training = false,
}: TaskPanelProps) {
  const router = useRouter();
  const { setSelectedEventId } = useCenterControl();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSkipConfirmModal, setShowSkipConfirmModal] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [showTrainingCompleteModal, setShowTrainingCompleteModal] =
    useState(false);
  const [pendingRedirectPath, setPendingRedirectPath] = useState("");

  const isDomainExpert = userRole === "domain";

  // Helper function to get the studyType from the URL
  const getStudyTypeFromPath = (path: string) => {
    // Extract the scenario name from the path (first segment after /)
    const pathSegments = path.split("/").filter(Boolean);
    const scenarioName = pathSegments[0] || "";

    // Handle all four scenarios based on actual routes
    if (scenarioName.includes("mixed")) return "mixed";
    if (scenarioName.includes("pure-text")) return "pure-text";
    if (scenarioName.includes("text-chat")) return "text-chat";
    if (scenarioName.includes("text-visual")) return "text-visual";

    // Default fallback
    return scenarioName || "pure-text";
  };

  // Get user ID from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserId(user.id);

        // If normal user has already completed tasks and not in training mode, redirect to completion page
        if (
          userRole === "normal" &&
          hasCompletedTasks(user.id) &&
          !is_training
        ) {
          const studyType =
            metadata?.studyType ||
            getStudyTypeFromPath(window.location.pathname);
          router.push(`/completion?total=${tasks.length}&type=${studyType}`);
        }
      } catch (error) {
        console.error("Failed to parse stored user:", error);
      }
    }
  }, [userRole, is_training, tasks.length, router, metadata]);

  // Generate tasks based on events data or use quiz from metadata
  useEffect(() => {
    if (!events || events.length === 0) return;

    // For both training mode and regular mode, use quiz questions from metadata if available
    if (
      metadata?.quiz &&
      Array.isArray(metadata.quiz) &&
      metadata.quiz.length > 0
    ) {
      // Use quiz questions from metadata and ensure type is set
      const quizTasks: Task[] = metadata.quiz.map((q: any, index: number) => ({
        id: q.id || String(index + 1),
        level: q.level || "Information Retrieval",
        question: q.question,
        answer: q.answer,
        type: q.type || "single-input",
        options: q.options,
        event_reference: q.event_reference || null,
        completed: false,
      }));
      setTasks(quizTasks);
      return;
    }

    // If no quiz questions available in metadata, create auto-generated tasks
    const generatedTasks: Task[] = [
      {
        id: "1",
        level: "Information Retrieval",
        type: "single-input",
        question: "What was the date of the first major event?",
        answer: new Date(
          events[0].date || events[0].temporal_anchoring?.real_time || ""
        ).toLocaleDateString(),
        completed: false,
      },
      {
        id: "2",
        level: "Information Retrieval",
        type: "radio-options",
        question: "How many total events are in this dataset?",
        answer: events.length.toString(),
        options: [
          (events.length - 2).toString(),
          (events.length - 1).toString(),
          events.length.toString(),
          (events.length + 1).toString(),
        ],
        completed: false,
      },
      {
        id: "3",
        level: "Information Retrieval",
        type: "radio-options",
        question: "What is the main topic of this dataset?",
        answer: metadata?.topic || events[0].topic?.main_topic || "Conflict",
        options: [
          metadata?.topic || events[0].topic?.main_topic || "Conflict",
          "Politics",
          "Economics",
          "Technology",
        ],
        completed: false,
      },
      {
        id: "4",
        level: "Pattern Recognition",
        type: "numbered-sequence",
        question: "Arrange these events in chronological order:",
        answer: "1,2,3,4",
        options: events
          .slice(0, 4)
          .map(
            (event, index) =>
              `${index + 1}. ${event.short_text || event.text.slice(0, 100)}...`
          ),
        completed: false,
      },
      {
        id: "5",
        level: "Pattern Recognition",
        type: "grid-matching",
        question: "Match the entities with their roles in the events:",
        answer:
          events[0].entities
            ?.map((entity: any) => `${entity.name}: ${entity.social_role}`)
            .join(", ") || "",
        options: {
          roles: Array.from(
            new Set(
              events.flatMap(
                (event) =>
                  event.entities?.map((entity: any) => entity.social_role) || []
              )
            )
          ),
          causes: Array.from(
            new Set(
              events.flatMap(
                (event) =>
                  event.entities?.map((entity: any) => entity.name) || []
              )
            )
          ),
        },
        completed: false,
      },
    ];

    setTasks(generatedTasks);
  }, [events, metadata, is_training]);

  // Record start timestamp when current task changes
  useEffect(() => {
    if (
      tasks.length > 0 &&
      currentTaskIndex >= 0 &&
      currentTaskIndex < tasks.length
    ) {
      // Only set start timestamp if it doesn't already exist and task is not completed
      if (
        !tasks[currentTaskIndex].startTimestamp &&
        !tasks[currentTaskIndex].completed
      ) {
        const updatedTasks = [...tasks];
        updatedTasks[currentTaskIndex] = {
          ...updatedTasks[currentTaskIndex],
          startTimestamp: Date.now(),
        };
        setTasks(updatedTasks);
      }
    }
  }, [currentTaskIndex, tasks]);

  const currentTask = tasks[currentTaskIndex];

  const handlePrevious = () => {
    if (currentTaskIndex > 0) {
      setCurrentTaskIndex(currentTaskIndex - 1);
      setShowAnswer(false);
      setUserAnswer(tasks[currentTaskIndex - 1].userAnswer || "");
    }
  };

  const handleNext = () => {
    if (currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
      setShowAnswer(false);
      setUserAnswer(tasks[currentTaskIndex + 1].userAnswer || "");
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

  const handleSkip = () => {
    // Show confirmation modal before skipping
    if (!currentTask.completed) {
      setShowSkipConfirmModal(true);
    }
  };

  const handleConfirmSkip = () => {
    setShowSkipConfirmModal(false);

    // Set userAnswer to indicate information not in text
    setUserAnswer("Information not specified in the text");

    // Process submission with skipped status
    processSubmission(true);
  };

  const handleCancelSkip = () => {
    setShowSkipConfirmModal(false);
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

  const processSubmission = (isSkipped = false) => {
    if (!currentTask) return;

    setIsSubmitting(true);

    // Create a copy of the tasks array
    const updatedTasks = [...tasks];
    const taskIndex = updatedTasks.findIndex((t) => t.id === currentTask.id);

    if (taskIndex !== -1) {
      // Mark the task as completed and store the user's answer with submission timestamp
      updatedTasks[taskIndex] = {
        ...updatedTasks[taskIndex],
        completed: true,
        userAnswer: isSkipped
          ? "Information not specified in the text"
          : userAnswer,
        submitTimestamp: Date.now(),
      };

      setTasks(updatedTasks);

      // Update progress in localStorage if we have a userId and not in training mode
      if (userId && !is_training) {
        const completedCount = updatedTasks.filter((t) => t.completed).length;

        updateTaskProgress(userId, {
          totalTasks: tasks.length,
          completedTasks: completedCount,
          correctTasks: 0,
          studyType:
            metadata?.studyType ||
            getStudyTypeFromPath(window.location.pathname),
          answers: updatedTasks.map((task) => ({
            questionId: task.id,
            question: task.question,
            userAnswer: task.userAnswer || "",
            completed: task.completed,
            startTimestamp: task.startTimestamp,
            submitTimestamp: task.submitTimestamp,
            duration:
              task.submitTimestamp && task.startTimestamp
                ? task.submitTimestamp - task.startTimestamp
                : null,
          })),
        });
      }

      // Check if all tasks are completed
      const allCompleted = updatedTasks.every((task) => task.completed);

      if (allCompleted) {
        if (is_training) {
          // For training mode, set training completion in localStorage with scenario-specific key
          const scenarioPath = window.location.pathname.split("/")[1];
          localStorage.setItem(`hasCompletedTraining-${scenarioPath}`, "true");

          // Instead of immediate redirect, show confirmation modal
          const currentPath = window.location.pathname;
          const mainPath = currentPath.replace("/training", "");
          setPendingRedirectPath(mainPath);
          setShowTrainingCompleteModal(true);
        } else {
          // For regular mode, navigate to completion page
          setTimeout(() => {
            navigateToCompletionPage();
          }, 1000);
        }
      } else {
        // Otherwise, move to the next task after a short delay
        setTimeout(() => {
          handleNext();
          setUserAnswer("");
          setShowAnswer(false);
          setIsSubmitting(false);
        }, 1000);
      }
    }
  };

  const handleRestartTasks = () => {
    // Reset all tasks
    setTasks(
      tasks.map((task) => ({
        ...task,
        completed: false,
        userAnswer: undefined,
        startTimestamp: undefined,
        submitTimestamp: undefined,
      }))
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
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  // Function to navigate to completion page
  const navigateToCompletionPage = () => {
    if (!userId) return;

    const studyType =
      metadata?.studyType || getStudyTypeFromPath(window.location.pathname);

    // Save final progress to localStorage
    saveTaskProgress(userId, {
      totalTasks: tasks.length,
      completedTasks: tasks.filter((t) => t.completed).length,
      correctTasks: 0,
      studyType,
      isCompleted: true,
      answers: tasks.map((task) => ({
        questionId: task.id,
        question: task.question,
        userAnswer: task.userAnswer || "",
        completed: task.completed,
        startTimestamp: task.startTimestamp,
        submitTimestamp: task.submitTimestamp,
        duration:
          task.submitTimestamp && task.startTimestamp
            ? task.submitTimestamp - task.startTimestamp
            : null,
      })),
    });

    // For normal users, mark as completed
    if (userRole === "normal") {
      markTaskAsCompleted(userId);
    }

    console.log("Redirecting to completion page...");

    // Use router for navigation
    router.push(`/completion?total=${tasks.length}&type=${studyType}`);
  };

  // Function to handle training completion confirmation
  const handleConfirmTrainingComplete = () => {
    setShowTrainingCompleteModal(false);

    // Mark training as completed in localStorage for both completion and skipping
    if (is_training) {
      const scenarioPath = window.location.pathname.split("/")[1];
      localStorage.setItem(`hasCompletedTraining-${scenarioPath}`, "true");
    }

    // Redirect to the main task page
    if (pendingRedirectPath) {
      router.push(pendingRedirectPath);
    }
  };

  const handleCancelTrainingComplete = () => {
    setShowTrainingCompleteModal(false);
    // Reset the pending path
    setPendingRedirectPath("");
    // User can review the training or take more time
    setIsSubmitting(false);
  };

  // Function to handle training skip
  const handleSkipTraining = () => {
    const currentPath = window.location.pathname;
    const mainPath = currentPath.replace("/training", "");
    setPendingRedirectPath(mainPath);
    setShowTrainingCompleteModal(true);
  };

  // Add this new function to handle event reference clicks
  const handleEventReferenceClick = (eventId: number) => {
    setSelectedEventId(eventId);
  };

  // Add this function to render event references as clickable links
  const renderEventReferences = (eventRef: number | number[] | null) => {
    if (!eventRef) return null;

    const refs = Array.isArray(eventRef) ? eventRef : [eventRef];
    return refs.map((id, index) => (
      <React.Fragment key={`event-${id}`}>
        {index > 0 && ", "}
        <button
          onClick={() => handleEventReferenceClick(id)}
          className="text-blue-600 hover:underline font-medium px-1 py-0.5 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
        >
          [Event #{id}]
        </button>
      </React.Fragment>
    ));
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

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Fixed header with progress */}
      <div className="border-b p-2 flex flex-wrap items-center gap-2 bg-white sticky top-0 z-10">
        <div className="flex-grow">
          <div className="flex items-center">
            <h2 className="text-sm font-semibold">
              {is_training ? "Training Tasks" : "Tasks"}
            </h2>
            {is_training && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                Training
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {completedTasks} of {tasks.length} completed
          </div>
        </div>

        {/* Domain expert skip buttons */}
        {isDomainExpert && (
          <>
            {is_training ? (
              <button
                onClick={handleSkipTraining}
                className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 flex-shrink-0"
              >
                Skip Training
              </button>
            ) : (
              <button
                onClick={navigateToCompletionPage}
                className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 flex-shrink-0"
              >
                Skip to Completion
              </button>
            )}
          </>
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
                  ? "bg-green-500"
                  : "bg-gray-300"
              }`}
              title={`Question ${idx + 1}${
                task.completed ? " (Completed)" : ""
              }`}
            />
          ))}
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 flex flex-col min-h-full">
          {/* Question content */}
          <div className="flex-1">
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

            {/* Question card and answer components */}
            <div className="space-y-2">
              <div className="bg-gray-50 p-2 rounded text-sm">
                {currentTask.question}
                <div className="mt-2 space-y-1.5">
                  <div className="text-xs text-amber-600 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                    Please answer based ONLY on the text you have read, not your
                    prior knowledge. Some details may differ from real-world
                    events.
                  </div>
                  <div className="text-xs text-blue-600 flex items-center">
                    <HelpCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                    Tip: If you cannot find the specific information in the
                    text, use the "Skip" button.
                  </div>
                </div>
              </div>

              {/* Answer input section */}
              {!currentTask.completed ? (
                <div>
                  {(() => {
                    switch (currentTask.type) {
                      case "radio-options":
                        return (
                          <RadioOptions
                            options={currentTask.options as string[]}
                            value={userAnswer}
                            onChange={setUserAnswer}
                            disabled={showAnswer}
                          />
                        );
                      case "multiple-select":
                        return (
                          <MultipleSelect
                            options={currentTask.options as string[]}
                            value={userAnswer}
                            onChange={setUserAnswer}
                            disabled={showAnswer}
                          />
                        );
                      case "single-input":
                        return (
                          <SingleInput
                            value={userAnswer}
                            onChange={setUserAnswer}
                            disabled={showAnswer}
                          />
                        );
                      case "comma-separated":
                        return (
                          <CommaSeparated
                            value={userAnswer}
                            onChange={setUserAnswer}
                            disabled={showAnswer}
                          />
                        );
                      case "numbered-sequence":
                        return (
                          <NumberedSequence
                            options={
                              currentTask.type === "numbered-sequence" &&
                              currentTask.options &&
                              "events" in currentTask.options
                                ? (currentTask.options as {
                                    events: Array<{ id: number; text: string }>;
                                  })
                                : []
                            }
                            value={userAnswer}
                            onChange={setUserAnswer}
                            disabled={showAnswer}
                          />
                        );
                      case "grid-matching":
                        const options = currentTask.options as {
                          countries?: string[];
                          roles?: string[];
                          causes?: string[];
                          effects?: string[];
                          leftItems?: string[];
                          rightItems?: string[];
                          leftLabel?: string;
                          rightLabel?: string;
                        };

                        // If leftItems and rightItems are already provided, use them directly
                        if (options.leftItems && options.rightItems) {
                          return (
                            <GridMatching
                              options={{
                                leftItems: options.leftItems,
                                rightItems: options.rightItems,
                                leftLabel: options.leftLabel,
                                rightLabel: options.rightLabel,
                              }}
                              value={userAnswer}
                              onChange={setUserAnswer}
                              disabled={showAnswer}
                            />
                          );
                        }

                        // Otherwise, transform the options into the correct shape
                        let transformedOptions;
                        if (options.countries && options.roles) {
                          transformedOptions = {
                            leftItems: options.countries,
                            rightItems: options.roles,
                            leftLabel: "Countries",
                            rightLabel: "Roles",
                          };
                        } else if (options.causes && options.effects) {
                          transformedOptions = {
                            leftItems: options.causes,
                            rightItems: options.effects,
                            leftLabel: "Causes",
                            rightLabel: "Effects",
                          };
                        } else {
                          // Fallback to empty arrays if no valid options are provided
                          transformedOptions = {
                            leftItems: [],
                            rightItems: [],
                            leftLabel: "Items",
                            rightLabel: "Categories",
                          };
                        }

                        return (
                          <GridMatching
                            options={transformedOptions}
                            value={userAnswer}
                            onChange={setUserAnswer}
                            disabled={showAnswer}
                          />
                        );
                      case "long-text":
                        return (
                          <LongText
                            value={userAnswer}
                            onChange={setUserAnswer}
                            disabled={showAnswer}
                          />
                        );
                      default:
                        return (
                          <SingleInput
                            value={userAnswer}
                            onChange={setUserAnswer}
                            disabled={showAnswer}
                          />
                        );
                    }
                  })()}
                </div>
              ) : (
                <div className="p-2 rounded text-xs flex items-start bg-blue-50 text-blue-800">
                  <CheckCircle className="h-3 w-3 mr-1 flex-shrink-0 text-blue-500" />
                  <div>
                    <p className="font-medium">Answer Submitted</p>
                    <p className="mt-0.5">
                      Your answer: {currentTask.userAnswer}
                    </p>
                  </div>
                </div>
              )}

              {/* Answer reveal */}
              {showAnswer && (
                <div className="bg-blue-50 p-2 rounded text-xs overflow-auto max-h-40">
                  <div className="space-y-2">
                    <div>
                      <p className="font-medium text-blue-800">Answer:</p>
                      <p className="text-blue-700">{currentTask.answer}</p>
                    </div>
                    {currentTask.event_reference !== undefined &&
                      currentTask.event_reference !== null && (
                        <div className="border-t border-blue-200 pt-2">
                          <p className="text-blue-600">
                            <span className="font-medium">
                              Reference Event(s):
                            </span>{" "}
                            {renderEventReferences(currentTask.event_reference)}
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed bottom controls */}
      <div className="border-t bg-white sticky bottom-0 p-3 z-10">
        <div className="flex justify-between items-center gap-2">
          {/* Navigation buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              disabled={
                currentTaskIndex === 0 ||
                (!isDomainExpert && tasks[currentTaskIndex].completed)
              }
              className="p-2 rounded-full border border-gray-200 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 transition-colors"
              aria-label="Previous question"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>

            <button
              onClick={handleNext}
              disabled={
                currentTaskIndex === tasks.length - 1 ||
                (!isDomainExpert && !tasks[currentTaskIndex].completed)
              }
              className="p-2 rounded-full border border-gray-200 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 transition-colors"
              aria-label="Next question"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {!showAnswer && !currentTask.completed && isDomainExpert && (
              <button
                onClick={handleReveal}
                className="flex items-center gap-1.5 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Hint</span>
              </button>
            )}

            {!currentTask.completed && !showAnswer ? (
              <>
                <button
                  onClick={handleSkip}
                  className="flex items-center gap-1.5 px-4 py-2 border-2 border-amber-300 bg-amber-50 text-amber-700 rounded-md hover:bg-amber-100 hover:border-amber-400 transition-colors"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Skip</span>
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!userAnswer.trim() || isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Submit</span>
                </button>
              </>
            ) : !currentTask.completed && showAnswer ? (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Submit</span>
              </button>
            ) : null}
          </div>
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

      {/* Skip Confirmation Modal */}
      {showSkipConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-4">
            <div className="flex items-start mb-3">
              <div className="flex-shrink-0 mr-3">
                <AlertCircle className="h-5 w-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">
                  Confirm Skip
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Are you sure you want to skip this question? If the
                  information is not specified in the text or there is no single
                  correct answer based on the text, you should skip. Once
                  skipped, you won't be able to go back or change your answer.
                </p>
              </div>
              <button
                onClick={handleCancelSkip}
                className="flex-shrink-0 ml-1 text-gray-400 hover:text-gray-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCancelSkip}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSkip}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Yes, Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Training Complete/Skip Modal */}
      {showTrainingCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-4">
            <div className="flex items-start mb-3">
              <div className="flex-shrink-0 mr-3">
                <Timer className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">
                  {pendingRedirectPath
                    ? "Proceed to Real Task"
                    : "Training Complete"}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {pendingRedirectPath
                    ? "Are you sure you want to skip the training and proceed to the real task? Once you proceed, a timer will start and cannot be paused."
                    : "You've completed the training tasks! Once you proceed to the real task, a timer will start and cannot be paused. Make sure you're ready to complete the real task without interruptions."}
                </p>
              </div>
              <button
                onClick={handleCancelTrainingComplete}
                className="flex-shrink-0 ml-1 text-gray-400 hover:text-gray-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCancelTrainingComplete}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTrainingComplete}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                I'm Ready
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
