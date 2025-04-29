import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "primary" | "neutral";
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

export function Loading({
  size = "md",
  variant = "default",
  text = "Loading...",
  className,
  fullScreen = false,
}: LoadingProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const variantClasses = {
    default: "text-gray-600",
    primary: "text-blue-600",
    neutral: "text-neutral-600",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const containerClasses = cn(
    "flex flex-col items-center justify-center w-full h-full gap-2",
    fullScreen && "fixed inset-0 bg-background/80 backdrop-blur-sm",
    className
  );

  return (
    <div className={containerClasses}>
      <Loader2
        className={cn(
          "animate-spin",
          sizeClasses[size],
          variantClasses[variant]
        )}
      />
      {text && (
        <div
          className={cn(
            "text-muted-foreground font-medium",
            textSizeClasses[size]
          )}
        >
          {text}
        </div>
      )}
    </div>
  );
}
