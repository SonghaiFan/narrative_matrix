"use client";

import { NarrativeEvent, NarrativeMatrixData } from "@/types/lite";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode,
} from "react";
import { saveEventInteraction } from "@/lib/firebase-operations";
import { useAuth } from "./auth-context";

// Import ScenarioType
import { ScenarioType } from "@/types/scenario";

interface CenterControlContextType {
  // Data state
  data: NarrativeMatrixData | null;
  setData: (data: NarrativeMatrixData) => void;

  // Focused event state
  focusedEventId: number | null;
  setfocusedEventId: (id: number | null) => void;

  // Marked events state
  markedEventIds: number[];
  setMarkedEventIds: (ids: number[]) => void;
  toggleMarkedEvent: (id: number) => void;
  isEventMarked: (id: number) => boolean;
  clearMarkedEvents: () => void;

  // Selected entity state
  selectedEntityId: string | null;
  setSelectedEntityId: (id: string | null) => void;

  // Selected topic state
  selectedTopic: string | null;
  setSelectedTopic: (topic: string | null) => void;

  // Selected scenario state
  selectedScenario: ScenarioType | null;
  setSelectedScenario: (scenario: ScenarioType | null) => void;

  // Loading and error states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;

  // Utility functions
  getSelectedEvent: () => NarrativeEvent | undefined;
  clearSelections: () => void;
}

const CenterControlContext = createContext<
  CenterControlContextType | undefined
>(undefined);

export function CenterControlProvider({
  children,
  initialData = null,
}: {
  children: ReactNode;
  initialData?: NarrativeMatrixData | null;
}) {
  const { user } = useAuth();
  // Data state
  const [data, setDataState] = useState<NarrativeMatrixData | null>(
    initialData
  );

  // Selection states
  const [focusedEventId, setfocusedEventIdState] = useState<number | null>(
    null
  );
  const [markedEventIds, setMarkedEventIds] = useState<number[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType | null>(
    null
  );

  // Loading and error states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Set data with validation
  const setData = useCallback((newData: NarrativeMatrixData) => {
    setDataState(newData);
  }, []);

  // Get the currently selected event
  const getSelectedEvent = useCallback(() => {
    if (!data || focusedEventId === null) return undefined;
    return data.events.find((event) => event.index === focusedEventId);
  }, [data, focusedEventId]);

  // Clear all selections
  const clearSelections = useCallback(() => {
    setfocusedEventId(null);
    setSelectedEntityId(null);
    setSelectedTopic(null);
    // Don't clear scenario selection as it's a higher-level selection
  }, []);

  // Set focused event with tracking
  const setfocusedEventId = useCallback(
    (id: number | null) => {
      if (id !== null && user) {
        try {
          // Get the unique session ID from user object
          const uniqueSessionId = user.sessionId || user.id;

          saveEventInteraction(user.id, uniqueSessionId, {
            eventId: id,
            type: "focus",
            timestamp: Date.now(),
          });
        } catch (error) {
          console.error("Error saving event focus interaction:", error);
        }
      }
      setfocusedEventIdState(id);
    },
    [user]
  );

  // Toggle marked state for an event with tracking
  const toggleMarkedEvent = useCallback(
    (id: number) => {
      setMarkedEventIds((prev) => {
        const isMarked = prev.includes(id);
        if (user) {
          try {
            // Get the unique session ID from user object
            const uniqueSessionId = user.sessionId || user.id;

            saveEventInteraction(user.id, uniqueSessionId, {
              eventId: id,
              type: isMarked ? "unmark" : "mark",
              timestamp: Date.now(),
            });
          } catch (error) {
            console.error("Error saving event mark/unmark interaction:", error);
          }
        }
        if (isMarked) {
          return prev.filter((eventId) => eventId !== id);
        } else {
          return [...prev, id];
        }
      });
    },
    [user]
  );

  // Clear all marked events
  const clearMarkedEvents = useCallback(() => {
    setMarkedEventIds([]);
  }, []);

  // Check if an event is marked
  const isEventMarked = useCallback(
    (id: number) => {
      return markedEventIds.includes(id);
    },
    [markedEventIds]
  );

  const value = {
    // Data state
    data,
    setData,

    // Selection states
    focusedEventId,
    setfocusedEventId,
    markedEventIds,
    setMarkedEventIds,
    toggleMarkedEvent,
    isEventMarked,
    clearMarkedEvents,
    selectedEntityId,
    setSelectedEntityId,
    selectedTopic,
    setSelectedTopic,
    selectedScenario,
    setSelectedScenario,

    // Loading and error states
    isLoading,
    setIsLoading,
    error,
    setError,

    // Utility functions
    getSelectedEvent,
    clearSelections,
  };

  return (
    <CenterControlContext.Provider value={value}>
      {children}
    </CenterControlContext.Provider>
  );
}

export function useCenterControl() {
  const context = useContext(CenterControlContext);

  if (context === undefined) {
    throw new Error(
      "useCenterControl must be used within a CenterControlProvider"
    );
  }

  return context;
}
