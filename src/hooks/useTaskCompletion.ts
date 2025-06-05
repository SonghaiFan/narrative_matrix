import { useEffect } from "react";
import { useTaskStore } from "@/store/task-store";
import { useAuth } from "@/contexts/auth-context";

interface UseTaskCompletionProps {
  tasks: any[];
  currentTask: any;
  currentTaskIndex: number;
  isTraining: boolean;
  userRole?: "domain" | "normal";
  onAllTasksCompleted?: () => void;
}

/**
 * Hook to handle task completion notifications without callback props
 * This creates a clean separation between task navigation and stage navigation
 */
export function useTaskCompletion({
  tasks,
  currentTask,
  currentTaskIndex,
  isTraining,
  userRole = "normal",
  onAllTasksCompleted,
}: UseTaskCompletionProps) {
  const { userId } = useAuth();
  const { saveTaskProgress, markTaskAsCompleted, setTrainingCompleted } =
    useTaskStore();

  // Notify when all tasks in the current stage are completed
  useEffect(() => {
    const allTasksCompleted = tasks.every((task: any) => task.completed);

    if (
      allTasksCompleted &&
      currentTask?.completed &&
      currentTaskIndex === tasks.length - 1
    ) {
      // Handle completion logic that was moved from useTaskManager
      if (userId) {
        if (isTraining) {
          // Store training completion state
          const scenarioPathKey =
            window.location.pathname.split("/")[1] || "unknown-scenario";
          setTrainingCompleted(scenarioPathKey, true);
        } else {
          // For main tasks, save final progress
          const getStudyType = () => {
            const pathSegments = window.location.pathname
              .split("/")
              .filter(Boolean);
            const scenarioNameFromPath = pathSegments[0] || "";
            if (scenarioNameFromPath.includes("mixed")) return "mixed";
            if (scenarioNameFromPath.includes("pure-text")) return "pure-text";
            if (scenarioNameFromPath.includes("text-chat")) return "text-chat";
            if (scenarioNameFromPath.includes("text-visual"))
              return "text-visual";
            return "text-visual"; // Fallback
          };

          const studyType = getStudyType();
          const finalProgress = {
            totalTasks: tasks.length,
            completedTasks: tasks.filter((t: any) => t.completed).length,
            correctTasks: 0,
            studyType,
            isCompleted: true,
            totalSessionTime: 0,
            answers: tasks.map((task: any) => ({
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
          saveTaskProgress(userId, finalProgress);

          if (userRole === "normal") {
            markTaskAsCompleted(userId);
          }
        }
      }

      // Trigger stage navigation after a small delay
      if (onAllTasksCompleted) {
        const timeoutId = setTimeout(() => {
          onAllTasksCompleted();
        }, 100);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [
    tasks,
    currentTask,
    currentTaskIndex,
    onAllTasksCompleted,
    userId,
    isTraining,
    userRole,
    saveTaskProgress,
    markTaskAsCompleted,
    setTrainingCompleted,
  ]);
}
