import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { QuizItem } from "@/components/features/task/quiz-types";
import {
  saveTaskProgress as saveProgressToLocalStorage,
  updateTaskProgress as updateProgressInLocalStorage,
  markTaskAsCompleted as markTasksCompletedInLocalStorage,
  getTaskProgress as getProgressFromLocalStorage,
} from "@/lib/task-progress";
import { saveQuizResponse as saveResponseToFirebase } from "@/lib/firebase-operations";
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
  const router = useRouter();
  const { userId, scenarioId } = useAuth();
  const {
    markedEventIds,
    clearMarkedEvents,
    selectedScenario: contextSelectedScenario,
  } = useCenterControl();
  const setCurrentTaskInGlobalStore = useTaskStore(
    (state) => state.setCurrentTask
  );

  const [tasks, setTasks] = useState<QuizItem[]>(initialTasks);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize tasks and current index when initialTasks change
  useEffect(() => {
    setTasks(initialTasks);
    // Logic to resume progress
    if (userId && !isTraining && initialTasks.length > 0) {
      const progress = getProgressFromLocalStorage(userId);
      if (progress?.answers) {
        const lastCompletedIndex = progress.answers.reduce(
          (maxIndex, answer, currentIndex) =>
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
  }, [initialTasks, userId, isTraining]);

  const currentTask = tasks[currentTaskIndex];

  useEffect(() => {
    if (currentTask) {
      setCurrentTaskInGlobalStore(currentTask);
    }
  }, [currentTask, setCurrentTaskInGlobalStore]);

  // Record start timestamp when current task changes and it's not completed
  useEffect(() => {
    if (currentTask && !currentTask.completed && !currentTask.startTimestamp) {
      setTasks((prevTasks) =>
        prevTasks.map((task, index) =>
          index === currentTaskIndex
            ? { ...task, startTimestamp: Date.now() }
            : task
        )
      );
    }
  }, [currentTask, currentTaskIndex]);

  const getStudyType = useCallback(() => {
    const pathSegments = window.location.pathname.split("/").filter(Boolean);
    const scenarioNameFromPath = pathSegments[0] || "";
    if (scenarioNameFromPath.includes("mixed")) return "mixed";
    if (scenarioNameFromPath.includes("pure-text")) return "pure-text";
    if (scenarioNameFromPath.includes("text-chat")) return "text-chat";
    if (scenarioNameFromPath.includes("text-visual")) return "text-visual";
    return datasetStudyType || scenarioNameFromPath || "text-visual"; // Fallback
  }, [datasetStudyType]);

  const navigateToCompletionPage = useCallback(() => {
    if (!userId) return;
    const studyType = getStudyType();
    const finalProgress = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter((t) => t.completed).length,
      correctTasks: 0, // Simplified for now
      studyType,
      isCompleted: true,
      totalSessionTime: 0, // This should be handled by the timer hook or passed in
      answers: tasks.map((task) => ({
        questionId: task.id,
        question: task.question,
        userAnswer: task.userAnswer || "",
        completed: task.completed,
        userEventReference: task.userEventReference || null,
        startTimestamp: task.startTimestamp,
        submitTimestamp: task.submitTimestamp,
        isTimeExpired: task.isTimeExpired || false,
        duration:
          task.submitTimestamp && task.startTimestamp
            ? task.submitTimestamp - task.startTimestamp
            : null,
      })),
    };
    saveProgressToLocalStorage(userId, finalProgress);
    if (userRole === "normal") {
      markTasksCompletedInLocalStorage(userId);
    }
    router.push(
      `/completion?total=${tasks.length}&type=${studyType}&time=${finalProgress.totalSessionTime}`
    );
  }, [userId, tasks, userRole, router, getStudyType]);

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

      setTasks((prevTasks) =>
        prevTasks.map((task, index) =>
          index === currentTaskIndex ? fullyUpdatedTask : task
        )
      );

      if (userId) {
        const storedUser = localStorage.getItem("user");
        let uniqueSessionId = userId; // Fallback
        if (storedUser) {
          try {
            uniqueSessionId = JSON.parse(storedUser).sessionId || userId;
          } catch (e) {
            console.error("Error parsing stored user for session ID:", e);
          }
        }

        saveResponseToFirebase(userId, uniqueSessionId, {
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
          const currentProgress = getProgressFromLocalStorage(userId);
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

          updateProgressInLocalStorage(userId, {
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

      // Use a fresh calculation for allTasksNowCompleted based on the latest state update attempt
      const allTasksNowCompleted = tasks
        .map((t, i) => (i === currentTaskIndex ? fullyUpdatedTask : t))
        .every((t) => t.completed);

      if (allTasksNowCompleted) {
        if (isTraining) {
          let scenarioIdForPath = "1"; // Default
          if (scenarioId)
            scenarioIdForPath = scenarioId.replace("text-visual-", "");
          else if (contextSelectedScenario)
            scenarioIdForPath = contextSelectedScenario.replace(
              "text-visual-",
              ""
            );
          else {
            const pathParts = window.location.pathname.split("/");
            if (pathParts.length >= 3 && pathParts[1] === "text-visual")
              scenarioIdForPath = pathParts[2];
          }
          const scenarioPathKey =
            window.location.pathname.split("/")[1] || "unknown-scenario";
          localStorage.setItem(
            `hasCompletedTraining-${scenarioPathKey}`,
            "true"
          );

          const mainRedirectPath = `/text-visual/${scenarioIdForPath}`;
          console.log(
            "Training complete. Suggested redirect:",
            mainRedirectPath
          );
          // The parent component (TaskPanel) will need a way to know training is complete
          // to show the modal. This hook can return a state like `isTrainingCompleted`.
          // For now, logging and relying on parent to handle modal via other states.
          setIsSubmitting(false); // Allow UI to update for modal
        } else {
          setTimeout(() => {
            navigateToCompletionPage();
            setIsSubmitting(false); // Reset after navigation attempt
          }, 1000);
        }
      } else {
        setTimeout(() => {
          if (currentTaskIndex < tasks.length - 1) {
            setCurrentTaskIndex(currentTaskIndex + 1);
            setUserAnswer(tasks[currentTaskIndex + 1].userAnswer || "");
            clearMarkedEvents();
          } else {
            console.warn(
              "On last task, but not all tasks reported as completed after submission."
            );
          }
          setIsSubmitting(false);
        }, 1000);
      }
    },
    [
      currentTask,
      userAnswer,
      markedEventIds,
      userId,
      isTraining,
      tasks,
      currentTaskIndex,
      router,
      scenarioId,
      contextSelectedScenario,
      clearMarkedEvents,
      navigateToCompletionPage,
      getStudyType,
      setTasks, // Added setTasks
    ]
  );

  const goToTask = (index: number) => {
    if (index >= 0 && index < tasks.length) {
      if (userRole === "domain" || !tasks[index].completed) {
        setCurrentTaskIndex(index);
        setUserAnswer(tasks[index].userAnswer || "");
        clearMarkedEvents();
      }
    }
  };

  const goToNextTask = () => {
    if (currentTaskIndex < tasks.length - 1) {
      if (userRole === "domain" || (currentTask && currentTask.completed)) {
        goToTask(currentTaskIndex + 1);
      }
    } else if (
      userRole === "domain" &&
      currentTaskIndex === tasks.length - 1 &&
      currentTask &&
      currentTask.completed
    ) {
      navigateToCompletionPage();
    }
  };

  const goToPreviousTask = () => {
    if (currentTaskIndex > 0) {
      if (
        userRole === "domain" ||
        (tasks[currentTaskIndex - 1] && tasks[currentTaskIndex - 1].completed)
      ) {
        goToTask(currentTaskIndex - 1);
      }
    }
  };

  const restartTasks = () => {
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
  };

  const checkAnswer = useCallback(
    (task: QuizItem, answerToCheck: string): boolean => {
      if (!answerToCheck.trim()) return false;
      const normalize = (str: string) =>
        str.toLowerCase().trim().replace(/\s+/g, " ");

      switch (task.type) {
        case "radio-options":
          return normalize(task.answer) === normalize(answerToCheck);
        case "multiple-select":
          const normalizeAndSort = (str: string) =>
            str
              .split(",")
              .map((item) => normalize(item))
              .filter(Boolean)
              .sort();
          const correctItems = normalizeAndSort(task.answer);
          const userItems = normalizeAndSort(answerToCheck);
          if (correctItems.length !== userItems.length) return false;
          return correctItems.every((item, index) => item === userItems[index]);
        case "numbered-sequence":
          return (
            task.answer.replace(/\s+/g, "") ===
            answerToCheck.replace(/\s+/g, "")
          );
        case "grid-matching":
          try {
            const parseGridString = (str: string) => {
              const pairs = str.split(",").map((pair) => pair.trim());
              return pairs.reduce((acc, pair) => {
                const [key, value] = pair.split(":").map((s) => normalize(s));
                if (key && value !== undefined) acc[key] = value;
                return acc;
              }, {} as Record<string, string>);
            };
            const correctPairs = parseGridString(task.answer);
            const userPairs = parseGridString(answerToCheck);
            const correctKeys = Object.keys(correctPairs).sort();
            const userKeys = Object.keys(userPairs).sort();
            if (
              correctKeys.length !== userKeys.length ||
              correctKeys.some((key) => !userPairs.hasOwnProperty(key))
            )
              return false;
            return correctKeys.every(
              (key) => correctPairs[key] === userPairs[key]
            );
          } catch {
            return false;
          }
        default: // single-input or any other type not explicitly handled by variants
          // Check if task.answer is a string before normalizing, as it could be from a variant not having 'answer' or it being of a different type.
          const baseTask = task as any; // Use 'any' carefully, or ensure 'answer' is on a common base type for all QuizItem variants.
          if (typeof baseTask.answer === "string") {
            return normalize(baseTask.answer) === normalize(answerToCheck);
          }
          return false;
      }
    },
    []
  );

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
    navigateToCompletionPage,
  };
}
