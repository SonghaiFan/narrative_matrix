import { QuizItem } from "@/components/features/task/quiz-types";

/**
 * Checks if a user's answer matches the correct answer for a quiz item
 * @param task - The quiz item with the correct answer
 * @param answerToCheck - The user's answer to validate
 * @returns true if the answer is correct, false otherwise
 */
export function checkAnswer(task: QuizItem, answerToCheck: string): boolean {
  if (!answerToCheck.trim()) return false;

  const normalize = (str: string) =>
    str.toLowerCase().trim().replace(/\s+/g, " ");

  switch (task.type) {
    case "radio-options":
      return normalize(task.answer) === normalize(answerToCheck);

    case "multiple-select":
      const normalizeAndSort = (str: string) =>
        str
          .split(",")
          .map((item) => normalize(item))
          .filter(Boolean)
          .sort();
      const correctItems = normalizeAndSort(task.answer);
      const userItems = normalizeAndSort(answerToCheck);
      if (correctItems.length !== userItems.length) return false;
      return correctItems.every((item, index) => item === userItems[index]);

    case "numbered-sequence":
      return (
        task.answer.replace(/\s+/g, "") === answerToCheck.replace(/\s+/g, "")
      );

    case "grid-matching":
      try {
        const parseGridString = (str: string) => {
          const pairs = str.split(",").map((pair) => pair.trim());
          return pairs.reduce((acc, pair) => {
            const [key, value] = pair.split(":").map((s) => normalize(s));
            if (key && value !== undefined) acc[key] = value;
            return acc;
          }, {} as Record<string, string>);
        };
        const correctPairs = parseGridString(task.answer);
        const userPairs = parseGridString(answerToCheck);
        const correctKeys = Object.keys(correctPairs).sort();
        const userKeys = Object.keys(userPairs).sort();
        if (
          correctKeys.length !== userKeys.length ||
          correctKeys.some((key) => !userPairs.hasOwnProperty(key))
        )
          return false;
        return correctKeys.every((key) => correctPairs[key] === userPairs[key]);
      } catch {
        return false;
      }

    default: // single-input or any other type not explicitly handled by variants
      // Check if task.answer is a string before normalizing, as it could be from a variant not having 'answer' or it being of a different type.
      const baseTask = task as any; // Use 'any' carefully, or ensure 'answer' is on a common base type for all QuizItem variants.
      if (typeof baseTask.answer === "string") {
        return normalize(baseTask.answer) === normalize(answerToCheck);
      }
      return false;
  }
}
