// Types
export type QuizLevel =
  | "Information Retrieval"
  | "Pattern Recognition"
  | "Causal Reasoning"
  | "Sanity Check";

export type QuizType =
  | "radio-options"
  | "numbered-sequence"
  | "grid-matching"
  | "multiple-select"
  | "single-input";

export type QuizProne = "entity" | "topic" | "time" | null;

interface BaseQuizItem {
  id: string;
  question: string;
  answer: string;
  level: QuizLevel;
  completed: boolean;
  type: QuizType;
  prone: QuizProne;
  event_reference: number | number[] | null;
  timeLimit?: number;
  completionTime?: number;
  startTimestamp?: number;
  submitTimestamp?: number;
  userAnswer?: string;
  userEventReference?: number | number[] | null;
}

export interface MultipleSelectQuiz extends BaseQuizItem {
  type: "multiple-select";
  options: string[];
}

export interface RadioOptionsQuiz extends BaseQuizItem {
  type: "radio-options";
  options: string[];
}

export interface NumberedSequenceQuiz extends BaseQuizItem {
  type: "numbered-sequence";
  options: {
    events: Array<{ id: number; text: string }>;
  };
}

export interface GridMatchingQuiz extends BaseQuizItem {
  type: "grid-matching";
  options: {
    leftItems: string[];
    rightItems: string[];
    leftLabel?: string;
    rightLabel?: string;
  };
}

export type QuizItem =
  | MultipleSelectQuiz
  | RadioOptionsQuiz
  | NumberedSequenceQuiz
  | GridMatchingQuiz;

export interface Quiz {
  items: QuizItem[];
}

// Component exports
export { MultipleSelect } from "./MultipleSelect";
export { RadioOptions } from "./RadioOptions";
export { NumberedSequence } from "./NumberedSequence";
export { GridMatching } from "./GridMatching";
