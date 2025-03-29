"use client";

import { ReactNode } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

interface ResizableTwoRowColProps {
  firstComponent: ReactNode;
  secondComponent: ReactNode;
  defaultFirstSize?: number;
  defaultSecondSize?: number;
  direction?: "vertical" | "horizontal";
  className?: string;
}

export function ResizableTwoRowCol({
  firstComponent,
  secondComponent,
  defaultFirstSize = 50,
  defaultSecondSize = 50,
  direction = "vertical",
  className = "",
}: ResizableTwoRowColProps) {
  return (
    <div className={`h-full w-full ${className}`}>
      <PanelGroup direction={direction} className="h-full w-full">
        <Panel
          defaultSize={defaultFirstSize}
          minSize={30}
          className="overflow-hidden"
        >
          {firstComponent}
        </Panel>

        <PanelResizeHandle
          className={`bg-gray-200 hover:bg-gray-300 transition-colors ${
            direction === "vertical"
              ? "h-1 w-full cursor-row-resize"
              : "w-1 h-full cursor-col-resize"
          }`}
        />

        <Panel
          defaultSize={defaultSecondSize}
          minSize={30}
          className="overflow-hidden"
        >
          {secondComponent}
        </Panel>
      </PanelGroup>
    </div>
  );
}
