"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle } from "lucide-react";

interface UsabilityTestProps {
  onComplete: () => void;
}

export function UsabilityTest({ onComplete }: UsabilityTestProps) {
  const [leftClickDone, setLeftClickDone] = useState(false);
  const [rightClickDone, setRightClickDone] = useState(false);
  const [screenSizeValid, setScreenSizeValid] = useState(false);
  const [showRightClickHint, setShowRightClickHint] = useState(false);
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setScreenSize({ width, height });
      setScreenSizeValid(width >= 1024 && height >= 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleLeftClick = () => {
    setLeftClickDone(true);
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent context menu
    setRightClickDone(true);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent context menu
  };

  // Check if all tests are complete
  if (leftClickDone && rightClickDone && screenSizeValid) {
    setTimeout(onComplete, 1000); // Give user time to see completion
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Usability Test
        </h2>
        <p className="text-gray-600">
          Please verify that your device meets the minimum requirements.
        </p>
      </div>

      <div className="space-y-6">
        {/* Screen Size Test */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900">
              Screen Size Test
            </h3>
            {screenSizeValid ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-gray-300" />
            )}
          </div>
          <div className="text-sm text-gray-600 mb-2">
            Current size: {screenSize.width} × {screenSize.height} pixels
          </div>
          <div className="text-sm text-gray-600">
            Minimum required: 1024 × 768 pixels
          </div>
          {!screenSizeValid && (
            <p className="mt-2 text-xs text-red-500">
              Please resize your browser window or use a larger screen
            </p>
          )}
        </div>

        {/* Left Click Test */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900">
              Left Click Test
            </h3>
            {leftClickDone ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-gray-300" />
            )}
          </div>
          <button
            onClick={handleLeftClick}
            disabled={leftClickDone}
            className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              leftClickDone
                ? "bg-green-50 text-green-700 cursor-default"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            {leftClickDone
              ? "Left Click Verified"
              : "Click Here with Left Mouse Button"}
          </button>
        </div>

        {/* Right Click Test */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900">
              Right Click Test
            </h3>
            {rightClickDone ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-gray-300" />
            )}
          </div>
          <button
            onContextMenu={handleRightClick}
            onClick={handleContextMenu}
            disabled={rightClickDone}
            className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              rightClickDone
                ? "bg-green-50 text-green-700 cursor-default"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            {rightClickDone ? "Right Click Verified" : "Right-Click Here"}
          </button>
          {!rightClickDone && (
            <div className="mt-2 text-xs text-gray-500">
              On Mac, right-click is often a <b>two-finger tap</b> on the
              trackpad, a click in the <b>bottom-right corner</b>, or{" "}
              <b>Control+Click</b>.
            </div>
          )}
          {!rightClickDone && showRightClickHint && (
            <p className="mt-2 text-xs text-gray-500">
              Hint: Press and hold the right mouse button, or use two fingers on
              a trackpad
            </p>
          )}
        </div>

        {/* Completion Message */}
        {leftClickDone && rightClickDone && screenSizeValid && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-700 font-medium">
              Usability test completed successfully!
            </p>
            <p className="text-sm text-green-600 mt-1">
              Proceeding to the next step...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
