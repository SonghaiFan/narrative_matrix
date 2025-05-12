import React from "react";
import { CheckCircle, X } from "lucide-react";
import {
  QuizItem,
  RadioOptions,
  MultipleSelect,
  NumberedSequence,
  GridMatching,
} from "./quiz-types"; // Adjust path as needed
import { TextInput } from "./quiz-types/TextInput"; // Adjust path as needed

interface TaskAnswerInputProps {
  currentTask: QuizItem;
  userAnswer: string;
  onUserAnswerChange: (answer: string) => void;
  markedEventIds: number[];
  isDomainExpert: boolean;
  showAnswer: boolean; // For domain experts to see the correct answer
  isTaskCompleted: boolean;
  userEventReference: number | number[] | null | undefined;
  onMarkedEventClick: (eventId: number) => void; // To focus on event
  onRemoveMarkedEvent: (eventId: number) => void; // To remove/toggle mark
}

export function TaskAnswerInput({
  currentTask,
  userAnswer,
  onUserAnswerChange,
  markedEventIds,
  isDomainExpert,
  showAnswer,
  isTaskCompleted,
  userEventReference,
  onMarkedEventClick,
  onRemoveMarkedEvent,
}: TaskAnswerInputProps) {
  const renderEventReferences = (
    eventRef: number | number[] | null | undefined,
    isCorrectRef = false
  ) => {
    if (!eventRef) return null;
    const refs = Array.isArray(eventRef) ? eventRef : [eventRef];
    const baseClasses =
      "font-medium px-1 py-0.5 rounded transition-colors text-xs";
    const colorClasses = isCorrectRef
      ? "text-green-600 bg-green-50 hover:bg-green-100 border border-green-300"
      : "text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-300";

    return refs.map((id, index) => (
      <React.Fragment key={`${isCorrectRef ? "correct" : "user"}-event-${id}`}>
        {index > 0 && ", "}
        <button
          onClick={() => onMarkedEventClick(id)}
          className={`${baseClasses} ${colorClasses}`}
        >
          Event #{id}
        </button>
      </React.Fragment>
    ));
  };

  const renderAnswerInput = () => {
    if (!currentTask) return null;

    switch (currentTask.type) {
      case "radio-options":
        return (
          <RadioOptions
            options={currentTask.options}
            value={userAnswer}
            onChange={onUserAnswerChange}
            disabled={showAnswer || isTaskCompleted}
            correctAnswer={showAnswer ? currentTask.answer : undefined}
          />
        );
      case "multiple-select":
        return (
          <MultipleSelect
            options={currentTask.options}
            value={userAnswer}
            onChange={onUserAnswerChange}
            disabled={showAnswer || isTaskCompleted}
            correctAnswer={showAnswer ? currentTask.answer : undefined}
          />
        );
      case "numbered-sequence":
        return (
          <NumberedSequence
            options={currentTask.options}
            value={userAnswer}
            onChange={onUserAnswerChange}
            disabled={showAnswer || isTaskCompleted}
            correctAnswer={showAnswer ? currentTask.answer : undefined}
          />
        );
      case "grid-matching":
        return (
          <GridMatching
            options={currentTask.options}
            value={userAnswer}
            onChange={onUserAnswerChange}
            disabled={showAnswer || isTaskCompleted}
            correctAnswer={showAnswer ? currentTask.answer : undefined}
          />
        );
      default: // single-input
        return (
          <TextInput
            value={userAnswer}
            onChange={onUserAnswerChange}
            disabled={showAnswer || isTaskCompleted}
          />
        );
    }
  };

  const renderCorrectAnswerDisplay = () => {
    if (!currentTask || !isDomainExpert || !showAnswer) return null;

    switch (currentTask.type) {
      case "radio-options":
        return (
          <RadioOptions
            options={currentTask.options as string[]}
            value={currentTask.answer}
            onChange={() => {}}
            disabled={true}
            correctAnswer={currentTask.answer}
          />
        );
      case "multiple-select":
        return (
          <MultipleSelect
            options={currentTask.options as string[]}
            value={currentTask.answer}
            onChange={() => {}}
            disabled={true}
            correctAnswer={currentTask.answer}
          />
        );
      case "numbered-sequence":
        return (
          <NumberedSequence
            options={currentTask.options as any}
            value={currentTask.answer}
            onChange={() => {}}
            disabled={true}
            correctAnswer={currentTask.answer}
          />
        );
      case "grid-matching":
        return (
          <GridMatching
            options={currentTask.options as any}
            value={currentTask.answer}
            onChange={() => {}}
            disabled={true}
            correctAnswer={currentTask.answer}
          />
        );
      default:
        return (
          <TextInput
            value={(currentTask as any).answer}
            onChange={() => {}}
            disabled={true}
          />
        );
    }
  };

  return (
    <div className="bg-white border rounded-lg p-3">
      <div className="space-y-4">
        {/* Step 1: Event Selection */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
              1
            </div>
            <h3 className="text-sm font-medium text-gray-900">
              Mark Reference Events
            </h3>
          </div>
          <div className="bg-blue-50 rounded-md p-3 border border-blue-200">
            <div className="text-xs text-blue-700 mb-2">
              Right-click on the events that contain the information for your
              answer to mark them.
            </div>

            {isDomainExpert && showAnswer && currentTask.event_reference && (
              <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-md">
                <div className="text-xs font-medium text-green-800 mb-1">
                  Correct Reference Events:
                </div>
                <div className="flex flex-wrap gap-2">
                  {renderEventReferences(currentTask.event_reference, true)}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {markedEventIds.length === 0 ? (
                <div className="text-xs text-gray-500 bg-white px-3 py-1.5 rounded-md border border-gray-200">
                  No events marked yet
                </div>
              ) : (
                markedEventIds.map((eventId) => (
                  <div
                    key={`marked-${eventId}`}
                    className="flex items-center gap-1 text-xs text-blue-600 bg-white px-3 py-1.5 rounded-md border border-blue-300 cursor-pointer hover:bg-blue-50"
                    onClick={() => onMarkedEventClick(eventId)} // Focus on click
                  >
                    <span>Event #{eventId}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent parent onClick if any
                        onRemoveMarkedEvent(eventId);
                      }}
                      className="ml-1 text-blue-400 hover:text-blue-600"
                      aria-label={`Remove mark from event ${eventId}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        {/* Step 2: Answer Input */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
              2
            </div>
            <h3 className="text-sm font-medium text-gray-900">
              Provide Your Answer
            </h3>
          </div>

          {!isTaskCompleted ? (
            <div>
              {isDomainExpert && showAnswer && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="text-xs font-medium text-green-800 mb-2">
                    Correct Answer:
                  </div>
                  {renderCorrectAnswerDisplay()}
                </div>
              )}
              {renderAnswerInput()}
            </div>
          ) : (
            <div className="p-2 rounded text-xs flex items-start bg-blue-50 text-blue-800">
              <CheckCircle className="h-3 w-3 mr-1 flex-shrink-0 text-blue-500" />
              <div>
                <p className="font-medium">Answer Submitted</p>
                <p className="mt-0.5">Your answer: {currentTask.userAnswer}</p>
                {userEventReference && (
                  <p className="mt-0.5">
                    Reference Event(s):{" "}
                    {renderEventReferences(userEventReference)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
