import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type SpinnerSize = "sm" | "md" | "lg";
type SpinnerVariant = "default" | "primary" | "neutral";

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  text?: string;
  className?: string;
  fullPage?: boolean;
}

export function LoadingSpinner({
  size = "md",
  variant = "default",
  text,
  className = "",
  fullPage = false,
}: LoadingSpinnerProps) {
  // Size mappings for the spinner
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  // Variant mappings for colors
  const variantClasses = {
    default: "text-gray-600",
    primary: "text-blue-600",
    neutral: "text-neutral-600",
  };

  // Text size classes
  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  // Container classes when fullPage is true
  const containerClasses = cn(
    fullPage
      ? "min-h-screen flex items-center justify-center bg-gray-50/80 backdrop-blur-sm"
      : "flex items-center justify-center",
    className
  );

  return (
    <div className={containerClasses} role="status">
      <div className="text-center">
        <Loader2
          className={cn(
            "animate-spin mx-auto",
            sizeClasses[size],
            variantClasses[variant]
          )}
          aria-hidden="true"
        />
        {text && (
          <p
            className={cn("text-gray-600 mt-2", textSizeClasses[size])}
            aria-live="polite"
          >
            {text}
          </p>
        )}
        <span className="sr-only">Loading</span>
      </div>
    </div>
  );
}
