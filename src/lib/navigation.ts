import {
  type Stage,
  type StudyFlow,
  getStudyFlow,
  getNextStage,
} from "@/config/study-flow";
import { useProgressStore } from "@/stores/progress-store";

export function getScenarioRoutes(studyId: string, sessionId: string) {
  return {
    intro: `/${studyId}/${sessionId}/introduction`,
    training: (round: number) =>
      `/${studyId}/${sessionId}/training?round=${round}`,
    main: (round: number) => `/${studyId}/${sessionId}?round=${round}`,
    completion: (totalTasks: number, timeLeft: number) =>
      `/completion?total=${totalTasks}&type=${studyId}&time=${timeLeft || 0}`,
  };
}

export function getCurrentStage(
  studyId: string,
  sessionId: string
): Stage | undefined {
  const flow = getStudyFlow(studyId);
  if (!flow) return undefined;

  // Use the store's state directly
  const isStageCompleted = useProgressStore.getState().isStageCompleted;

  // Find the first incomplete stage
  return flow.stages.find(
    (stage) => !isStageCompleted(studyId, sessionId, stage)
  );
}

export function getNextRoute(studyId: string, sessionId: string): string {
  const flow = getStudyFlow(studyId);
  if (!flow) return "/"; // Redirect to home if no flow found

  const currentStage = getCurrentStage(studyId, sessionId);
  if (!currentStage) {
    // All stages completed, redirect to completion
    const routes = getScenarioRoutes(studyId, sessionId);
    return routes.completion(flow.stages.length, 0);
  }

  const routes = getScenarioRoutes(studyId, sessionId);

  switch (currentStage.type) {
    case "intro":
      return routes.intro;
    case "training":
      return routes.training(currentStage.round || 1);
    case "main":
      return routes.main(currentStage.round || 1);
    case "completion":
      return routes.completion(flow.stages.length, 0);
    default:
      return routes.intro;
  }
}

export function getRedirectPath(
  studyId: string,
  sessionId: string,
  currentStage: Stage
): string {
  const flow = getStudyFlow(studyId);
  if (!flow) return "/";

  const nextStage = getNextStage(studyId, currentStage);
  if (!nextStage) {
    // No next stage, stay on current or go to completion
    const routes = getScenarioRoutes(studyId, sessionId);
    return currentStage.type === "completion"
      ? routes.completion(flow.stages.length, 0)
      : getNextRoute(studyId, sessionId);
  }

  const routes = getScenarioRoutes(studyId, sessionId);

  switch (nextStage.type) {
    case "intro":
      return routes.intro;
    case "training":
      return routes.training(nextStage.round || 1);
    case "main":
      return routes.main(nextStage.round || 1);
    case "completion":
      return routes.completion(flow.stages.length, 0);
    default:
      return routes.intro;
  }
}

// Add helper functions for stage management
export function markCurrentStageComplete(
  studyId: string,
  sessionId: string,
  stage: Stage
): void {
  useProgressStore.getState().markStageCompleted(studyId, sessionId, stage);
}

export function isStageComplete(
  studyId: string,
  sessionId: string,
  stage: Stage
): boolean {
  return useProgressStore
    .getState()
    .isStageCompleted(studyId, sessionId, stage);
}

export function resetStudyProgress(studyId: string, sessionId: string): void {
  useProgressStore.getState().resetProgress(studyId, sessionId);
}
