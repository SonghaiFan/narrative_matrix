"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { Quiz } from "./quiz-types/index";
import { useCenterControl } from "@/contexts/center-control-context";
import { useAuth } from "@/contexts/auth-context";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { NarrativeEvent, DatasetMetadata } from "@/types/data";

// Custom hooks
import { useQuestionTimer } from "@/hooks/useQuestionTimer";
import { useQuizLoader } from "@/hooks/useQuizLoader";
import { useTaskManager } from "@/hooks/useTaskManager";
import { useNavigationStore } from "@/store/navigation-store";

// Sub-components
import { TaskHeader } from "./task-header";
import { TaskQuestionArea } from "./task-question-area";
import { TaskAnswerInput } from "./task-answer-input";
import { TaskFooter } from "./task-footer";

// Modals
import { ConfirmSubmitModal } from "./modals/confirm-submit-modal";
import { SkipConfirmModal } from "./modals/skip-confirm-modal";
import { TrainingCompleteModal } from "./modals/training-complete-modal";
import { TimeWarningModal } from "./modals/time-warning-modal";
import { IncorrectAnswerModal } from "./modals/incorrect-answer-modal";

interface TaskPanelProps {
  events: NarrativeEvent[] | undefined;
  metadata: DatasetMetadata | undefined;
  className?: string;
  userRole?: "domain" | "normal";
  is_training?: boolean;
  quiz?: Quiz; // Pre-loaded and ordered quiz items
  onComplete?: () => void;
}

