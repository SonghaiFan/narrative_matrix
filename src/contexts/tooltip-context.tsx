"use client";

import { NarrativeEvent } from "@/types/narrative/lite";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { NarrativeTooltip } from "@/components/features/narrative/shared/narrative-tooltip";

export type VisualizationType = "entity" | "time" | "topic";

export interface TooltipPosition {
  x: number;
  y: number;
}

interface TooltipState {
  event: NarrativeEvent | null;
  position: TooltipPosition | null;
  visible: boolean;
  type: VisualizationType;
}

interface TooltipContextType {
  showTooltip: (
    event: NarrativeEvent,
    x: number,
    y: number,
    type: VisualizationType
  ) => void;
  hideTooltip: () => void;
  updatePosition: (x: number, y: number) => void;
  tooltipState: TooltipState;
}

const TooltipContext = createContext<TooltipContextType | undefined>(undefined);

export function TooltipProvider({ children }: { children: ReactNode }) {
  const [tooltipState, setTooltipState] = useState<TooltipState>({
    event: null,
    position: null,
    visible: false,
    type: "topic",
  });

  const showTooltip = useCallback(
    (event: NarrativeEvent, x: number, y: number, type: VisualizationType) => {
      setTooltipState({
        event,
        position: { x, y },
        visible: true,
        type,
      });
    },
    []
  );

  const hideTooltip = useCallback(() => {
    setTooltipState((prev) => ({ ...prev, visible: false }));
  }, []);

  const updatePosition = useCallback((x: number, y: number) => {
    setTooltipState((prev) => ({
      ...prev,
      position: { x, y },
    }));
  }, []);

  return (
    <TooltipContext.Provider
      value={{ showTooltip, hideTooltip, updatePosition, tooltipState }}
    >
      {children}
      <NarrativeTooltip
        event={tooltipState.event}
        position={tooltipState.position}
        visible={tooltipState.visible}
        type={tooltipState.type}
      />
    </TooltipContext.Provider>
  );
}

export function useTooltip() {
  const context = useContext(TooltipContext);

  if (context === undefined) {
    throw new Error("useTooltip must be used within a TooltipProvider");
  }

  return context;
}
