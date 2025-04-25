"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  NumberedSequence,
  GridMatching,
  MultipleSelect,
  QuizItem,
  Quiz,
} from "./quiz-types";
import { useCenterControl } from "@/contexts/center-control-context";
import React from "react";
import { TextInput } from "./quiz-types/TextInput";
import { useTaskStore } from "@/store/task-store";
import { loadDataFile } from "@/lib/data-storage";
import { NarrativeEvent, NarrativeMetadata } from "@/types/lite";
import { saveQuizResponse, saveTaskTiming } from "@/lib/firebase-operations";
import { useAuth } from "@/contexts/auth-context";

interface TaskPanelProps {
  events: NarrativeEvent[];
  metadata: NarrativeMetadata;
  className?: string;
  userRole?: "domain" | "normal";
  is_training?: boolean;
  sessionTimeLimit?: number; // Time limit in seconds
  quiz?: Quiz; // Add quiz prop to receive pre-loaded and ordered quiz items
}

export function TaskPanel({
  events,
  metadata,
  className = "",
  userRole = "normal",
  is_training = false,
  quiz, // Receive ordered quiz items
}: TaskPanelProps) {
  const router = useRouter();
  const { user, currentScenario } = useAuth(); // Add auth context
  const {
    markedEventIds,
    toggleMarkedEvent,
    setfocusedEventId,
    clearMarkedEvents,
    selectedScenario,
  } = useCenterControl();
  const [tasks, setTasks] = useState<QuizItem[]>([]);
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
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showTimeWarningModal, setShowTimeWarningModal] = useState(false);
  const [showIncorrectAnswerModal, setShowIncorrectAnswerModal] =
    useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasCalledTimeUp = useRef(false);
  const warningShownRef = useRef(false);
  const setCurrentTask = useTaskStore((state) => state.setCurrentTask);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(true);

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
    return scenarioName || "text-visual";
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
          return;
        }

        // Get progress and skip to last completed task + 1
        const progress = getTaskProgress(user.id);
        if (progress && progress.answers && !is_training) {
          const lastCompletedIndex = progress.answers.reduce(
            (maxIndex, answer, currentIndex) => {
              return answer.completed ? currentIndex : maxIndex;
            },
            -1
          );

          // Skip to the next uncompleted task
          if (
            lastCompletedIndex >= 0 &&
            lastCompletedIndex < tasks.length - 1
          ) {
            setCurrentTaskIndex(lastCompletedIndex + 1);
          }
        }
      } catch (error) {
        console.error("Failed to parse stored user:", error);
      }
    }
  }, [userRole, is_training, tasks.length, router, metadata]);

  // Generate tasks based on mode (training/real) and available data
  useEffect(() => {
    setIsLoadingQuiz(true);
    let mounted = true; // Prevent state update on unmounted component

    const processQuizData = (quizData: any, isRecall = false): QuizItem[] => {
      if (!quizData || !Array.isArray(quizData)) return [];
      return quizData.map((q: any, index: number) => {
        let defaultTimeLimit = 60;
        if (q.type === "grid-matching") defaultTimeLimit = 180;
        else if (q.type === "numbered-sequence") defaultTimeLimit = 120;
        else if (q.type === "multiple-select") defaultTimeLimit = 90;

        const uniqueId = isRecall
          ? q.id
            ? `recall_${q.id}`
            : `recall_${index + 1}`
          : q.id || String(index + 1);

        return {
          id: uniqueId,
          level: q.level || "Information Retrieval",
          question: q.question,
          answer: q.answer,
          type: q.type || "single-input",
          options: q.options,
          event_reference: q.event_reference || null,
          timeLimit: q.timeLimit || defaultTimeLimit,
          completed: false,
          visual: q.visual || null,
          prone: q.prone || null,
        } as QuizItem;
      });
    };

    const sortTasks = (
      tasksToSort: QuizItem[],
      preference?: string
    ): QuizItem[] => {
      if (!preference || preference === "default") {
        return tasksToSort; // Default order
      }
      // Implement other sorting logic based on preference string if needed
      // e.g., reverse, shuffle, specific order based on IDs in preference string
      if (preference === "reverse") {
        return [...tasksToSort].reverse();
      }
      // Add more sorting strategies as required
      console.warn(`Unsupported quiz_order_preference: ${preference}`);
      return tasksToSort;
    };

    const loadTasks = async () => {
      let finalTasks: QuizItem[] = [];
      let loadingError: Error | null = null;

      try {
        // Check if quiz data was passed as prop (already ordered by server)
        if (quiz && quiz.quiz && Array.isArray(quiz.quiz)) {
          console.log("[TaskPanel Quiz] Using pre-loaded quiz data from props");
          finalTasks = processQuizData(quiz.quiz);

          if (!finalTasks || finalTasks.length === 0) {
            console.warn(
              "[TaskPanel Quiz] Quiz prop provided but yielded no tasks."
            );
          }
        }
        // If no quiz prop is provided, fall back to old behavior
        else if (is_training) {
          // --- Training Mode (Load from train_quiz_data.json) ---
          console.log("[TaskPanel Quiz] Mode: Training");
          console.log(
            "[TaskPanel Quiz] Attempting to load: train_quiz_data.json"
          );
          const trainingData = await loadDataFile<{ quiz: any[] }>(
            "train_quiz_data.json"
          );
          // console.log("[TaskPanel Quiz] Loaded training data:", trainingData);
          finalTasks = processQuizData(trainingData?.quiz);
          if (!finalTasks || finalTasks.length === 0) {
            console.warn(
              "[TaskPanel Quiz] Training quiz file loaded but yielded no tasks."
            );
          }
        } else {
          // --- Real Task Mode (Load from public/quiz_data.json first) ---
          console.log("[TaskPanel Quiz] Mode: Real Task");
          console.log(
            "[TaskPanel Quiz] Attempting to load primary: public/quiz_data.json"
          );
          try {
            const publicQuizData = await loadDataFile<{
              quiz: any[];
              quiz_recall?: any[];
            }>("quiz_data.json");
            // console.log(
            //   "[TaskPanel Quiz] Loaded primary quiz data:",
            //   publicQuizData
            // );
            let combinedTasks = processQuizData(publicQuizData?.quiz);
            if (
              publicQuizData?.quiz_recall &&
              Array.isArray(publicQuizData.quiz_recall)
            ) {
              const recallTasks = processQuizData(
                publicQuizData.quiz_recall,
                true
              );
              combinedTasks.unshift(...recallTasks);
            }
            // console.log(
            //   "[TaskPanel Quiz] Combined tasks from public file (before sort):",
            //   combinedTasks
            // );
            // Apply default sorting (or potentially a preference if needed)
            finalTasks = sortTasks(
              combinedTasks,
              metadata?.quiz_order_preference || "default"
            );
            // console.log(
            //   `[TaskPanel Quiz] Sorting preference applied: ${
            //     metadata?.quiz_order_preference || "default"
            //   }`
            // );
            if (!finalTasks || finalTasks.length === 0) {
              console.warn(
                "[TaskPanel Quiz] public/quiz_data.json loaded but yielded no tasks. Will attempt fallback generation."
              );
            }
          } catch (publicLoadError) {
            console.error(
              "[TaskPanel Quiz] Failed to load public/quiz_data.json. Will attempt fallback generation.",
              publicLoadError
            );
            // Don't set finalTasks here, let the fallback handle it.
          }
        }

        // --- Fallback to Auto-Generation (Only for Real Task Mode if primary load failed/yielded no tasks) ---
        if (!is_training && (!finalTasks || finalTasks.length === 0)) {
          // console.log("[TaskPanel Quiz] Fallback: Auto-generating tasks based on events.");
          if (events && events.length > 0) {
            finalTasks = [
              {
                id: "gen-1",
                level: "Information Retrieval",
                type: "single-input",
                question: "What was the date of the first major event?",
                answer: (() => {
                  const timeValue = events[0].temporal_anchoring?.real_time;
                  let dateInput: string | number | Date = "";
                  if (Array.isArray(timeValue)) {
                    dateInput = timeValue[0]; // Use start date of range
                  } else if (timeValue) {
                    dateInput = timeValue;
                  }
                  try {
                    return new Date(dateInput).toLocaleDateString();
                  } catch {
                    return "Invalid Date"; // Fallback if parsing fails
                  }
                })(),
                completed: false,
                timeLimit: 60,
                visual: null,
                event_reference: null,
                prone: null,
              },
              {
                id: "gen-2",
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
                timeLimit: 60,
                visual: null,
                event_reference: null,
                prone: null,
              },
              // Add more generated questions if needed
            ] as QuizItem[];
            // console.log("[TaskPanel Quiz] Generated fallback tasks:", finalTasks);
          } else {
            // console.warn("[TaskPanel Quiz] Fallback generation failed: No events data available.");
            finalTasks = [];
          }
        }

        // Ensure unique IDs after combining/sorting/generating
        const seenIds = new Set<string>();
        finalTasks.forEach((task, index) => {
          if (seenIds.has(task.id)) {
            task.id = `${task.id}_dup_${index}`;
          }
          seenIds.add(task.id);
        });

        // console.log("[TaskPanel Quiz] Final processed tasks (before setting state):", finalTasks);

        if (mounted) {
          setTasks(finalTasks);
        }
      } catch (err) {
        // Catch general errors during processing (outside specific file loads)
        console.error(
          "[TaskPanel Quiz] General error during task loading:",
          err
        );
        loadingError = err instanceof Error ? err : new Error(String(err));
        if (mounted) {
          setTasks([]);
        }
      } finally {
        if (mounted) {
          setIsLoadingQuiz(false);
          // Optionally set a specific quiz error state if needed
          // setQuizError(loadingError);
        }
      }
    };

    loadTasks();

    return () => {
      mounted = false; // Cleanup function to prevent state updates
    };
  }, [
    is_training,
    events,
    metadata,
    setTasks,
    quiz, // add quiz to the dependency array so it updates if it changes
  ]);

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

  // Update current task in store when task index changes
  useEffect(() => {
    if (currentTask) {
      setCurrentTask(currentTask);
    }
  }, [currentTask, setCurrentTask]);

  // Function to start/reset the timer for the current question
  const resetQuestionTimer = useCallback(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Don't set a timer if there's no current task or no time limit
    if (!currentTask || !currentTask.timeLimit) {
      setTimeLeft(null);
      return;
    }

    // Reset the time left to the current question's time limit
    setTimeLeft(currentTask.timeLimit);
    hasCalledTimeUp.current = false;
    warningShownRef.current = false; // Reset warning flag for new task

    // Start a new timer
    startTimer();
  }, [currentTask]);

  // Function to start the timer
  const startTimer = useCallback(() => {
    // Don't start a new timer if there's already one running
    if (timerRef.current) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;

        // For domain users, simply count down without triggering warnings or actions
        if (userRole === "domain") {
          if (prev <= 1) {
            // Just stop at 0 without triggering actions
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        }

        // Regular timer behavior for non-domain users
        if (prev === 20 && !warningShownRef.current) {
          warningShownRef.current = true; // Mark warning as shown for this task
          setShowTimeWarningModal(true);
          // Pause the timer by clearing the interval
          clearInterval(timerRef.current as NodeJS.Timeout);
          timerRef.current = null;
          return prev;
        }

        if (prev <= 1) {
          // Clear the interval immediately to prevent multiple calls
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }

          // Ensure we only call onTimeUp once
          if (!hasCalledTimeUp.current) {
            hasCalledTimeUp.current = true;
            handleTimeUp();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [userRole]);

  // Reset timer when current task changes
  useEffect(() => {
    resetQuestionTimer();

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentTaskIndex, tasks, resetQuestionTimer]);

  // Function to resume the timer after the warning (starting from 19 seconds to avoid re-triggering)
  const resumeTimer = useCallback(() => {
    // Don't start a new timer if there's already one running
    if (timerRef.current) return;

    // Set to 19 seconds (just below the warning threshold of 20) to avoid re-triggering the warning
    if (timeLeft === 20) {
      setTimeLeft(19);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;

        // For domain users, just count down without triggering actions
        if (userRole === "domain") {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        }

        // For non-domain users, regular behavior with auto-submission
        if (prev <= 1) {
          // Clear the interval immediately to prevent multiple calls
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }

          // Ensure we only call onTimeUp once
          if (!hasCalledTimeUp.current) {
            hasCalledTimeUp.current = true;
            handleTimeUp();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [timeLeft, userRole]);

  // Function to handle closing the time warning modal
  const handleCloseTimeWarning = useCallback(() => {
    setShowTimeWarningModal(false);
    // Resume the timer with the special function to avoid re-triggering
    resumeTimer();
  }, [resumeTimer]);

  // Function to handle when question time is up (only for non-domain users)
  const handleTimeUp = () => {
    if (currentTask && !currentTask.completed && userRole !== "domain") {
      // Auto-submit the answer when time is up (only for non-domain users)
      processSubmission(false, true);
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "--:--";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Get color for the timer based on time remaining (modify to be less alarming for domain users)
  const getTimerColor = () => {
    if (timeLeft === null || !currentTask?.timeLimit)
      return "bg-gray-50 text-gray-600 border-gray-200";

    // For domain users, use a more subtle color scheme without animation
    if (userRole === "domain") {
      if (timeLeft <= 20) {
        return "bg-blue-50 text-blue-700 border-blue-200";
      }
      return "bg-blue-50 text-blue-600 border-blue-100";
    }

    // Regular color scheme for non-domain users
    if (timeLeft <= 20) {
      return "bg-red-50 text-red-600 border-red-200 animate-pulse";
    }
    if (timeLeft <= currentTask.timeLimit / 2) {
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    }
    return "bg-blue-50 text-blue-600 border-blue-100";
  };

  const handlePrevious = () => {
    if (currentTaskIndex > 0) {
      // Clear all marked events when moving to a different task
      clearMarkedEvents();

      setCurrentTaskIndex(currentTaskIndex - 1);
      setShowAnswer(false);
      setUserAnswer(tasks[currentTaskIndex - 1].userAnswer || "");
    }
  };

  const handleNext = () => {
    if (currentTaskIndex < tasks.length - 1) {
      // Clear all marked events when moving to a different task
      clearMarkedEvents();

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
    setShowAnswer((prev) => !prev); // Toggle the answer visibility
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

  const processSubmission = (isSkipped = false, isQuestionTimeUp = false) => {
    if (!currentTask) return;

    // For training mode, check if the answer is correct before proceeding
    if (is_training && !isSkipped && !isQuestionTimeUp) {
      const isCorrect = checkAnswer(currentTask, userAnswer);
      if (!isCorrect) {
        // Show the incorrect answer modal with the correct answer for training
        setShowIncorrectAnswerModal(true);
        return;
      }
    }

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
          : isQuestionTimeUp && !userAnswer.trim()
          ? "Time expired before answer was submitted"
          : userAnswer,
        userEventReference:
          markedEventIds.length > 0 ? [...markedEventIds] : null,
        submitTimestamp: Date.now(),
      };

      setTasks(updatedTasks);

      // Save to Firebase if we have a userId
      if (userId) {
        try {
          // Get the unique session ID from user object
          const storedUser = localStorage.getItem("user");
          let uniqueSessionId = "";

          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              uniqueSessionId = parsedUser.sessionId || userId;
            } catch (e) {
              console.error("Error parsing stored user:", e);
              uniqueSessionId = userId; // Fallback to userId if parsing fails
            }
          } else {
            uniqueSessionId = userId; // Fallback to userId if no stored user
          }

          // Save task timing
          saveTaskTiming(userId, uniqueSessionId, {
            taskId: currentTask.id,
            isTraining: is_training,
            startTime: currentTask.startTimestamp || Date.now(),
            endTime: Date.now(),
            totalTime: Math.round(
              (Date.now() - (currentTask.startTimestamp || Date.now())) / 1000
            ),
          });

          // Save quiz response with enhanced data
          saveQuizResponse(
            userId,
            uniqueSessionId, // Using unique session ID
            {
              question: currentTask.question,
              userAnswer: updatedTasks[taskIndex].userAnswer || "",
              markedEvents: markedEventIds,
              isSkipped,
              isTimeUp: isQuestionTimeUp,
              isTraining: is_training,
              taskId: currentTask.id,
              startTime: currentTask.startTimestamp || Date.now(),
              endTime: Date.now(),
            }
          );
        } catch (error) {
          console.error("Failed to save task data to Firebase:", error);
        }
      }

      // Update progress in localStorage if we have a userId and not in training mode
      if (userId && !is_training) {
        const completedCount = updatedTasks.filter((t) => t.completed).length;

        updateTaskProgress(userId, {
          totalTasks: tasks.length,
          completedTasks: completedCount,
          correctTasks: 0,
          totalSessionTime: timeLeft ? timeLeft : 0,
          studyType:
            metadata?.studyType ||
            getStudyTypeFromPath(window.location.pathname),
          answers: updatedTasks.map((task) => ({
            questionId: task.id,
            question: task.question,
            userAnswer: task.userAnswer || "",
            userEventReference: task.userEventReference || null,
            completed: task.completed,
            startTimestamp: task.startTimestamp,
            submitTimestamp: task.submitTimestamp,
            isTimeExpired:
              task.id === currentTask.id ? isQuestionTimeUp : false,
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
          // Determine the scenario ID from multiple sources in order of reliability:
          // 1. User's default scenario from auth context
          // 2. Selected scenario from center control context
          // 3. Parse from current URL
          let scenarioId = "";

          // 1. First try to get it from user's default scenario (most reliable)
          if (currentScenario) {
            scenarioId = currentScenario.replace("text-visual-", "");
            console.log(`Using user's default scenario: ${currentScenario}`);
          }
          // 2. Then try selected scenario from center control
          else if (selectedScenario) {
            scenarioId = selectedScenario.replace("text-visual-", "");
            console.log(`Using selected scenario: ${selectedScenario}`);
          }
          // 3. Finally fall back to URL parsing
          else {
            const pathParts = window.location.pathname.split("/");
            // The ID should be the third part in /text-visual/{id}/training
            if (pathParts.length >= 3) {
              scenarioId = pathParts[2];
              console.log(`Extracted scenario ID from URL: ${scenarioId}`);
            }
          }

          // Ensure we have a valid scenario ID
          if (!scenarioId) {
            console.warn(
              "Could not determine scenario ID, using default scenario 1"
            );
            scenarioId = "1"; // Default to scenario 1 if all else fails
          }

          // Construct the path to the main scenario
          const mainPath = `/text-visual/${scenarioId}`;
          console.log(`Training complete, redirecting to: ${mainPath}`);

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
          // Move to next task (which will also clear marked events)
          if (currentTaskIndex < tasks.length - 1) {
            setCurrentTaskIndex(currentTaskIndex + 1);
            setShowAnswer(false);
            setUserAnswer(tasks[currentTaskIndex + 1].userAnswer || "");
            // Clear marked events
            clearMarkedEvents();
          }

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
      totalSessionTime: timeLeft ? timeLeft : 0,
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
    router.push(
      `/completion?total=${tasks.length}&type=${studyType}&time=${
        timeLeft ? timeLeft : 0
      }`
    );
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
    toggleMarkedEvent(eventId);
  };

  // Add this function to focus on a specific event
  const handleFocusEvent = (eventId: number) => {
    setfocusedEventId(eventId);
  };

  // Add this function to render event references as clickable links
  const renderEventReferences = (eventRef: number | number[] | null) => {
    if (!eventRef) return null;

    const refs = Array.isArray(eventRef) ? eventRef : [eventRef];
    return refs.map((id, index) => (
      <React.Fragment key={`event-${id}`}>
        {index > 0 && ", "}
        <button
          onClick={() => handleFocusEvent(id)}
          className="text-blue-600 hover:underline font-medium px-1 py-0.5 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
        >
          [Event #{id}]
        </button>
      </React.Fragment>
    ));
  };

  // Function to check if the submit button should be disabled
  const isSubmitDisabled = () => {
    if (!currentTask || isSubmitting) return true;
    if (currentTask.completed) return true;
    if (showAnswer) return false;

    // For skipped questions or time expired questions
    if (
      userAnswer === "Information not specified in the text" ||
      userAnswer === "Time expired before answer was submitted"
    ) {
      return false;
    }

    // For any type of answer
    return !userAnswer.trim() || markedEventIds.length === 0;
  };

  // Add helper function to check answers
  const checkAnswer = (task: QuizItem, answer: string): boolean => {
    if (!answer.trim()) return false;

    // Helper function to normalize strings for comparison
    const normalize = (str: string) =>
      str.toLowerCase().trim().replace(/\s+/g, " ");

    switch (task.type) {
      case "radio-options": {
        // For radio options, do a normalized string comparison
        const normalizedCorrect = normalize(task.answer);
        const normalizedUser = normalize(answer);
        return normalizedCorrect === normalizedUser;
      }

      case "multiple-select": {
        // Split by comma, normalize each item, and sort for consistent comparison
        const normalizeAndSort = (str: string) =>
          str
            .split(",")
            .map((item) => normalize(item))
            .filter(Boolean)
            .sort();

        const correctItems = normalizeAndSort(task.answer);
        const userItems = normalizeAndSort(answer);

        if (correctItems.length !== userItems.length) return false;

        return correctItems.every((item, index) => item === userItems[index]);
      }

      case "numbered-sequence": {
        // Remove all spaces and compare directly since it's just numbers
        const cleanCorrect = task.answer.replace(/\s+/g, "");
        const cleanUser = answer.replace(/\s+/g, "");
        return cleanCorrect === cleanUser;
      }

      case "grid-matching": {
        try {
          // For grid matching with format "Key: Value, Key2: Value2"
          const parseGridString = (str: string) => {
            const pairs = str.split(",").map((pair) => pair.trim());
            return pairs.reduce((acc, pair) => {
              const [key, value] = pair.split(":").map((s) => normalize(s));
              acc[key] = value;
              return acc;
            }, {} as Record<string, string>);
          };

          // If the answer is already in JSON format, try parsing it
          try {
            const correctGrid = JSON.parse(task.answer);
            const userGrid = JSON.parse(answer);
            return JSON.stringify(correctGrid) === JSON.stringify(userGrid);
          } catch {
            // If JSON parsing fails, try the string format
            const correctPairs = parseGridString(task.answer);
            const userPairs = parseGridString(answer);

            const correctKeys = Object.keys(correctPairs).sort();
            const userKeys = Object.keys(userPairs).sort();

            if (correctKeys.length !== userKeys.length) return false;

            return correctKeys.every(
              (key) => correctPairs[key] === userPairs[key]
            );
          }
        } catch {
          return false;
        }
      }

      default: {
        // For single-input text and any other types
        const unknownTask = task as { answer: unknown };
        if (typeof unknownTask.answer === "string") {
          return normalize(unknownTask.answer) === normalize(answer);
        }
        return false;
      }
    }
  };

  if (isLoadingQuiz) {
    return (
      <div className={`flex flex-col h-full bg-white p-2 ${className}`}>
        <h2 className="text-sm font-semibold mb-2">Tasks</h2>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-gray-500">Loading quiz questions...</p>
        </div>
      </div>
    );
  }

  if (!currentTask && !isLoadingQuiz) {
    return (
      <div className={`flex flex-col h-full bg-white p-2 ${className}`}>
        <h2 className="text-sm font-semibold mb-2">Tasks</h2>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-gray-500">
            No tasks available or failed to load.
          </p>
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

        {/* Enhanced Question Timer in Header */}
        {!is_training && (
          <div className="flex-grow flex justify-center items-center">
            <div
              className={`flex items-center px-4 py-2 rounded-lg border shadow-sm ${getTimerColor()}`}
            >
              <div className="flex flex-col items-center">
                <div className="flex items-center">
                  {timeLeft !== null && timeLeft <= 20 ? (
                    <AlertCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <Timer className="h-4 w-4 mr-2" />
                  )}
                  <span className="text-sm font-bold">
                    {formatTime(timeLeft)}
                  </span>
                </div>
                <span className="text-xs mt-0.5">
                  Question {currentTaskIndex + 1} Timer
                </span>
              </div>
            </div>
          </div>
        )}

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
            {/* Question card and answer components */}
            <div className="space-y-4">
              {/* Question header with cognitive level and tips */}
              <div className="bg-white border rounded-lg overflow-hidden">
                {/* Cognitive level badge */}
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

                {/* Question number and text */}
                <div className="p-3">
                  <div className="flex flex-col">
                    <div className="text-xs text-gray-500 mb-1.5">
                      Question {currentTaskIndex + 1}:
                    </div>
                    <div className="text-normal font-medium text-gray-900">
                      {currentTask.question}
                    </div>
                  </div>
                </div>

                {/* Tips and hints section */}
                <div className="px-3 pb-3">
                  <div className="space-y-2">
                    {/* General warning about using only provided text */}
                    <div className="bg-red-50 border border-red-200 rounded-md p-2.5">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-3.5 w-3.5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-red-800">
                          Please answer based ONLY on the text you have read,
                          not your prior knowledge. Some details may differ from
                          real-world events.
                        </div>
                      </div>
                    </div>

                    {/* Information Not Found tip */}
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-2.5">
                      <div className="flex items-start gap-2">
                        <HelpCircle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-800">
                          Tip: If you cannot find the specific information in
                          the text, use the "Information Not Found" button below
                          to skip this question.
                        </div>
                      </div>
                    </div>

                    {/* Event selection requirement */}
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-2.5">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-3.5 w-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-blue-800">
                          <span className="font-medium">Required:</span> You
                          must select the event that contains the information
                          supporting your answer. This helps us understand how
                          you arrived at your response.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Answer options */}
              <div className="bg-white border rounded-lg p-3">
                <div className="space-y-4">
                  {/* Step 1: Event Selection */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                        1
                      </div>
                      <h3 className="text-sm font-medium text-gray-900">
                        Mark Reference Events
                      </h3>
                    </div>
                    <div className="bg-blue-50 rounded-md p-3 border border-blue-200">
                      <div className="text-xs text-blue-700 mb-2">
                        Right-click on the events that contain the information
                        for your answer to mark them.
                      </div>
                      {/* Show correct reference events when answer is revealed */}
                      {isDomainExpert &&
                        showAnswer &&
                        currentTask.event_reference && (
                          <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-md">
                            <div className="text-xs font-medium text-green-800 mb-1">
                              Correct Reference Events:
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {(Array.isArray(currentTask.event_reference)
                                ? currentTask.event_reference
                                : [currentTask.event_reference]
                              ).map((eventId) => (
                                <div
                                  key={`correct-${eventId}`}
                                  className="flex items-center gap-1 text-xs text-green-600 bg-white px-3 py-1.5 rounded-md border border-green-300 cursor-pointer hover:bg-green-50"
                                  onClick={() => handleFocusEvent(eventId)}
                                >
                                  <span>Event #{eventId}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      {/* User's marked events */}
                      <div className="flex flex-wrap gap-2">
                        {markedEventIds.length === 0 ? (
                          <div className="text-xs text-gray-500 bg-white px-3 py-1.5 rounded-md border border-gray-200">
                            No events marked yet
                          </div>
                        ) : (
                          markedEventIds.map((eventId) => (
                            <div
                              key={eventId}
                              className="flex items-center gap-1 text-xs text-blue-600 bg-white px-3 py-1.5 rounded-md border border-blue-300 cursor-pointer hover:bg-blue-50"
                              onClick={() => handleFocusEvent(eventId)}
                            >
                              <span>Event #{eventId}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMarkedEvent(eventId);
                                }}
                                className="ml-2 text-blue-400 hover:text-blue-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Answer Input */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                        2
                      </div>
                      <h3 className="text-sm font-medium text-gray-900">
                        Provide Your Answer
                      </h3>
                    </div>
                    {!currentTask.completed ? (
                      <div>
                        {/* Show correct answer in the same format as the input */}
                        {isDomainExpert && showAnswer && (
                          <div className="mb-4">
                            {(() => {
                              switch (currentTask.type) {
                                case "radio-options":
                                  return (
                                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                                      <div className="text-xs font-medium text-green-800 mb-2">
                                        Correct Answer:
                                      </div>
                                      <RadioOptions
                                        options={
                                          currentTask.options as string[]
                                        }
                                        value={currentTask.answer}
                                        onChange={() => {}}
                                        disabled={true}
                                        correctAnswer={currentTask.answer}
                                      />
                                    </div>
                                  );
                                case "multiple-select":
                                  return (
                                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                                      <div className="text-xs font-medium text-green-800 mb-2">
                                        Correct Answer:
                                      </div>
                                      <MultipleSelect
                                        options={
                                          currentTask.options as string[]
                                        }
                                        value={currentTask.answer}
                                        onChange={() => {}}
                                        disabled={true}
                                        correctAnswer={currentTask.answer}
                                      />
                                    </div>
                                  );
                                case "numbered-sequence":
                                  return (
                                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                                      <div className="text-xs font-medium text-green-800 mb-2">
                                        Correct Answer:
                                      </div>
                                      <NumberedSequence
                                        options={currentTask.options as any}
                                        value={currentTask.answer}
                                        onChange={() => {}}
                                        disabled={true}
                                        correctAnswer={currentTask.answer}
                                      />
                                    </div>
                                  );
                                case "grid-matching":
                                  return (
                                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                                      <div className="text-xs font-medium text-green-800 mb-2">
                                        Correct Answer:
                                      </div>
                                      <GridMatching
                                        options={currentTask.options as any}
                                        value={currentTask.answer}
                                        onChange={() => {}}
                                        disabled={true}
                                        correctAnswer={currentTask.answer}
                                      />
                                    </div>
                                  );
                                default:
                                  return (
                                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                                      <div className="text-xs font-medium text-green-800 mb-2">
                                        Correct Answer:
                                      </div>
                                      <TextInput
                                        value={(currentTask as QuizItem).answer}
                                        onChange={() => {}}
                                        disabled={true}
                                      />
                                    </div>
                                  );
                              }
                            })()}
                          </div>
                        )}

                        {/* Existing answer input components */}
                        {(() => {
                          switch (currentTask.type) {
                            case "radio-options":
                              return (
                                <RadioOptions
                                  options={currentTask.options}
                                  value={userAnswer}
                                  onChange={setUserAnswer}
                                  disabled={showAnswer}
                                  correctAnswer={
                                    showAnswer ? currentTask.answer : undefined
                                  }
                                />
                              );
                            case "multiple-select":
                              return (
                                <MultipleSelect
                                  options={currentTask.options}
                                  value={userAnswer}
                                  onChange={setUserAnswer}
                                  disabled={showAnswer}
                                  correctAnswer={
                                    showAnswer ? currentTask.answer : undefined
                                  }
                                />
                              );
                            case "numbered-sequence":
                              return (
                                <NumberedSequence
                                  options={currentTask.options}
                                  value={userAnswer}
                                  onChange={setUserAnswer}
                                  disabled={showAnswer}
                                  correctAnswer={
                                    showAnswer ? currentTask.answer : undefined
                                  }
                                />
                              );
                            case "grid-matching":
                              return (
                                <GridMatching
                                  options={currentTask.options}
                                  value={userAnswer}
                                  onChange={setUserAnswer}
                                  disabled={showAnswer}
                                  correctAnswer={
                                    showAnswer ? currentTask.answer : undefined
                                  }
                                />
                              );
                            default:
                              return (
                                <TextInput
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
                          {currentTask.userEventReference !== null && (
                            <p className="mt-0.5">
                              Reference Event:{" "}
                              {renderEventReferences(
                                currentTask.userEventReference || null
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Can't find information option */}
                  {!currentTask.completed && !showAnswer && (
                    <div className="border-t pt-4">
                      <div className="text-xs text-gray-500 mb-2">
                        Can't find the information in any event?
                      </div>
                      <button
                        onClick={handleSkip}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-amber-200 bg-amber-50 text-amber-700 rounded-md hover:bg-amber-100 hover:border-amber-300 transition-colors text-sm font-medium"
                      >
                        <HelpCircle className="h-4 w-4" />
                        Mark as "Information Not Found"
                      </button>
                    </div>
                  )}

                  {/* Warning if event not marked */}
                  {markedEventIds.length === 0 &&
                    userAnswer.trim() &&
                    !currentTask.completed && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <div className="text-xs text-blue-800">
                          Please mark one or more reference events before
                          submitting your answer, or mark as "Information Not
                          Found" if the information is not available.
                        </div>
                      </div>
                    )}
                </div>
              </div>
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
            {isDomainExpert && !currentTask.completed && (
              <button
                onClick={handleReveal}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors ${
                  showAnswer
                    ? "bg-blue-100 text-blue-700"
                    : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                }`}
              >
                <HelpCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {showAnswer ? "Hide Answer" : "Show Answer"}
                </span>
              </button>
            )}

            {!currentTask.completed && !showAnswer ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitDisabled()}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Submit</span>
              </button>
            ) : !currentTask.completed && showAnswer ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitDisabled()}
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
                  Confirm: Information Not Found
                </h3>
                <div className="text-xs text-gray-500 mt-1">
                  <p>
                    Are you sure this information is not specified in the text?
                  </p>
                  <p className="mt-1">Please confirm that you have:</p>
                  <ul className="mt-1 ml-4 list-disc">
                    <li>Carefully read through all available text</li>
                    <li>Checked all relevant events and references</li>
                    <li>
                      Found no clear answer based solely on the provided
                      information
                    </li>
                  </ul>
                </div>
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
                Go Back & Check Again
              </button>
              <button
                onClick={handleConfirmSkip}
                className="px-3 py-1.5 text-xs bg-amber-600 text-white rounded-md hover:bg-amber-700"
              >
                Confirm Not Found
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

      {/* Time Warning Modal */}
      {showTimeWarningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-4">
            <div className="flex items-start mb-3">
              <div className="flex-shrink-0 mr-3">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">
                  Time Warning
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  You have only 20 seconds remaining.
                </p>
              </div>
              <button
                onClick={handleCloseTimeWarning}
                className="flex-shrink-0 ml-1 text-gray-400 hover:text-gray-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCloseTimeWarning}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incorrect Answer Modal for Training Mode */}
      {showIncorrectAnswerModal && (
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
                {/* Show the correct answer in training mode */}
                <div className="mt-3 p-2 bg-blue-50 rounded-md">
                  <p className="text-xs font-medium text-blue-800">
                    Correct Answer:
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {currentTask?.answer}
                  </p>
                </div>
                <ul className="text-xs text-gray-500 mt-3 list-disc ml-4">
                  <li>Read all events thoroughly</li>
                  <li>Mark the relevant events that contain the answer</li>
                  <li>Double-check your answer before submitting</li>
                </ul>
              </div>
              <button
                onClick={() => setShowIncorrectAnswerModal(false)}
                className="flex-shrink-0 ml-1 text-gray-400 hover:text-gray-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowIncorrectAnswerModal(false)}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