export function TaskPanel({
  events,
  metadata,
  className = "",
  userRole = "normal",
  is_training = false,
  quiz: passedInQuiz,
  onComplete,
}: TaskPanelProps) {
  const router = useRouter();
  const { userId, scenarioId, role } = useAuth();
  const {
    toggleMarkedEvent,
    setfocusedEventId,
    markedEventIds,
    selectedScenario: contextSelectedScenario,
  } = useCenterControl();

  // Add navigation store hooks
  const { goToNextStage, completeCurrentStage } = useNavigationStore();

  // --- State for Modals ---
  const [showConfirmSubmitModal, setShowConfirmSubmitModal] = useState(false);
  const [showSkipConfirmModal, setShowSkipConfirmModal] = useState(false);
  const [showTrainingCompleteModal, setShowTrainingCompleteModal] =
    useState(false);
  const [pendingRedirectPath, setPendingRedirectPath] = useState("");
  const [showTimeWarningModal, setShowTimeWarningModal] = useState(false);
  const [showIncorrectAnswerModal, setShowIncorrectAnswerModal] =
    useState(false);

  // --- Custom Hooks ---
  const {
    tasks: loadedTasks,
    isLoadingQuiz,
    quizError,
  } = useQuizLoader({
    isTraining: is_training,
    events,
    datasetMetadata: metadata,
    passedInQuiz,
  });

  const taskManager = useTaskManager({
    initialTasks: loadedTasks,
    isTraining: is_training,
    userRole,
    datasetStudyType: metadata?.studyType,
  });

  const {
    tasks,
    currentTask,
    currentTaskIndex,
    userAnswer,
    isSubmitting,
    setUserAnswer,
    handleSubmission,
    goToNextTask,
    goToPreviousTask,
    goToTask,
    checkAnswer,
    navigateToCompletionPage,
  } = taskManager;

  const isDomainExpert = role === "domain";

  const { formattedTime, timerColorClass } = useQuestionTimer({
    timeLimitMs: currentTask?.timeLimit,
    onTimeUp: () => {
      if (currentTask && !currentTask.completed && !isDomainExpert) {
        console.log(
          "[TaskPanel] Time up, auto-submitting for task:",
          currentTask.id
        );
        handleSubmission({ isTimeUp: true });
      }
    },
    onTwentySecondsLeft: () => {
      if (!isDomainExpert && currentTask && !currentTask.completed) {
        setShowTimeWarningModal(true);
      }
    },
    isPaused:
      showTimeWarningModal ||
      showConfirmSubmitModal ||
      showSkipConfirmModal ||
      showIncorrectAnswerModal ||
      showTrainingCompleteModal,
    isCompleted: currentTask?.completed || false,
    isTrainingOrDomainExpert: is_training || isDomainExpert,
    currentTaskKey: currentTask?.id || "no-task",
  });

  // --- Derived State & Event Handlers specific to TaskPanel orchestrating modals ---
  const [showAnswerUI, setShowAnswerUI] = useState(false);

  const handleAttemptSubmit = () => {
    if (!currentTask) return;

    // Check if this is a training task and the answer is incorrect
    if (is_training && !checkAnswer(currentTask, userAnswer)) {
      setShowIncorrectAnswerModal(true);
      return;
    }

    // If not completed and not in answer view mode, show confirmation
    if (!isDomainExpert && !currentTask.completed && !showAnswerUI) {
      setShowConfirmSubmitModal(true);
    } else {
      handleSubmission({ isSkipped: false, isTimeUp: false });
    }
  };

  const handleConfirmSubmitAction = () => {
    setShowConfirmSubmitModal(false);
    handleSubmission({ isSkipped: false, isTimeUp: false });
  };

  const handleAttemptSkip = () => {
    if (currentTask && !currentTask.completed) {
      setShowSkipConfirmModal(true);
    }
  };

  const handleConfirmSkipAction = () => {
    setShowSkipConfirmModal(false);
    setUserAnswer("Information not specified in the text");
    handleSubmission({ isSkipped: true, isTimeUp: false });
  };

  const handleDomainExpertReveal = () => {
    setShowAnswerUI((prev) => !prev);
  };

  // Effect to handle completion of training or tasks
  useEffect(() => {
    const allTasksCompleted = tasks.every((task) => task.completed);
    if (
      allTasksCompleted &&
      currentTask?.completed &&
      currentTaskIndex === tasks.length - 1
    ) {
      // Complete current stage and get next path
      completeCurrentStage();

      // If we have an external onComplete callback, use it
      if (onComplete) {
        if (is_training) {
          // For training, show completion modal first, then call onComplete
          setShowTrainingCompleteModal(true);
        } else {
          // For main tasks, call onComplete directly
          onComplete();
        }
      } else {
        // Legacy navigation if no onComplete is provided
        const nextPath = goToNextStage();
        if (is_training) {
          // For training, show completion modal before navigation
          setPendingRedirectPath(nextPath);
          setShowTrainingCompleteModal(true);
        } else {
          // For main tasks, navigate directly
          router.push(nextPath);
        }
      }
    }
  }, [
    tasks,
    is_training,
    currentTask,
    currentTaskIndex,
    scenarioId,
    contextSelectedScenario,
    completeCurrentStage,
    goToNextStage,
    router,
  ]);

  const handleConfirmTrainingComplete = () => {
    setShowTrainingCompleteModal(false);
    if (onComplete) {
      // Call the onComplete callback if provided
      onComplete();
    } else if (pendingRedirectPath) {
      if (is_training) {
        const scenarioPathKey =
          window.location.pathname.split("/")[1] || "unknown-scenario";
        localStorage.setItem(`hasCompletedTraining-${scenarioPathKey}`, "true");
      }
      router.push(pendingRedirectPath);
    }
  };

  const handleDomainSkipTraining = () => {
    completeCurrentStage();
    if (onComplete) {
      // Show the training complete modal first
      setShowTrainingCompleteModal(true);
    } else {
      // Dispatch an event to notify that training should be skipped
      const event = new CustomEvent("scenario:training-complete", {
        detail: { skipped: true },
      });
      window.dispatchEvent(event);

      // Still show the modal as feedback to the user
      const nextPath = goToNextStage();
      setPendingRedirectPath(nextPath);
      setShowTrainingCompleteModal(true);
    }
  };

  // --- Footer Button Logic (Corrected) ---
  const canSubmitFooter = () => {
    if (
      !currentTask ||
      isSubmitting ||
      (currentTask.completed && !showAnswerUI && !isDomainExpert)
    )
      return false;
    if (showAnswerUI && isDomainExpert) return true;
    if (
      userAnswer === "Information not specified in the text" ||
      userAnswer === "Time expired before answer was submitted"
    ) {
      return true;
    }
    return userAnswer.trim() !== "";
  };

  const isFooterSubmitButtonVisible =
    currentTask && (!currentTask.completed || (isDomainExpert && showAnswerUI));

  const isFooterInfoNotFoundButtonVisible =
    currentTask && !currentTask.completed && !showAnswerUI;

  const isFooterDomainExpertRevealButtonVisible =
    currentTask && isDomainExpert && !currentTask.completed;

  // --- Loading and Error States ---
  if (isLoadingQuiz) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size="sm" text="Loading quiz questions..." />
      </div>
    );
  }

  if (quizError) {
    return (
      <div className={`flex flex-col h-full bg-white p-2 ${className}`}>
        <h2 className="text-sm font-semibold mb-2">Error Loading Tasks</h2>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-red-500">
            Failed to load quiz questions: {quizError.message}
          </p>
        </div>
      </div>
    );
  }

  if (!currentTask && !isLoadingQuiz && tasks.length === 0) {
    return (
      <div className={`flex flex-col h-full bg-white p-2 ${className}`}>
        <h2 className="text-sm font-semibold mb-2">
          {is_training ? "Training Tasks" : "Tasks"}
        </h2>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-gray-500">
            No tasks available for this scenario.
          </p>
        </div>
      </div>
    );
  }

  if (!currentTask) {
    // Should be caught by above, but as a fallback
    return (
      <div className="p-4 text-center text-gray-500">
        No current task available.
      </div>
    );
  }

  // --- Render Logic ---
  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      <TaskHeader
        isTraining={is_training}
        completedTasksCount={tasks.filter((t) => t.completed).length}
        totalTasksCount={tasks.length}
        currentTaskIndex={currentTaskIndex}
        currentTaskTimeLeftFormatted={formattedTime}
        currentTaskTimerColorClass={timerColorClass}
        isDomainExpert={userRole === "domain"}
        onSkipToNextStage={
          userRole === "domain"
            ? () => {
                // For both training and non-training tasks, dispatch a custom event to transition to the next stage
                const event = new CustomEvent("scenario:skip-to-next-stage");
                window.dispatchEvent(event);
              }
            : undefined
        }
        onDotClick={userRole === "domain" ? goToTask : undefined} // Allow dot nav for domain experts
        tasksForDots={tasks.map((t) => ({ id: t.id, completed: t.completed }))}
      />

      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        <TaskQuestionArea
          currentTask={currentTask}
          currentTaskIndex={currentTaskIndex}
          isDomainExpert={userRole === "domain"}
        />
        <TaskAnswerInput
          currentTask={currentTask}
          userAnswer={userAnswer}
          onUserAnswerChange={setUserAnswer}
          markedEventIds={markedEventIds}
          isDomainExpert={userRole === "domain"}
          showAnswer={showAnswerUI}
          isTaskCompleted={currentTask.completed || false}
          userEventReference={currentTask.userEventReference}
          onMarkedEventClick={setfocusedEventId}
          onRemoveMarkedEvent={toggleMarkedEvent}
        />
      </div>

      <TaskFooter
        onPrevious={goToPreviousTask}
        canGoToPrevious={
          currentTaskIndex > 0 &&
          (userRole === "domain" ||
            (tasks[currentTaskIndex - 1] &&
              tasks[currentTaskIndex - 1].completed))
        }
        onNext={goToNextTask}
        canGoToNext={
          currentTaskIndex < tasks.length - 1 &&
          (userRole === "domain" || (currentTask && currentTask.completed))
        }
        onSubmit={handleAttemptSubmit}
        canSubmit={canSubmitFooter()}
        isSubmitting={isSubmitting}
        onShowAnswer={
          isFooterDomainExpertRevealButtonVisible
            ? handleDomainExpertReveal
            : undefined
        }
        canShowAnswer={isFooterDomainExpertRevealButtonVisible}
        showAnswerActive={showAnswerUI}
        onInformationNotFound={
          isFooterInfoNotFoundButtonVisible ? handleAttemptSkip : undefined
        }
        isTaskCompleted={currentTask.completed || false}
        isDomainExpert={userRole === "domain"}
      />

      {/* Modals */}
      <ConfirmSubmitModal
        isOpen={showConfirmSubmitModal}
        onConfirm={handleConfirmSubmitAction}
        onCancel={() => setShowConfirmSubmitModal(false)}
      />
      <SkipConfirmModal
        isOpen={showSkipConfirmModal}
        onConfirm={handleConfirmSkipAction}
        onCancel={() => setShowSkipConfirmModal(false)}
      />
      <TrainingCompleteModal
        isOpen={showTrainingCompleteModal}
        onConfirm={handleConfirmTrainingComplete}
        onCancel={() => {
          setShowTrainingCompleteModal(false);
          setPendingRedirectPath("");
        }}
        isSkippingTraining={
          !!pendingRedirectPath &&
          pendingRedirectPath.includes("/training") === false &&
          is_training &&
          userRole === "domain"
        }
      />
      <TimeWarningModal
        isOpen={showTimeWarningModal}
        onClose={() => setShowTimeWarningModal(false)}
      />
      <IncorrectAnswerModal
        isOpen={showIncorrectAnswerModal}
        onClose={() => setShowIncorrectAnswerModal(false)}
        correctAnswer={currentTask?.answer}
      />
    </div>
  );
}
