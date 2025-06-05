import { useState, useEffect, useRef, useCallback, useMemo } from "react";

interface UseQuestionTimerProps {
  timeLimitMs: number | undefined; // Time in milliseconds for the current question
  onTimeUp: () => void; // Callback when time is up
  onTwentySecondsLeft: () => void; // Callback when 20 seconds are left
  onTimerStart?: () => void; // Callback when timer starts for real tasks
  isPaused: boolean; // Whether the timer should be paused (e.g., modal is open)
  isCompleted: boolean; // Whether the current task is completed
  isTrainingOrDomainExpert: boolean; // True if in training or user is domain expert (for less strict timer)
  currentTaskKey: string; // A key that changes when the current task changes (e.g., task.id)
}

export function useQuestionTimer({
  timeLimitMs,
  onTimeUp,
  onTwentySecondsLeft,
  onTimerStart,
  isPaused,
  isCompleted,
  isTrainingOrDomainExpert,
  currentTaskKey,
}: UseQuestionTimerProps) {
  const [timeLeftMs, setTimeLeftMs] = useState<number | null>(
    timeLimitMs ?? null
  );
  const timerIdRef = useRef<NodeJS.Timeout | null>(null);
  const twentySecondsWarningShownRef = useRef(false);
  const timeUpCalledRef = useRef(false);
  const timerStartWarningShownRef = useRef(false);

  const clearCurrentTimer = useCallback(() => {
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
  }, []);

  // Effect to initialize or reset timer state when the task changes
  useEffect(() => {
    setTimeLeftMs(timeLimitMs ?? null);
    twentySecondsWarningShownRef.current = false;
    timeUpCalledRef.current = false;
    timerStartWarningShownRef.current = false;
    clearCurrentTimer();
  }, [currentTaskKey, timeLimitMs, clearCurrentTimer]);

  // Effect to run the timer interval
  useEffect(() => {
    if (isPaused || isCompleted || !timeLimitMs || timeLeftMs === null) {
      clearCurrentTimer();
      return;
    }

    // If time has already run out (possibly due to state change after reset) and not handled
    if (
      timeLeftMs <= 0 &&
      !isTrainingOrDomainExpert &&
      !timeUpCalledRef.current
    ) {
      timeUpCalledRef.current = true;
      onTimeUp();
      clearCurrentTimer();
      return;
    }

    // Don't start a new interval if one is already running or time is already zero or less
    if (timerIdRef.current || timeLeftMs <= 0) {
      return;
    }

    // Show timer start warning for real tasks (not training, not domain expert)
    if (
      !isTrainingOrDomainExpert &&
      !timerStartWarningShownRef.current &&
      onTimerStart
    ) {
      timerStartWarningShownRef.current = true;
      onTimerStart();
      return; // Don't start the actual timer yet, wait for modal to close
    }

    timerIdRef.current = setInterval(() => {
      setTimeLeftMs((prevTimeLeftMs) => {
        if (prevTimeLeftMs === null) {
          // Should not happen if timeLimitMs is set
          clearCurrentTimer();
          return null;
        }

        const newTimeLeftMs = prevTimeLeftMs - 1000;

        if (!isTrainingOrDomainExpert) {
          // Check for 20 seconds warning (between 20000ms and 19001ms to trigger once)
          if (
            newTimeLeftMs < 20000 &&
            newTimeLeftMs >= 19000 &&
            !twentySecondsWarningShownRef.current
          ) {
            twentySecondsWarningShownRef.current = true;
            onTwentySecondsLeft(); // Signal parent to show modal; parent will set isPaused
          }

          if (newTimeLeftMs <= 0) {
            if (!timeUpCalledRef.current) {
              timeUpCalledRef.current = true;
              onTimeUp();
            }
            clearCurrentTimer();
            return 0;
          }
        } else {
          // For training/domain expert, just let it countdown to 0
          if (newTimeLeftMs <= 0) {
            clearCurrentTimer();
            return 0;
          }
        }
        return newTimeLeftMs;
      });
    }, 1000);

    return clearCurrentTimer; // Cleanup interval on unmount or dependency change
  }, [
    timeLeftMs,
    isPaused,
    isCompleted,
    timeLimitMs,
    isTrainingOrDomainExpert,
    onTimeUp,
    onTwentySecondsLeft,
    onTimerStart,
    clearCurrentTimer,
  ]);

  const formattedTime = useMemo(() => {
    if (timeLeftMs === null) return "--:--";
    const totalSeconds = Math.max(0, Math.floor(timeLeftMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }, [timeLeftMs]);

  const timerColorClass = useMemo(() => {
    if (timeLeftMs === null || !timeLimitMs || isTrainingOrDomainExpert) {
      return "bg-gray-50 text-gray-600 border-gray-200"; // Neutral for training/expert or no/null limit
    }
    const totalSeconds = Math.max(0, Math.floor(timeLeftMs / 1000));
    const initialLimitSeconds = Math.floor(timeLimitMs / 1000);

    if (totalSeconds <= 20)
      return "bg-red-50 text-red-600 border-red-200 animate-pulse";
    if (totalSeconds <= initialLimitSeconds / 2)
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    return "bg-blue-50 text-blue-600 border-blue-100";
  }, [timeLeftMs, timeLimitMs, isTrainingOrDomainExpert]);

  return { timeLeftMs, formattedTime, timerColorClass };
}
