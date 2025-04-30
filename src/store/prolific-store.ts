import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface ProlificState {
  prolificId: string | null;
  studyId: string | null;
  sessionId: string | null;
  hasProlificParams: boolean;
  scenarioId: string | null;
  setProlificParams: (params: {
    prolificId: string | null;
    studyId: string | null;
    sessionId: string | null;
  }) => void;
  clearProlificParams: () => void;
}

export const useProlificStore = create<ProlificState>()(
  persist(
    (set, get) => ({
      prolificId: null,
      studyId: null,
      sessionId: null,
      hasProlificParams: false,
      scenarioId: null,
      setProlificParams: ({ prolificId, studyId, sessionId }) => {
        const scenarioId =
          studyId && sessionId ? `${studyId}-${sessionId}` : null;
        set({
          prolificId,
          studyId,
          sessionId,
          hasProlificParams: !!prolificId,
          scenarioId,
        });
      },
      clearProlificParams: () =>
        set({
          prolificId: null,
          studyId: null,
          sessionId: null,
          hasProlificParams: false,
          scenarioId: null,
        }),
    }),
    {
      name: "prolific-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
