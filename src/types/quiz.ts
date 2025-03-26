import { NarrativeEvent } from "./narrative/lite";

export type QuizLevel =
  | "Information Retrieval"
  | "Pattern Recognition"
  | "Causal Reasoning"
  | "Sanity Check";

export type QuizType =
  | "single-input"
  | "multiple-select"
  | "radio-options"
  | "numbered-sequence"
  | "grid-matching"
  | "long-text"
  | "comma-separated";

interface BaseQuizItem {
  id: string;
  question: string;
  answer: string;
  level: QuizLevel;
  completed: boolean;
  type: QuizType;
  event_reference: number | number[] | null;
}

export interface SingleInputQuiz extends BaseQuizItem {
  type: "single-input";
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
    events: Array<{
      id: number;
      text: string;
    }>;
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

export interface LongTextQuiz extends BaseQuizItem {
  type: "long-text";
}

export interface CommaSeparatedQuiz extends BaseQuizItem {
  type: "comma-separated";
}

export type QuizItem =
  | SingleInputQuiz
  | MultipleSelectQuiz
  | RadioOptionsQuiz
  | NumberedSequenceQuiz
  | GridMatchingQuiz
  | LongTextQuiz
  | CommaSeparatedQuiz;

export interface Quiz {
  items: QuizItem[];
}
