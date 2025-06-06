"use client";

import React, { useState, useEffect } from "react";

import { Quiz } from "./quiz-types/index";
import { useCenterControl } from "@/contexts/center-control-context";
import { useAuth } from "@/contexts/auth-context";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { NarrativeEvent, DatasetMetadata } from "@/types/data";

// Custom hooks
import { useQuestionTimer } from "@/hooks/useQuestionTimer";
import { useQuizLoader } from "@/hooks/useQuizLoader";
import { useTaskManager } from "@/hooks/useTaskManager";

// Sub-components
import { TaskHeader } from "./task-header";
import { TaskQuestionArea } from "./task-question-area";
import { TaskAnswerInput } from "./task-answer-input";
import { TaskFooter } from "./task-footer";

// Modals
import { ConfirmSubmitModal } from "./modals/confirm-submit-modal";
import { SkipConfirmModal } from "./modals/skip-confirm-modal";
import { TimeWarningModal, TimeWarningType } from "./modals/time-warning-modal";
import { IncorrectAnswerModal } from "./modals/incorrect-answer-modal";

interface TaskPanelProps {
  events: NarrativeEvent[] | undefined;
  metadata: DatasetMetadata | undefined;
  className?: string;
  userRole?: "domain" | "normal";
  is_training?: boolean;
  quiz?: Quiz; // Pre-loaded and ordered quiz items
}

export function TaskPanel({
  events,
  metadata,
  className = "",
  userRole = "normal",
  is_training = false,
  quiz: passedInQuiz,
}: TaskPanelProps) {
  const { userId } = useAuth();
  const { toggleMarkedEvent, setfocusedEventId, markedEventIds } =
    useCenterControl();

  // Navigation is now handled via onComplete callback

  // --- State for Modals ---
  const [showConfirmSubmitModal, setShowConfirmSubmitModal] = useState(false);
  const [showSkipConfirmModal, setShowSkipConfirmModal] = useState(false);
  const [showTimeWarningModal, setShowTimeWarningModal] = useState(false);
  const [timeWarningType, setTimeWarningType] =
    useState<TimeWarningType>("twentySecondsLeft");
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
  } = taskManager;

  const isDomainExpert = userRole === "domain";

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
        setTimeWarningType("twentySecondsLeft");
        setShowTimeWarningModal(true);
      }
    },
    onTimerStart: () => {
      if (
        !isDomainExpert &&
        currentTask &&
        !currentTask.completed &&
        !is_training
      ) {
        setTimeWarningType("taskStart");
        setShowTimeWarningModal(true);
      }
    },
    isPaused:
      showTimeWarningModal ||
      showConfirmSubmitModal ||
      showSkipConfirmModal ||
      showIncorrectAnswerModal,
    isCompleted: currentTask?.completed ?? false,
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
    setUserAnswer("None of above");
    handleSubmission({ isSkipped: true, isTimeUp: false });
  };

  const handleDomainExpertReveal = () => {
    setShowAnswerUI((prev) => !prev);
  };

  // TaskPanel now only handles task navigation within a stage
  // Stage completion is handled by parent components

  const handleDomainSkipTraining = () => {
    // For domain experts, show completion modal then navigate
    handleSubmission({ isSkipped: true, isTimeUp: false });
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
      userAnswer === "None of above" ||
      userAnswer === "Information not specified in the text" ||
      userAnswer === "Time expired before answer was submitted"
    ) {
      return true;
    }
    return userAnswer.trim() !== "";
  };

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
        completedTasksCount={tasks.filter((t: any) => t.completed).length}
        totalTasksCount={tasks.length}
        currentTaskIndex={currentTaskIndex}
        currentTaskTimeLeftFormatted={formattedTime}
        currentTaskTimerColorClass={timerColorClass}
        isDomainExpert={userRole === "domain"}
        onSkipToNextStage={
          userRole === "domain" ? handleDomainSkipTraining : undefined
        }
        onDotClick={userRole === "domain" ? goToTask : undefined} // Allow dot nav for domain experts
        tasksForDots={tasks.map((t: any) => ({
          id: t.id,
          completed: t.completed,
        }))}
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
          isTaskCompleted={currentTask.completed ?? false}
          userEventReference={currentTask.userEventReference}
          onMarkedEventClick={setfocusedEventId}
          onRemoveMarkedEvent={toggleMarkedEvent}
          onNoneOfAbove={
            currentTask && !currentTask.completed && !showAnswerUI
              ? handleAttemptSkip
              : undefined
          }
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
        canShowAnswer={!!isFooterDomainExpertRevealButtonVisible}
        showAnswerActive={showAnswerUI}
        isTaskCompleted={currentTask.completed ?? false}
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

      <TimeWarningModal
        isOpen={showTimeWarningModal}
        onClose={() => setShowTimeWarningModal(false)}
        warningType={timeWarningType}
      />
      <IncorrectAnswerModal
        isOpen={showIncorrectAnswerModal}
        onClose={() => setShowIncorrectAnswerModal(false)}
        correctAnswer={currentTask?.answer}
      />
    </div>
  );
}
