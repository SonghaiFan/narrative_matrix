import { useState, useEffect, useCallback } from "react";
import { loadDataFile } from "@/lib/data-storage";
import { QuizItem, Quiz } from "@/components/features/task/quiz-types"; // Assuming this path is correct
import { NarrativeEvent, DatasetMetadata } from "@/types/lite";

interface UseQuizLoaderProps {
  isTraining: boolean;
  events: NarrativeEvent[] | undefined;
  datasetMetadata: DatasetMetadata | undefined;
  passedInQuiz: Quiz | undefined; // Quiz data passed via props (already processed by server)
}

export function useQuizLoader({
  isTraining,
  events,
  datasetMetadata,
  passedInQuiz,
}: UseQuizLoaderProps) {
  const [tasks, setTasks] = useState<QuizItem[]>([]);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(true);
  const [quizError, setQuizError] = useState<Error | null>(null);

  const processQuizData = useCallback(
    (quizData: any[], isRecall = false): QuizItem[] => {
      if (!quizData || !Array.isArray(quizData)) return [];
      return quizData.map((q: any, index: number) => {
        let defaultTimeLimit = 60000; // Default 60 seconds in milliseconds
        if (q.type === "grid-matching") defaultTimeLimit = 180000;
        else if (q.type === "numbered-sequence") defaultTimeLimit = 120000;
        else if (q.type === "multiple-select") defaultTimeLimit = 90000;

        const uniqueId = isRecall
          ? q.id
            ? `recall_${q.id}`
            : `recall_${index + 1}`
          : q.id || String(index + 1);

        return {
          id: uniqueId,
          level: q.level || "Information Retrieval",
          question: q.question,
          answer: q.answer,
          type: q.type || "single-input",
          options: q.options,
          event_reference: q.event_reference || null,
          timeLimit: q.timeLimit ? q.timeLimit * 1000 : defaultTimeLimit, // Expecting seconds from data, convert to MS
          completed: false,
          visual: q.visual || null,
          prone: q.prone || null,
          questionCaption: q.questionCaption || "",
        } as QuizItem;
      });
    },
    []
  );

  const sortTasks = useCallback(
    (tasksToSort: QuizItem[], preference?: string): QuizItem[] => {
      if (!preference || preference === "default") {
        return tasksToSort; // Default order
      }
      if (preference === "reverse") {
        return [...tasksToSort].reverse();
      }
      // Add more sorting strategies as required
      console.warn(`Unsupported quiz_order_preference: ${preference}`);
      return tasksToSort;
    },
    []
  );

  useEffect(() => {
    let mounted = true;
    setIsLoadingQuiz(true);
    setQuizError(null);

    const loadTasks = async () => {
      let finalTasks: QuizItem[] = [];
      let loadingError: Error | null = null;

      try {
        if (passedInQuiz?.quiz && Array.isArray(passedInQuiz.quiz)) {
          console.log("[useQuizLoader] Using pre-loaded quiz data from props");
          finalTasks = processQuizData(passedInQuiz.quiz);
          if (finalTasks.length === 0) {
            console.warn(
              "[useQuizLoader] Quiz prop provided but yielded no tasks."
            );
          }
        } else if (isTraining) {
          console.log(
            "[useQuizLoader] Mode: Training, loading train_quiz_data.json"
          );
          const trainingData = await loadDataFile<{ quiz: any[] }>(
            "train_quiz_data.json"
          );
          finalTasks = processQuizData(trainingData?.quiz);
          if (finalTasks.length === 0) {
            console.warn(
              "[useQuizLoader] Training quiz file loaded but yielded no tasks."
            );
          }
        } else {
          console.log(
            "[useQuizLoader] Mode: Real Task, loading quiz_data.json"
          );
          try {
            const publicQuizData = await loadDataFile<{
              quiz: any[];
              quiz_recall?: any[];
            }>("quiz_data.json");
            let combinedTasks = processQuizData(publicQuizData?.quiz);
            if (
              publicQuizData?.quiz_recall &&
              Array.isArray(publicQuizData.quiz_recall)
            ) {
              const recallTasks = processQuizData(
                publicQuizData.quiz_recall,
                true
              );
              combinedTasks = [...recallTasks, ...combinedTasks]; // Prepend recall tasks
            }
            finalTasks = sortTasks(
              combinedTasks,
              datasetMetadata?.quiz_order_preference || "default"
            );
            if (finalTasks.length === 0) {
              console.warn(
                "[useQuizLoader] public/quiz_data.json loaded but yielded no tasks. Attempting fallback."
              );
            }
          } catch (publicLoadError) {
            console.error(
              "[useQuizLoader] Failed to load public/quiz_data.json. Attempting fallback.",
              publicLoadError
            );
            // Let fallback handle it
          }
        }

        if (
          !isTraining &&
          finalTasks.length === 0 &&
          events &&
          events.length > 0
        ) {
          console.log(
            "[useQuizLoader] Fallback: Auto-generating tasks based on events."
          );
          finalTasks = [
            {
              id: "gen-1",
              level: "Information Retrieval",
              type: "single-input",
              question: "What was the date of the first major event?",
              answer: (() => {
                const timeValue = events[0].temporal_anchoring?.real_time;
                let dateInput: string | number | Date = "";
                if (Array.isArray(timeValue)) dateInput = timeValue[0];
                else if (timeValue) dateInput = timeValue;
                try {
                  return new Date(dateInput).toLocaleDateString();
                } catch {
                  return "Invalid Date";
                }
              })(),
              completed: false,
              timeLimit: 60000,
              visual: null,
              event_reference: null,
              prone: null,
              questionCaption: "",
            },
            {
              id: "gen-2",
              level: "Information Retrieval",
              type: "radio-options",
              question: "How many total events are in this dataset?",
              answer: events.length.toString(),
              options: [
                (events.length - 2).toString(),
                (events.length - 1).toString(),
                events.length.toString(),
                (events.length + 1).toString(),
              ],
              completed: false,
              timeLimit: 60000,
              visual: null,
              event_reference: null,
              prone: null,
              questionCaption: "",
            },
          ] as QuizItem[];
        }

        const seenIds = new Set<string>();
        finalTasks.forEach((task, index) => {
          if (seenIds.has(task.id)) {
            task.id = `${task.id}_dup_${index}`;
          }
          seenIds.add(task.id);
        });

        if (mounted) setTasks(finalTasks);
      } catch (err) {
        console.error(
          "[useQuizLoader] General error during task loading:",
          err
        );
        loadingError = err instanceof Error ? err : new Error(String(err));
        if (mounted) {
          setTasks([]);
          setQuizError(loadingError);
        }
      } finally {
        if (mounted) setIsLoadingQuiz(false);
      }
    };

    loadTasks();

    return () => {
      mounted = false;
    };
  }, [
    isTraining,
    events,
    datasetMetadata,
    passedInQuiz,
    processQuizData,
    sortTasks,
  ]);

  return { tasks, isLoadingQuiz, quizError };
}
