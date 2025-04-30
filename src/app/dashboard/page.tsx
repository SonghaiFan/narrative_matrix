"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/ui/app-header";
import { ScenarioSelector } from "@/components/features/dashboard/scenario-selector";
import { UserDataViewer } from "@/components/features/dashboard/local-storage-viewer";
import { useAuth } from "@/contexts/auth-context";
import { Loading } from "@/components/ui/loading-spring";

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Protect the dashboard page
  useEffect(() => {
    // Only redirect if auth is finished loading and user is not authorized
    if (!authLoading && (!user || user.role !== "domain")) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Show loading state while checking authentication
  if (authLoading || isLoading) {
    return <Loading fullScreen text="Loading..." />;
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
        <div className="max-w-2xl mx-auto mb-8">
          <ScenarioSelector />
        </div>

        <div className="mt-8">
          <UserDataViewer />
        </div>
      </div>
    </div>
  );
}
