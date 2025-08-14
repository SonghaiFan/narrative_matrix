"use client";

import { ReactNode } from "react";
import { SHARED_CONFIG } from "./visualization-config";

interface VisualizationDisplayProps {
  title: string;
  children: ReactNode;
  isEmpty?: boolean;
  headerContent?: ReactNode;
}

export function VisualizationDisplay({
  title,
  children,
  isEmpty = false,
  headerContent,
}: VisualizationDisplayProps) {
  if (isEmpty) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div
        className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10"
        style={{ height: `${SHARED_CONFIG.header.height}px` }}
      >
        <div className="flex items-center gap-4 overflow-hidden">
          <h2 className="text-sm font-medium text-gray-600">{title}</h2>
          <div className="flex-shrink-0">{headerContent}</div>
        </div>
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
