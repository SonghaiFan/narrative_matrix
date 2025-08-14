"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { CenterControlProvider } from "@/contexts/center-control-context";
import { TooltipProvider } from "@/contexts/tooltip-context";
import { AuthHeader } from "@/components/features/auth/auth-header";
import { loadDataFile } from "@/lib/data-storage";

interface SimpleScenarioLayoutProps {
  title: string;
  children: (data: { metadata: any; events: any[] }) => ReactNode;
}

export function SimpleScenarioLayout({ title, children }: SimpleScenarioLayoutProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<{ metadata: any; events: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, router]);

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const loadedData = await loadDataFile<{ metadata: any; events: any[] }>("data.json");
        setData(loadedData);
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-neutral-300 border-t-neutral-600 rounded-full animate-spin mb-2"></div>
        <div className="text-neutral-600 text-sm">
          Checking authentication...
        </div>
      </div>
    );
  }

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
        <div className="text-red-600 text-sm">{error || "No data available"}</div>
      </div>
    );
  }

  return (
    <CenterControlProvider>
      <TooltipProvider>
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50">
          {/* Header */}
          <AuthHeader title={title} />

          {/* Main content */}
          <div className="flex-1 min-h-0">
            {children(data)}
          </div>
        </div>
      </TooltipProvider>
    </CenterControlProvider>
  );
}