import { useEffect, useCallback } from "react";
import { QuizItem } from "@/components/features/task/quiz-types";
import { saveQuizResponse } from "@/lib/api-submission";
import { checkAnswer } from "@/lib/quiz-utils";
import { useAuth } from "@/contexts/auth-context";
import { useCenterControl } from "@/contexts/center-control-context";
import { useTaskStore } from "@/store/task-store";

interface UseTaskManagerProps {
  initialTasks: QuizItem[];
  isTraining: boolean;
  userRole: "domain" | "normal";
  datasetStudyType: string | undefined; // From dataset metadata
}

export function useTaskManager({
  initialTasks,
  isTraining,
  userRole,
  datasetStudyType,
}: UseTaskManagerProps) {
  const { userId, sessionId } = useAuth();
  const { markedEventIds, clearMarkedEvents } = useCenterControl();

  // Use Zustand store for all state management
  const {
    tasks,
    currentTaskIndex,
    userAnswer,
    isSubmitting,
    currentTask,
    setCurrentTask,
    setCurrentTaskIndex,
    setUserAnswer,
    setIsSubmitting,
    setTasks,
    saveTaskProgress,
    updateTaskProgress,
    getTaskProgress,
    markTaskAsCompleted,
    setTrainingCompleted,
  } = useTaskStore();

  // Initialize tasks and current index when initialTasks change
  useEffect(() => {
    setTasks(initialTasks);
    // Logic to resume progress
    if (userId && !isTraining && initialTasks.length > 0) {
      const progress = getTaskProgress(userId);
      if (progress?.answers) {
        const lastCompletedIndex = progress.answers.reduce(
          (maxIndex: number, answer: any, currentIndex: number) =>
            answer.completed ? currentIndex : maxIndex,
          -1
        );
        if (
          lastCompletedIndex >= 0 &&
          lastCompletedIndex < initialTasks.length - 1
        ) {
          setCurrentTaskIndex(lastCompletedIndex + 1);
          setUserAnswer(initialTasks[lastCompletedIndex + 1].userAnswer || "");
        } else {
          setCurrentTaskIndex(0);
          setUserAnswer(initialTasks[0]?.userAnswer || "");
        }
      } else {
        setCurrentTaskIndex(0);
        setUserAnswer(initialTasks[0]?.userAnswer || "");
      }
    } else {
      setCurrentTaskIndex(0);
      setUserAnswer(initialTasks[0]?.userAnswer || "");
    }
  }, [
    initialTasks,
    userId,
    isTraining,
    setTasks,
    setCurrentTaskIndex,
    setUserAnswer,
    getTaskProgress,
  ]);

  // Update current task in store when index changes
  useEffect(() => {
    if (tasks[currentTaskIndex]) {
      setCurrentTask(tasks[currentTaskIndex]);
    }
  }, [currentTaskIndex, tasks, setCurrentTask]);

  // Record start timestamp when current task changes and it's not completed
  useEffect(() => {
    if (currentTask && !currentTask.completed && !currentTask.startTimestamp) {
      const updatedTasks = tasks.map((task: QuizItem, index: number) =>
        index === currentTaskIndex
          ? { ...task, startTimestamp: Date.now() }
          : task
      );
      setTasks(updatedTasks);
    }
  }, [currentTask, currentTaskIndex, tasks, setTasks]);

  const getStudyType = useCallback(() => {
    const pathSegments = window.location.pathname.split("/").filter(Boolean);
    const scenarioNameFromPath = pathSegments[0] || "";
    if (scenarioNameFromPath.includes("mixed")) return "mixed";
    if (scenarioNameFromPath.includes("pure-text")) return "pure-text";
    if (scenarioNameFromPath.includes("text-chat")) return "text-chat";
    if (scenarioNameFromPath.includes("text-visual")) return "text-visual";
    return datasetStudyType || scenarioNameFromPath || "text-visual"; // Fallback
  }, [datasetStudyType]);

  const handleSubmission = useCallback(
    (options: { isSkipped?: boolean; isTimeUp?: boolean }) => {
      const { isSkipped = false, isTimeUp = false } = options;
      if (!currentTask) return;

      setIsSubmitting(true);

      const updatedTaskData: Partial<QuizItem> = {
        completed: true,
        userAnswer: isSkipped
          ? "Information not specified in the text"
          : userAnswer,
        userEventReference:
          markedEventIds.length > 0 ? [...markedEventIds] : null,
        submitTimestamp: Date.now(),
        isTimeExpired: isTimeUp,
      };

      // Create a new task object with all properties for the update
      const fullyUpdatedTask = {
        ...currentTask,
        ...updatedTaskData,
      } as QuizItem;

      const updatedTasks = tasks.map((task: QuizItem, index: number) =>
        index === currentTaskIndex ? fullyUpdatedTask : task
      );
      setTasks(updatedTasks);

      if (userId) {
        // Use the sessionId from the Auth context - no need for localStorage
        const uniqueSessionId = sessionId || `${userId}_${Date.now()}`;

        saveQuizResponse(userId, uniqueSessionId, {
          question: fullyUpdatedTask.question,
          userAnswer: fullyUpdatedTask.userAnswer || "",
          markedEvents: markedEventIds,
          isSkipped,
          isTimeUp,
          isTraining,
          taskId: fullyUpdatedTask.id,
          startTime: fullyUpdatedTask.startTimestamp || Date.now(),
          endTime: fullyUpdatedTask.submitTimestamp || Date.now(),
        });

        if (!isTraining) {
          const currentProgress = getTaskProgress(userId);
          const newAnswers = [...(currentProgress?.answers || [])];
          const existingAnswerIndex = newAnswers.findIndex(
            (a) => a.questionId === fullyUpdatedTask.id
          );

          const answerEntry = {
            questionId: fullyUpdatedTask.id,
            question: fullyUpdatedTask.question,
            userAnswer: fullyUpdatedTask.userAnswer || "",
            userEventReference: fullyUpdatedTask.userEventReference || null,
            completed: true,
            startTimestamp: fullyUpdatedTask.startTimestamp,
            submitTimestamp: fullyUpdatedTask.submitTimestamp,
            isTimeExpired: isTimeUp,
            duration:
              fullyUpdatedTask.submitTimestamp &&
              fullyUpdatedTask.startTimestamp
                ? fullyUpdatedTask.submitTimestamp -
                  fullyUpdatedTask.startTimestamp
                : null,
          };

          if (existingAnswerIndex !== -1) {
            newAnswers[existingAnswerIndex] = answerEntry;
          } else {
            newAnswers.push(answerEntry);
          }

          // Need to create a new tasks array that reflects the current update for accurate completed count
          const tasksAfterCurrentSubmission = tasks.map((task, index) =>
            index === currentTaskIndex ? fullyUpdatedTask : task
          );

          updateTaskProgress(userId, {
            totalTasks: tasksAfterCurrentSubmission.length,
            completedTasks: tasksAfterCurrentSubmission.filter(
              (t) => t.completed
            ).length,
            correctTasks: 0, // Simplified
            totalSessionTime: 0, // Placeholder
            studyType: getStudyType(),
            answers: newAnswers,
          });
        }
      }

      // Handle task navigation within the stage
      if (currentTaskIndex < tasks.length - 1) {
        // Move to next task after a short delay for user feedback
        setTimeout(() => {
          setCurrentTaskIndex(currentTaskIndex + 1);
          setUserAnswer(tasks[currentTaskIndex + 1].userAnswer || "");
          clearMarkedEvents();
          setIsSubmitting(false);
        }, 1000);
      } else {
        // This was the last task - completion will be handled by useTaskCompletion hook
        setIsSubmitting(false);
      }
    },
    [
      currentTask,
      userAnswer,
      markedEventIds,
      userId,
      sessionId,
      isTraining,
      tasks,
      currentTaskIndex,
      clearMarkedEvents,
      getStudyType,
      setTasks,
      setIsSubmitting,
      getTaskProgress,
      updateTaskProgress,
      setTrainingCompleted,
      saveTaskProgress,
      markTaskAsCompleted,
      userRole,
    ]
  );

  const goToTask = useCallback(
    (index: number) => {
      if (index >= 0 && index < tasks.length) {
        if (userRole === "domain" || !tasks[index].completed) {
          setCurrentTaskIndex(index);
          setUserAnswer(tasks[index].userAnswer || "");
          clearMarkedEvents();
        }
      }
    },
    [tasks, userRole, setCurrentTaskIndex, setUserAnswer, clearMarkedEvents]
  );

  const goToNextTask = useCallback(() => {
    if (currentTaskIndex < tasks.length - 1) {
      if (userRole === "domain" || (currentTask && currentTask.completed)) {
        goToTask(currentTaskIndex + 1);
      }
    }
    // Note: Domain experts navigating beyond last task should be handled by parent component
  }, [currentTaskIndex, tasks.length, userRole, currentTask, goToTask]);

  const goToPreviousTask = useCallback(() => {
    if (currentTaskIndex > 0) {
      if (
        userRole === "domain" ||
        (tasks[currentTaskIndex - 1] && tasks[currentTaskIndex - 1].completed)
      ) {
        goToTask(currentTaskIndex - 1);
      }
    }
  }, [currentTaskIndex, userRole, tasks, goToTask]);

  const restartTasks = useCallback(() => {
    const resetedTasks = initialTasks.map((task) => ({
      ...task,
      completed: false,
      userAnswer: undefined,
      startTimestamp: undefined,
      submitTimestamp: undefined,
      userEventReference: null,
      isTimeExpired: false,
    }));
    setTasks(resetedTasks);
    setCurrentTaskIndex(0);
    setUserAnswer(resetedTasks[0]?.userAnswer || "");
    clearMarkedEvents();
  }, [
    initialTasks,
    setTasks,
    setCurrentTaskIndex,
    setUserAnswer,
    clearMarkedEvents,
  ]);

  return {
    tasks,
    currentTask,
    currentTaskIndex,
    userAnswer,
    isSubmitting,
    setTasks, // Expose setTasks for timer hook to update startTimestamp directly if needed, or for other direct manipulations.
    setUserAnswer,
    handleSubmission,
    goToTask,
    goToNextTask,
    goToPreviousTask,
    restartTasks,
    checkAnswer,
  };
}
