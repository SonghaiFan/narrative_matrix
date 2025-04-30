import { getLocalStorage, setLocalStorage } from "@/utils/local-storage";

export type Stage = {
  type: "intro" | "training" | "main" | "completion";
  round?: number;
  data?: {
    quiz?: string; // Path to quiz data file
    events?: string; // Path to events data file
    metadata?: string; // Path to metadata file (if separate)
  };
};

export type StudyFlow = {
  studyId: string;
  stages: Stage[];
  defaultPaths?: {
    quiz: string;
    events: string;
    metadata?: string;
  };
};

export type StudyProgress = {
  completedStages: {
    intro?: boolean;
    training: { [round: number]: boolean };
    main: { [round: number]: boolean };
    completion?: boolean;
  };
};

const studyFlows: StudyFlow[] = [
  {
    studyId: "text-visual",
    defaultPaths: {
      quiz: "quiz_data.json",
      events: "text-visual-{studyId}.json",
    },
    stages: [
      {
        type: "intro",
        data: {
          events: "intro.json",
        },
      },
      {
        type: "training",
        round: 1,
        data: {
          quiz: "train_quiz_data.json",
          events: "training-1.json",
        },
      },
      {
        type: "main",
        round: 1,
      },
      {
        type: "training",
        round: 2,
        data: {
          quiz: "train_quiz_data.json",
          events: "training-2.json",
        },
      },
      {
        type: "main",
        round: 2,
      },
      {
        type: "completion",
      },
    ],
  },
  {
    studyId: "text",
    defaultPaths: {
      quiz: "quiz_data.json",
      events: "text-{studyId}.json",
    },
    stages: [
      {
        type: "intro",
        data: {
          events: "intro.json",
        },
      },
      {
        type: "training",
        round: 1,
        data: {
          quiz: "train_quiz_data.json",
          events: "training-1.json",
        },
      },
      {
        type: "main",
        round: 1,
      },
      {
        type: "completion",
      },
    ],
  },
];

export function getStudyFlow(studyId: string): StudyFlow | undefined {
  return studyFlows.find((flow) => flow.studyId === studyId);
}

export function getNextStage(
  studyId: string,
  currentStage: Stage
): Stage | undefined {
  const flow = getStudyFlow(studyId);
  if (!flow) return undefined;

  const currentIndex = flow.stages.findIndex(
    (stage) =>
      stage.type === currentStage.type && stage.round === currentStage.round
  );

  if (currentIndex === -1 || currentIndex === flow.stages.length - 1) {
    return undefined;
  }

  return flow.stages[currentIndex + 1];
}

export function getStageDataPaths(
  studyId: string,
  sessionId: string,
  stage: Stage
): { quiz?: string; events?: string; metadata?: string } {
  const flow = getStudyFlow(studyId);
  if (!flow) return {};

  // Get default paths
  const defaultPaths = flow.defaultPaths || {
    quiz: "quiz_data.json",
    events: `${studyId}-${sessionId}.json`,
  };

  // If stage has specific data paths, use those, otherwise use defaults
  return {
    quiz: stage.data?.quiz || defaultPaths.quiz,
    events:
      stage.data?.events || defaultPaths.events.replace("{studyId}", sessionId),
    metadata: stage.data?.metadata || defaultPaths.metadata,
  };
}

export function isStageCompleted(
  studyId: string,
  sessionId: string,
  stage: Stage
): boolean {
  const key = `${studyId}-${sessionId}-progress`;
  const progress = getLocalStorage<StudyProgress>(key) || {
    completedStages: {
      training: {},
      main: {},
    },
  };

  switch (stage.type) {
    case "intro":
      return progress.completedStages.intro || false;
    case "training":
      return progress.completedStages.training[stage.round || 1] || false;
    case "main":
      return progress.completedStages.main[stage.round || 1] || false;
    case "completion":
      return progress.completedStages.completion || false;
    default:
      return false;
  }
}

export function markStageCompleted(
  studyId: string,
  sessionId: string,
  stage: Stage
): void {
  const key = `${studyId}-${sessionId}-progress`;
  const progress = getLocalStorage<StudyProgress>(key) || {
    completedStages: {
      training: {},
      main: {},
    },
  };

  switch (stage.type) {
    case "intro":
      progress.completedStages.intro = true;
      break;
    case "training":
      progress.completedStages.training[stage.round || 1] = true;
      break;
    case "main":
      progress.completedStages.main[stage.round || 1] = true;
      break;
    case "completion":
      progress.completedStages.completion = true;
      break;
  }

  setLocalStorage(key, progress);
}
