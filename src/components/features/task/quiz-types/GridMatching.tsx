"use client";

import { useState, useEffect } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import type { GridMatchingQuiz } from "./index";

// Types
type GridMatchingOptions = GridMatchingQuiz["options"];

interface GridMatchingProps {
  options: GridMatchingOptions;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

interface MatchedPair {
  left: string;
  right: string;
}

// Constants
const DEFAULT_LABELS = {
  left: "Items",
  right: "Categories",
} as const;

const DRAG_HANDLE_ICON = (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);

// Sub-components
function DragHandle({
  disabled,
  isDragging,
}: {
  disabled: boolean;
  isDragging: boolean;
}) {
  if (disabled || isDragging) return null;

  return (
    <div className="text-gray-400 hover:text-gray-600">{DRAG_HANDLE_ICON}</div>
  );
}

function MatchedItemBadge({
  text,
  onRemove,
}: {
  text: string;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2 bg-blue-50 text-blue-700 rounded-md px-2 py-1 text-sm border border-blue-200">
      <span className="text-blue-700">{text}</span>
      <button onClick={onRemove} className="text-blue-400 hover:text-blue-600">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function GridMatching({
  options,
  value,
  onChange,
  disabled = false,
}: GridMatchingProps) {
  const {
    leftItems = [],
    rightItems = [],
    leftLabel = DEFAULT_LABELS.left,
    rightLabel = DEFAULT_LABELS.right,
  } = options;

  // Ensure arrays are not undefined
  const safeLeftItems = leftItems ?? [];
  const safeRightItems = rightItems ?? [];

  const [matchedPairs, setMatchedPairs] = useState<MatchedPair[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedOverId, setDraggedOverId] = useState<string | null>(null);

  // Parse initial value into matched pairs
  useEffect(() => {
    if (!value) return;

    try {
      const pairs = value.split(",").map((pair) => {
        const [left, right] = pair.split(":").map((s) => s.trim());
        return { left, right };
      });
      setMatchedPairs(pairs);
    } catch (e) {
      console.error("Error parsing value:", e);
    }
  }, [value]);

  const handleDragStart = () => setIsDragging(true);

  const handleDragEnd = (result: DropResult) => {
    setIsDragging(false);
    setDraggedOverId(null);
    if (!result.destination) return;

    const { source } = result;
    if (source.droppableId !== "left") return;

    const leftItem = safeLeftItems[source.index];
    const rightItem = safeRightItems.find(
      (_, index) =>
        `right-${index}` === draggedOverId?.replace("droppable-", "")
    );

    if (!rightItem) return;

    // Allow multiple matches - only check if this exact pair already exists
    const isExactPairMatched = matchedPairs.some(
      (pair) => pair.left === leftItem && pair.right === rightItem
    );

    if (isExactPairMatched) return;

    const newPairs = [...matchedPairs, { left: leftItem, right: rightItem }];
    setMatchedPairs(newPairs);

    // Update the value
    const formattedValue = newPairs
      .map((pair) => `${pair.left}: ${pair.right}`)
      .join(", ");
    onChange(formattedValue);
  };

  const removePair = (pairToRemove: MatchedPair) => {
    const newPairs = matchedPairs.filter(
      (pair) =>
        !(pair.left === pairToRemove.left && pair.right === pairToRemove.right)
    );
    setMatchedPairs(newPairs);
    const formattedValue = newPairs
      .map((pair) => `${pair.left}: ${pair.right}`)
      .join(", ");
    onChange(formattedValue);
  };

  // Early return if no items provided
  if (!safeLeftItems.length || !safeRightItems.length) {
    return (
      <div className="p-4 text-sm text-gray-500">
        Please provide items for both columns to enable matching.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 text-xs font-medium text-gray-700">
        <span className="flex-1">{leftLabel}</span>
        <span className="flex-1 text-right">{rightLabel}</span>
      </div>

      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4">
          {/* Left Column */}
          <div className="flex-1">
            <Droppable droppableId="left">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={cn(
                    "p-2 rounded-lg border-2 border-dashed transition-colors",
                    isDragging
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  )}
                >
                  {safeLeftItems.map((item: string, index: number) => (
                    <Draggable
                      key={item}
                      draggableId={`left-${item}`}
                      index={index}
                      isDragDisabled={disabled}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={cn(
                            "p-2 mb-1 last:mb-0 rounded-md shadow-sm border transition-all group",
                            snapshot.isDragging
                              ? "shadow-md border-blue-500 ring-2 ring-blue-500 bg-white"
                              : "bg-white border-gray-200 hover:border-gray-300",
                            disabled && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm flex-1">{item}</span>
                            <DragHandle
                              disabled={disabled}
                              isDragging={snapshot.isDragging}
                            />
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* Right Column */}
          <div className="flex-1">
            <div className="grid grid-cols-1 gap-1">
              {safeRightItems.map((item: string, index: number) => {
                const matchesForItem = matchedPairs.filter(
                  (pair) => pair.right === item
                );
                const hasMatches = matchesForItem.length > 0;
                const isBeingDraggedOver =
                  draggedOverId === `droppable-right-${index}`;

                return (
                  <Droppable
                    key={`right-${index}`}
                    droppableId={`right-${index}`}
                  >
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        onMouseEnter={() =>
                          isDragging &&
                          setDraggedOverId(`droppable-right-${index}`)
                        }
                        onMouseLeave={() =>
                          isDragging && setDraggedOverId(null)
                        }
                        className={cn(
                          "rounded-md border transition-all",
                          isBeingDraggedOver
                            ? "border-blue-500 ring-2 ring-blue-500 bg-blue-50"
                            : hasMatches
                            ? "bg-blue-50 border-blue-200"
                            : "bg-white border-gray-200",
                          disabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className="p-2 space-y-2">
                          <div className="flex items-center">
                            <span className="text-sm">{item}</span>
                          </div>
                          {hasMatches && (
                            <div className="space-y-1">
                              {matchesForItem.map((match, idx) => (
                                <MatchedItemBadge
                                  key={`${match.left}-${match.right}-${idx}`}
                                  text={match.left}
                                  onRemove={() => removePair(match)}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                );
              })}
            </div>
          </div>
        </div>
      </DragDropContext>

      <div className="text-xs text-gray-500">
        Drag items from {leftLabel} to {rightLabel} to create matches
      </div>
    </div>
  );
}
