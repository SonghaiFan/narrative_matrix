"use client";

import { useState, useEffect } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";

interface Event {
  id: number;
  text: string;
}

interface NumberedSequenceProps {
  options: string[] | { events: Event[] };
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

interface DraggableEvent extends Event {
  currentPosition: number;
}

export function NumberedSequence({
  options,
  value,
  onChange,
  disabled = false,
}: NumberedSequenceProps) {
  // Initialize events with their current positions
  const initialEvents: DraggableEvent[] = Array.isArray(options)
    ? options.map((text, index) => ({
        id: index + 1,
        text: text.replace(/^\d+\.\s*/, ""), // Remove the numbering prefix if present
        currentPosition: index + 1,
      }))
    : options.events.map((event) => ({
        ...event,
        currentPosition: event.id,
      }));

  const [events, setEvents] = useState<DraggableEvent[]>(initialEvents);
  const [isDragging, setIsDragging] = useState(false);

  // Parse the value string into numbers array and update positions
  useEffect(() => {
    if (value) {
      try {
        const sequence = value.split(",").map((n) => parseInt(n.trim()));
        if (
          sequence.length === events.length &&
          sequence.every((n) => !isNaN(n))
        ) {
          const newEvents = [...events];
          // Create a mapping of id to position
          const positionMap = new Map(
            sequence.map((id, index) => [id, index + 1])
          );
          // Update positions while keeping original IDs
          newEvents.forEach((event) => {
            event.currentPosition =
              positionMap.get(event.id) || event.currentPosition;
          });
          // Sort events by current position
          newEvents.sort((a, b) => a.currentPosition - b.currentPosition);
          setEvents(newEvents);
        }
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
    if (!result.destination) return;

    const newEvents = Array.from(events);
    const [reorderedEvent] = newEvents.splice(result.source.index, 1);
    newEvents.splice(result.destination.index, 0, reorderedEvent);

    // Update only positions based on new order, keeping original IDs
    const reorderedEvents = newEvents.map((event, index) => ({
      ...event,
      currentPosition: index + 1,
    }));

    setEvents(reorderedEvents);

    // Generate value string using the original IDs in their new order
    const valueString = reorderedEvents.map((event) => event.id).join(",");
    onChange(valueString);
  };

  return (
    <div className="space-y-2">
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <Droppable droppableId="sequence">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={cn(
                "space-y-1 p-2 rounded-lg border-2 border-dashed transition-colors",
                isDragging ? "border-blue-500 bg-blue-50" : "border-gray-200"
              )}
            >
              {events.map((event, index) => (
                <Draggable
                  key={event.id}
                  draggableId={`event-${event.id}`}
                  index={index}
                  isDragDisabled={disabled}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={cn(
                        "p-2 rounded-md bg-white shadow-sm border transition-all",
                        snapshot.isDragging
                          ? "shadow-md border-blue-500 ring-2 ring-blue-500"
                          : "border-gray-200 hover:border-gray-300",
                        disabled && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-medium text-sm">
                          {event.id}
                        </div>
                        <span className="text-sm flex-1">{event.text}</span>
                        {!disabled && (
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
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="text-xs text-gray-500">
        Drag and drop events to reorder them, or enter the sequence manually
        below
      </div>

      <textarea
        className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        rows={2}
        placeholder="Enter the event numbers in order (e.g., 1,2,3,4)..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
}
