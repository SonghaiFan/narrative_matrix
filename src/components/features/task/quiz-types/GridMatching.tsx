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

interface GridMatchingProps {
  options: {
    countries?: string[];
    roles?: string[];
    causes?: string[];
    effects?: string[];
  };
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

interface MatchedPair {
  cause: string;
  effect: string;
}

export function GridMatching({
  options,
  value,
  onChange,
  disabled = false,
}: GridMatchingProps) {
  const isCountryRole = options.countries && options.roles;
  const leftItems = options.countries || options.causes || [];
  const rightItems = options.roles || options.effects || [];
  const leftLabel = options.countries ? "Countries" : "Causes";
  const rightLabel = options.roles ? "Roles" : "Effects";

  const [matchedPairs, setMatchedPairs] = useState<MatchedPair[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedOverId, setDraggedOverId] = useState<string | null>(null);

  // Parse initial value into matched pairs
  useEffect(() => {
    if (value) {
      try {
        const pairs = value.split(",").map((pair) => {
          const [cause, effect] = pair.split(":").map((s) => s.trim());
          return { cause, effect };
        });
        setMatchedPairs(pairs);
      } catch (e) {
        console.error("Error parsing value:", e);
      }
    }
  }, [value]);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (result: DropResult) => {
    setIsDragging(false);
    setDraggedOverId(null);
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    const sourceId = source.droppableId;
    const destId = destination.droppableId;

    // Only allow dragging from left to right
    if (sourceId === "left") {
      const causeItem = leftItems[source.index];
      const effectItem = rightItems.find(
        (_, index) =>
          `right-${index}` === draggedOverId?.replace("droppable-", "")
      );

      if (effectItem) {
        // Allow multiple matches - only check if this exact pair already exists
        const isExactPairMatched = matchedPairs.some(
          (pair) => pair.cause === causeItem && pair.effect === effectItem
        );

        if (!isExactPairMatched) {
          const newPairs = [
            ...matchedPairs,
            { cause: causeItem, effect: effectItem },
          ];
          setMatchedPairs(newPairs);

          // Update the textarea value
          const formattedValue = newPairs
            .map((pair) => `${pair.cause}: ${pair.effect}`)
            .join(", ");
          onChange(formattedValue);
        }
      }
    }
  };

  const removePair = (pairToRemove: MatchedPair) => {
    const newPairs = matchedPairs.filter(
      (pair) =>
        !(
          pair.cause === pairToRemove.cause &&
          pair.effect === pairToRemove.effect
        )
    );
    setMatchedPairs(newPairs);
    const formattedValue = newPairs
      .map((pair) => `${pair.cause}: ${pair.effect}`)
      .join(", ");
    onChange(formattedValue);
  };

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
                  {leftItems.map((item, index) => {
                    const matchesForItem = matchedPairs.filter(
                      (pair) => pair.cause === item
                    );
                    const hasMatches = matchesForItem.length > 0;

                    return (
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
                                : hasMatches
                                ? "bg-green-50 border-green-200"
                                : "bg-white border-gray-200 hover:border-gray-300",
                              disabled && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm flex-1">{item}</span>
                                {!disabled && !snapshot.isDragging && (
                                  <div className="text-gray-400 hover:text-gray-600">
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
                                  </div>
                                )}
                              </div>
                              {hasMatches && (
                                <div className="flex flex-wrap gap-1">
                                  {matchesForItem.map((match, idx) => (
                                    <div
                                      key={`${match.cause}-${match.effect}-${idx}`}
                                      className="flex items-center gap-1 bg-green-100 text-green-700 rounded px-1.5 py-0.5 text-xs"
                                    >
                                      {match.effect}
                                      <button
                                        onClick={() => removePair(match)}
                                        className="hover:text-green-800"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* Right Column */}
          <div className="flex-1">
            <div className="grid grid-cols-1 gap-1">
              {rightItems.map((item, index) => {
                const matchesForItem = matchedPairs.filter(
                  (pair) => pair.effect === item
                );
                const hasMatches = matchesForItem.length > 0;
                const isBeingDraggedOver =
                  draggedOverId === `droppable-right-${index}`;

                return (
                  <Droppable
                    key={`right-${index}`}
                    droppableId={`right-${index}`}
                  >
                    {(provided, snapshot) => (
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
                          "p-2 rounded-md border transition-all min-h-[44px]",
                          isBeingDraggedOver
                            ? "border-blue-500 ring-2 ring-blue-500 bg-blue-50"
                            : hasMatches
                            ? "bg-green-50 border-green-200"
                            : "bg-white border-gray-200",
                          disabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-sm">{item}</span>
                          {hasMatches && (
                            <div className="flex flex-wrap gap-1">
                              {matchesForItem.map((match, idx) => (
                                <div
                                  key={`${match.cause}-${match.effect}-${idx}`}
                                  className="flex items-center gap-1 bg-green-100 text-green-700 rounded px-1.5 py-0.5 text-xs"
                                >
                                  {match.cause}
                                  <button
                                    onClick={() => removePair(match)}
                                    className="hover:text-green-800"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
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
        Drag items from {leftLabel} to {rightLabel} to create matches, or enter
        them manually below
      </div>

      <textarea
        className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        rows={2}
        placeholder={`Enter matches in format: ${
          isCountryRole
            ? "country1: role1, country2: role2"
            : "cause1: effect1, cause2: effect2"
        }...`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
}
