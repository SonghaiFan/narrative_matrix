"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useQuizStore } from "@/store/quiz-store";
import { cn } from "@/lib/utils";
import { Timer, AlertCircle } from "lucide-react";

interface QuizTimerProps {
  timeLimit: number;
  onTimeUp: () => void;
  className?: string;
}

export function QuizTimer({ timeLimit, onTimeUp, className }: QuizTimerProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [completionTime, setCompletionTime] = useState<number | null>(null);
  const { setCurrentQuizCompletionTime } = useQuizStore();
  const [isWarning, setIsWarning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasCalledTimeUp = useRef(false);

  // Determine if we're in warning zone (less than 25% of time remaining)
  const warningThreshold = Math.floor(timeLimit * 0.25);

  // Reset timer when timeLimit changes
  useEffect(() => {
    setTimeLeft(timeLimit);
    setStartTime(Date.now());
    setIsWarning(false);
    hasCalledTimeUp.current = false;
  }, [timeLimit]);

  // Start timer when component mounts
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setStartTime(Date.now());

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        // Set warning state when time is running low
        if (prev <= warningThreshold && !isWarning) {
          setIsWarning(true);
        }

        if (prev <= 1) {
          // Clear the interval immediately to prevent multiple calls
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }

          // Ensure we only call onTimeUp once
          if (!hasCalledTimeUp.current) {
            hasCalledTimeUp.current = true;
            // Use setTimeout to ensure state updates are processed first
            setTimeout(() => onTimeUp(), 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [onTimeUp, timeLimit, warningThreshold, isWarning]);

  // Track completion time
  const handleCompletion = useCallback(() => {
    if (startTime) {
      const endTime = Date.now();
      const timeTaken = Math.round((endTime - startTime) / 1000);
      setCompletionTime(timeTaken);
      setCurrentQuizCompletionTime(timeTaken);
    }
  }, [startTime, setCurrentQuizCompletionTime]);

  // Format time display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Get animation and color based on time remaining
  const getTimerStyles = () => {
    if (timeLeft <= warningThreshold) {
      return {
        wrapperClass: "bg-red-50 border-red-200",
        textClass: "text-red-600",
        animation: isWarning ? "animate-pulse" : "",
      };
    }
    if (timeLeft <= timeLimit / 2) {
      return {
        wrapperClass: "bg-yellow-50 border-yellow-200",
        textClass: "text-yellow-700",
        animation: "",
      };
    }
    return {
      wrapperClass: "bg-green-50 border-green-200",
      textClass: "text-green-600",
      animation: "",
    };
  };

  const timerStyles = getTimerStyles();

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        className={cn(
          "flex items-center px-3 py-1.5 rounded-lg border shadow-sm",
          timerStyles.wrapperClass,
          timerStyles.animation
        )}
      >
        <div className="flex flex-col items-center">
          <div className="flex items-center">
            {timeLeft <= warningThreshold ? (
              <AlertCircle
                className={cn("h-3.5 w-3.5 mr-1.5", timerStyles.textClass)}
              />
            ) : (
              <Timer
                className={cn("h-3.5 w-3.5 mr-1.5", timerStyles.textClass)}
              />
            )}
            <span className={cn("font-bold", timerStyles.textClass)}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <span className="text-[10px] text-gray-500">Question Timer</span>
        </div>
      </div>
    </div>
  );
}
