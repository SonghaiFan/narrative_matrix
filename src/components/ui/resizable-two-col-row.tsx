"use client";

import { ReactNode } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

interface ResizableTwoColRowProps {
  firstComponent: ReactNode;
  secondComponent: ReactNode;
  defaultFirstSize?: number;
  defaultSecondSize?: number;
  className?: string;
}

export function ResizableTwoColRow({
  firstComponent,
  secondComponent,
  defaultFirstSize = 50,
  defaultSecondSize = 50,
  className = "",
}: ResizableTwoColRowProps) {
  // If either component is null, render only the non-null component
  if (!firstComponent) {
    return (
      <div className={`h-full w-full ${className}`}>{secondComponent}</div>
    );
  }
  if (!secondComponent) {
    return <div className={`h-full w-full ${className}`}>{firstComponent}</div>;
  }

  // If both components exist, render the resizable layout
  return (
    <div className={`h-full w-full ${className}`}>
      <PanelGroup direction="horizontal" className="h-full w-full">
        <Panel
          defaultSize={defaultFirstSize}
          minSize={30}
          className="overflow-hidden"
        >
          {firstComponent}
        </Panel>

        <PanelResizeHandle className="w-1 h-full cursor-col-resize bg-gray-200 hover:bg-gray-300 transition-colors" />

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
