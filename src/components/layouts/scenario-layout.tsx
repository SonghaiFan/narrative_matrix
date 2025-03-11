"use client";

import { ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { CenterControlProvider } from "@/contexts/center-control-context";
import { TooltipProvider } from "@/contexts/tooltip-context";
import { AuthHeader } from "@/components/features/auth/auth-header";

interface ScenarioLayoutProps {
  children: ReactNode;
  title: string;
  isLoading?: boolean;
}

export function ScenarioLayout({
  children,
  title,
  isLoading = false,
}: ScenarioLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // get hasCompletedIntro from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasCompletedIntro =
        localStorage.getItem("hasCompletedIntro") === "true";
      if (!hasCompletedIntro) {
        // Get current route using Next.js router
        const scenarioPath = pathname.split("/")[1];
        if (scenarioPath) {
          router.push(`/${scenarioPath}/introduction`);
          return;
        }
        router.push("pure-text/introduction");
      }
    }
  }, [router, pathname]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, router]);

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

  return (
    <CenterControlProvider>
      <TooltipProvider>
        <div className="h-screen w-screen bg-gray-50 flex flex-col overflow-hidden">
          {/* Header */}
          <AuthHeader title={title} />

          {/* Main content */}
          <div className="flex-1 min-h-0">{children}</div>
        </div>
      </TooltipProvider>
    </CenterControlProvider>
  );
}
