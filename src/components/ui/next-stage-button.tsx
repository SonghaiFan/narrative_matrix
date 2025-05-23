"use client";

import { useRouter } from "next/navigation";
import { useNavigationStore, NavigationStage } from "@/store/navigation-store";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

interface NextStageButtonProps {
  label?: string;
  targetStage?: NavigationStage; // Explicitly target a stage (otherwise use next stage)
  className?: string;
  completeCurrentStage?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "outline";
  showIcon?: boolean;
  fullWidth?: boolean;
}

// Get appropriate label based on the target stage
const getStageLabel = (stage: NavigationStage): string => {
  switch (stage) {
    case "intro":
      return "Start Introduction";
    case "training":
      return "Continue to Training";
    case "task":
      return "Start Real Tasks";
    case "complete":
      return "Complete Study";
    default:
      return "Continue";
  }
};

export function NextStageButton({
  label,
  targetStage,
  className = "",
  completeCurrentStage = true,
  size = "md",
  variant = "primary",
  showIcon = true,
  fullWidth = false,
}: NextStageButtonProps) {
  const router = useRouter();
  const {
    getCurrentStage,
    getNextStage,
    goToNextStage,
    goToStage,
    completeCurrentStage: markCurrentStageComplete,
    getCurrentFlowIndex,
  } = useNavigationStore();

  // Determine which stage to navigate to
  const nextStage = targetStage || getNextStage() || "task";

  // Get appropriate button text
  const buttonLabel = label || getStageLabel(nextStage);

  const handleClick = () => {
    // Mark current stage as complete if requested
    if (completeCurrentStage) {
      markCurrentStageComplete();
    }

    // Navigate to the appropriate URL
    // If targetStage is specified, we need to find the appropriate flow index for that stage
    // For now, we'll default to using goToNextStage() as it already handles the proper navigation
    const targetUrl = targetStage ? goToNextStage() : goToNextStage();
    router.push(targetUrl);
  };

  return (
    <Button
      onClick={handleClick}
      className={className}
      size={size}
      variant={variant}
      fullWidth={fullWidth}
    >
      {buttonLabel}
      {showIcon && <FontAwesomeIcon icon={faArrowRight} className="ml-2" />}
    </Button>
  );
}
