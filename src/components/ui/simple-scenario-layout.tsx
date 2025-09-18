"use client";

import { ReactNode, useEffect, useState } from "react";
import { CenterControlProvider } from "@/contexts/center-control-context";
import { TooltipProvider } from "@/contexts/tooltip-context";
import { loadDataFile } from "@/lib/data-storage";
import SentimentLegend from "@/components/features/narrative/shared/sentiment-legend";

interface SimpleScenarioLayoutProps {
  title: string;
  children: (data: { metadata: any; events: any[] }) => ReactNode;
}

export function SimpleScenarioLayout({
  title,
  children,
}: SimpleScenarioLayoutProps) {
  const [data, setData] = useState<{ metadata: any; events: any[] } | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data immediately without authentication checks
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const loadedData = await loadDataFile<{ metadata: any; events: any[] }>(
          "data.json"
        );
        setData(loadedData);
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Show loading overlay for data loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-neutral-300 border-t-neutral-600 rounded-full animate-spin mb-2"></div>
        <div className="text-neutral-600 text-sm">Loading data...</div>
      </div>
    );
  }

  // Show error state
  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-red-600 text-sm">
          {error || "No data available"}
        </div>
      </div>
    );
  }

  return (
    <CenterControlProvider>
      <TooltipProvider>
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50">
          {/* Simple Header */}
          <div className="flex-none bg-white border-b border-gray-200 px-6 py-3">
            <div className="flex items-center justify-between relative">
              {/* Left: Title */}
              <h1 className="text-xl font-semibold text-gray-900 whitespace-nowrap pr-4">
                {title}
              </h1>

              {/* Center: Legend (absolutely centered independent of side widths) */}
              {/* <div className="absolute left-1/2 -translate-x-1/2">
                <SentimentLegend compact />
              </div> */}

              {/* Right: Back link */}
              <a
                href="/"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors whitespace-nowrap pl-4"
              >
                ← Back to Demo Selection
              </a>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-h-0">{children(data)}</div>
        </div>
      </TooltipProvider>
    </CenterControlProvider>
  );
}
