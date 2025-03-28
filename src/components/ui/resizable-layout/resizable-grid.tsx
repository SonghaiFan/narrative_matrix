"use client";

import { useState, useRef, useEffect } from "react";
import {
  Panel,
  PanelGroup,
  ImperativePanelGroupHandle,
} from "react-resizable-panels";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExpand, faCompress } from "@fortawesome/free-solid-svg-icons";
import { ExpandButton } from "./expand-button";

interface ResizableGridProps {
  topLeft: React.ReactNode;
  topRight: React.ReactNode;
  bottomLeft: React.ReactNode;
  bottomRight: React.ReactNode;
  className?: string;
}

export function ResizableGrid({
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  className = "",
}: ResizableGridProps) {
  // Panel configuration with proportions matching the screenshot
  // These values must add up to exactly 100
  const DEFAULT_LEFT_WIDTH = 50;
  const DEFAULT_TOP_HEIGHT = 45;

  // Min/max constraints
  const MIN_SIZE = 0;
  const MAX_SIZE = 100;

  // Track panel sizes
  const [horizontalSizes, setHorizontalSizes] = useState([
    DEFAULT_LEFT_WIDTH,
    100 - DEFAULT_LEFT_WIDTH,
  ]);
  const [leftVerticalSizes, setLeftVerticalSizes] = useState([
    DEFAULT_TOP_HEIGHT,
    100 - DEFAULT_TOP_HEIGHT,
  ]);
  const [rightVerticalSizes, setRightVerticalSizes] = useState([
    DEFAULT_TOP_HEIGHT,
    100 - DEFAULT_TOP_HEIGHT,
  ]);
  const [isDragging, setIsDragging] = useState(false);
  const [expandedSection, setExpandedSection] = useState<
    "topLeft" | "topRight" | "bottomLeft" | "bottomRight" | null
  >(null);

  // References to panel groups for programmatic resizing
  const leftPanelGroupRef = useRef<ImperativePanelGroupHandle>(null);
  const rightPanelGroupRef = useRef<ImperativePanelGroupHandle>(null);
  const horizontalPanelGroupRef = useRef<ImperativePanelGroupHandle>(null);

  // Handle panel layout changes with detailed logging
  const handleHorizontalLayoutChange = (sizes: number[]) => {
    setHorizontalSizes(sizes);
  };

  const handleLeftVerticalLayoutChange = (sizes: number[]) => {
    setLeftVerticalSizes(sizes);
  };

  const handleRightVerticalLayoutChange = (sizes: number[]) => {
    setRightVerticalSizes(sizes);
  };

  // Handle expand button clicks
  const handleExpand = (
    section: "topLeft" | "topRight" | "bottomLeft" | "bottomRight"
  ) => {
    // If clicking the same section that's already expanded, restore default layout
    if (expandedSection === section) {
      // Restore default layout
      horizontalPanelGroupRef.current?.setLayout([
        DEFAULT_LEFT_WIDTH,
        100 - DEFAULT_LEFT_WIDTH,
      ]);
      leftPanelGroupRef.current?.setLayout([
        DEFAULT_TOP_HEIGHT,
        100 - DEFAULT_TOP_HEIGHT,
      ]);
      rightPanelGroupRef.current?.setLayout([
        DEFAULT_TOP_HEIGHT,
        100 - DEFAULT_TOP_HEIGHT,
      ]);
      setExpandedSection(null);
      return;
    }

    // Otherwise, expand the clicked section
    switch (section) {
      case "topLeft":
        // Expand left column and top section to full
        horizontalPanelGroupRef.current?.setLayout([100, 0]);
        leftPanelGroupRef.current?.setLayout([100, 0]);
        break;
      case "topRight":
        // Expand right column and top section to full
        horizontalPanelGroupRef.current?.setLayout([0, 100]);
        rightPanelGroupRef.current?.setLayout([100, 0]);
        break;
      case "bottomLeft":
        // Expand left column and bottom section to full
        horizontalPanelGroupRef.current?.setLayout([100, 0]);
        leftPanelGroupRef.current?.setLayout([0, 100]);
        break;
      case "bottomRight":
        // Expand right column and bottom section to full
        horizontalPanelGroupRef.current?.setLayout([0, 100]);
        rightPanelGroupRef.current?.setLayout([0, 100]);
        break;
    }
    setExpandedSection(section);
  };

  // Handle cross-section drag - simplified
  const handleCrossDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startHorizontal = horizontalSizes[0];
    const startLeftVertical = leftVerticalSizes[0];

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = ((moveEvent.clientX - startX) / window.innerWidth) * 100;
      const deltaY = ((moveEvent.clientY - startY) / window.innerHeight) * 100;

      // Update horizontal sizes (width) with 30/70 constraints
      const newHorizontalSize = Math.max(
        MIN_SIZE,
        Math.min(MAX_SIZE, startHorizontal + deltaX)
      );
      horizontalPanelGroupRef.current?.setLayout([
        newHorizontalSize,
        100 - newHorizontalSize,
      ]);

      // Update vertical sizes (height) for both columns with 30/70 constraints
      const newVerticalSize = Math.max(
        MIN_SIZE,
        Math.min(MAX_SIZE, startLeftVertical + deltaY)
      );
      leftPanelGroupRef.current?.setLayout([
        newVerticalSize,
        100 - newVerticalSize,
      ]);
      rightPanelGroupRef.current?.setLayout([
        newVerticalSize,
        100 - newVerticalSize,
      ]);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div className={`h-full w-full ${className} relative`}>
      {/* Main grid layout */}
      <PanelGroup
        ref={horizontalPanelGroupRef}
        direction="horizontal"
        onLayout={handleHorizontalLayoutChange}
        className="h-full w-full"
      >
        {/* Left column */}
        <Panel
          id="left-column"
          defaultSize={DEFAULT_LEFT_WIDTH}
          minSize={MIN_SIZE}
          className="h-full"
        >
          <PanelGroup
            ref={leftPanelGroupRef}
            direction="vertical"
            onLayout={handleLeftVerticalLayoutChange}
            className="h-full"
          >
            {/* Top left panel */}
            <Panel
              id="top-left"
              defaultSize={DEFAULT_TOP_HEIGHT}
              minSize={MIN_SIZE}
              className="h-full relative"
            >
              <ExpandButton
                isExpanded={expandedSection === "topLeft"}
                onClick={() => handleExpand("topLeft")}
              />
              {topLeft}
            </Panel>
            {/* Bottom left panel */}
            <Panel
              id="bottom-left"
              defaultSize={100 - DEFAULT_TOP_HEIGHT}
              minSize={MIN_SIZE}
              className="h-full relative"
            >
              <ExpandButton
                isExpanded={expandedSection === "bottomLeft"}
                onClick={() => handleExpand("bottomLeft")}
              />
              {bottomLeft}
            </Panel>
          </PanelGroup>
        </Panel>

        {/* Right column */}
        <Panel
          id="right-column"
          defaultSize={100 - DEFAULT_LEFT_WIDTH}
          minSize={MIN_SIZE}
          className="h-full"
        >
          <PanelGroup
            ref={rightPanelGroupRef}
            direction="vertical"
            onLayout={handleRightVerticalLayoutChange}
            className="h-full"
          >
            {/* Top right panel */}
            <Panel
              id="top-right"
              defaultSize={DEFAULT_TOP_HEIGHT}
              minSize={MIN_SIZE}
              className="h-full relative"
            >
              <ExpandButton
                isExpanded={expandedSection === "topRight"}
                onClick={() => handleExpand("topRight")}
              />
              {topRight}
            </Panel>
            {/* Bottom right panel */}
            <Panel
              id="bottom-right"
              defaultSize={100 - DEFAULT_TOP_HEIGHT}
              minSize={MIN_SIZE}
              className="h-full relative"
            >
              <ExpandButton
                isExpanded={expandedSection === "bottomRight"}
                onClick={() => handleExpand("bottomRight")}
              />
              {bottomRight}
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>

      {/* Cross-section handle*/}
      <div
        className={`absolute w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-full cursor-move transform -translate-x-1/2 -translate-y-1/2 transition-colors z-50 flex items-center justify-center shadow-md border border-gray-300 ${
          isDragging ? "bg-gray-200 scale-110" : ""
        }`}
        style={{
          left: `${horizontalSizes[0]}%`,
          top: `${leftVerticalSizes[0]}%`,
        }}
        onMouseDown={handleCrossDragStart}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 4h4v4H4V4zm12 0h4v4h-4V4zM4 16h4v4H4v-4zm12 0h4v4h-4v-4z"
            fill="currentColor"
          />
        </svg>
      </div>
    </div>
  );
}
