"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/features/auth/app-header";
import { ScenarioSelector } from "@/components/features/dashboard/scenario-selector";
import { UserDataViewer } from "@/components/features/dashboard/local-storage-viewer";
import { useAuth } from "@/contexts/auth-context";
import { useScenarioData } from "@/components/features/dashboard/use-scenario-data";

export interface ScenarioCardProps {
  title: string;
  description: string;
  imageSrc: string;
  onClick: () => void;
  isSelected: boolean;
}

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { data, isLoading: dataLoading, error } = useScenarioData(false);

  // Protect the dashboard page
  useEffect(() => {
    // Only redirect if auth is finished loading and user is not authorized
    if (!authLoading && (!user || user.role !== "domain")) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Show loading state while checking authentication or loading data
  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-neutral-300 border-t-neutral-600 rounded-full animate-spin mb-2"></div>
        <div className="text-neutral-600 text-sm">Loading...</div>
      </div>
    );
  }

  // Show error state if data loading failed
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-red-500 mb-2">Error:</div>
        <div className="text-gray-700 mb-4 text-center max-w-md">
          {error || "Failed to load data"}
        </div>
      </div>
    );
  }

  // Show unauthorized state if user is not a domain expert
  if (!user || user.role !== "domain") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-red-500 mb-2">Unauthorized</div>
        <div className="text-gray-700 mb-4 text-center max-w-md">
          You must be logged in as a domain expert to view this page.
        </div>
      </div>
    );
  }

  // Only domain users should reach this point
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Domain Expert Dashboard" />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <ScenarioSelector />
        <div className="mt-8">
          <UserDataViewer />
        </div>
      </div>
    </div>
  );
}
