"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle } from "lucide-react";

interface UsabilityTestProps {
  onComplete: () => void;
}

export function UsabilityTest({ onComplete }: UsabilityTestProps) {
  const [screenSizeValid, setScreenSizeValid] = useState(false);
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setScreenSize({ width, height });
      setScreenSizeValid(width >= 800 && height >= 600);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Check if test is complete
  if (screenSizeValid) {
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
            Minimum required: 800 × 600 pixels
          </div>
          {!screenSizeValid && (
            <p className="mt-2 text-xs text-red-500">
              Please resize your browser window or use a larger screen
            </p>
          )}
        </div>

        {/* Completion Message */}
        {screenSizeValid && (
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
