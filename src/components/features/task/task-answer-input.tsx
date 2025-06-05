import React from "react";
import { CheckCircle, X, HelpCircle } from "lucide-react";
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
  onNoneOfAbove?: () => void; // New prop for "None of above" functionality
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
  onNoneOfAbove,
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
        {/* Answer Input Section */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Your Answer
          </h3>

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

              {/* "None of above" button */}
              {!isTaskCompleted && !showAnswer && onNoneOfAbove && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={onNoneOfAbove}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-amber-300 bg-amber-50 text-amber-700 rounded-md hover:bg-amber-100 hover:border-amber-400 transition-colors text-sm font-medium shadow-sm"
                  >
                    <HelpCircle className="h-4 w-4" />
                    None of above
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-2 rounded text-xs flex items-start bg-blue-50 text-blue-800">
              <CheckCircle className="h-3 w-3 mr-1 flex-shrink-0 text-blue-500" />
              <div>
                <p className="font-medium">Answer Submitted</p>
                <p className="mt-0.5">Your answer: {currentTask.userAnswer}</p>
              </div>
            </div>
          )}
        </div>

        {/* References Section border-t*/}
        <div className="pt-4">
          {/* <h3 className="text-sm font-medium text-gray-900 mb-3">
            Marked References
          </h3> */}

          {/* Domain Expert Suggested References */}
          {/* {isDomainExpert && showAnswer && currentTask.event_reference && (
            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="text-xs font-medium text-green-800 mb-2">
                Suggested References
              </div>
              <div className="space-y-2">
                {Array.isArray(currentTask.event_reference) ? (
                  currentTask.event_reference.map((id) => (
                    <div
                      key={`suggested-${id}`}
                      className="flex items-start gap-2 text-xs text-green-800 hover:bg-green-100 p-2 rounded-md cursor-pointer"
                      onClick={() => onMarkedEventClick(id)}
                    >
                      <span className="font-medium">[{id}]</span>
                      <span>Event #{id}</span>
                    </div>
                  ))
                ) : (
                  <div
                    className="flex items-start gap-2 text-xs text-green-800 hover:bg-green-100 p-2 rounded-md cursor-pointer"
                    onClick={() =>
                      currentTask.event_reference &&
                      onMarkedEventClick(currentTask.event_reference as number)
                    }
                  >
                    <span className="font-medium">
                      [{currentTask.event_reference}]
                    </span>
                    <span>Event #{currentTask.event_reference}</span>
                  </div>
                )}
              </div>
            </div>
          )} */}

          {/* User's Marked References */}
          {/* <div className="bg-gray-50 border border-gray-200 rounded-md">
            <div className="p-3">
              <div className="text-xs text-gray-600 mb-3">
                Right-click on events to add them to your references
              </div>

              <div className="space-y-2">
                {markedEventIds.length === 0 ? (
                  <div className="text-xs text-gray-500 bg-white p-3 rounded-md border border-gray-200 text-center">
                    No references marked
                  </div>
                ) : (
                  markedEventIds.map((eventId, index) => (
                    <div
                      key={`marked-${eventId}`}
                      className="flex items-start gap-2 bg-white p-2 rounded-md border border-gray-200 hover:border-blue-300 transition-colors"
                    >
                      <span className="font-medium text-xs text-gray-500 mt-0.5">
                        [{index + 1}]
                      </span>
                      <div className="flex-1 flex items-center justify-between">
                        <button
                          onClick={() => onMarkedEventClick(eventId)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Event #{eventId}
                        </button>
                        <button
                          onClick={() => onRemoveMarkedEvent(eventId)}
                          className="text-gray-400 hover:text-gray-600"
                          aria-label={`Remove reference ${eventId}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div> */}

          {/* Completed Task References Display */}
          {/* {isTaskCompleted && userEventReference && (
            <div className="mt-3 p-2 rounded text-xs bg-blue-50 text-blue-800">
              <p className="font-medium mb-1">Submitted References:</p>
              <div className="space-y-1">
                {(Array.isArray(userEventReference)
                  ? userEventReference
                  : [userEventReference]
                ).map((id) => (
                  <div
                    key={`submitted-${id}`}
                    className="flex items-center gap-2 cursor-pointer hover:text-blue-600"
                    onClick={() => onMarkedEventClick(id)}
                  >
                    <span>Event #{id}</span>
                  </div>
                ))}
              </div>
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
}
