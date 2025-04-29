"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  className?: string;
  fullScreen?: boolean;
}

export default function ScenarioError({
  error,
  reset,
  className,
  fullScreen = false,
}: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  const containerClasses = cn(
    "flex flex-col items-center justify-center w-full h-full gap-4 p-6",
    fullScreen && "fixed inset-0 bg-background/80 backdrop-blur-sm",
    className
  );

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="rounded-full bg-destructive/10 p-3">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-destructive">
            Something went wrong!
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            {error.message || "An unexpected error occurred."}
          </p>
        </div>
      </div>
      <button
        onClick={reset}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 mt-2"
      >
        Try again
      </button>
    </div>
  );
}
