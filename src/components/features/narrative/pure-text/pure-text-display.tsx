"use client";

import { Entity, NarrativeEvent, DatasetMetadata } from "@/types/data";
import { useMemo, useRef, useEffect, useCallback } from "react";
import { PURE_TEXT_CONFIG } from "./pure-text-config";
import { useCenterControl } from "@/contexts/center-control-context";
import { SHARED_CONFIG } from "@/components/features/narrative/shared/visualization-config";
import {
  ArticleLayout,
  ArticleSection,
  ArticleParagraph,
} from "./article-layout";

interface PureTextDisplayProps {
  events: NarrativeEvent[];
  metadata?: DatasetMetadata;
}

export function PureTextDisplay({ events, metadata }: PureTextDisplayProps) {
  const {
    focusedEventId,
    setfocusedEventId,
    markedEventIds,
    toggleMarkedEvent,
    isEventMarked,
  } = useCenterControl();
  const eventRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { text, margin } = PURE_TEXT_CONFIG;

  // Sort events by narrative time
  const sortedEvents = useMemo(() => {
    return [...events].sort(
      (a, b) =>
        a.temporal_anchoring.narrative_time -
        b.temporal_anchoring.narrative_time
    );
  }, [events]);

  // Effect to scroll selected event into view
  useEffect(() => {
    if (focusedEventId !== null && eventRefs.current[focusedEventId]) {
      eventRefs.current[focusedEventId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [focusedEventId]);

  // Function to highlight entities in text
  const highlightEntities = useCallback((text: string, entities: Entity[]) => {
    if (!entities.length) return text;

    // Sort entities by name length (descending) to prevent shorter names from breaking longer ones
    const sortedEntities = [...entities].sort(
      (a, b) => b.name.length - a.name.length
    );

    let result = text;
    let placeholders: Record<string, string> = {};
    let placeholderCounter = 0;

    // Replace entity names with placeholders to prevent overlapping replacements
    sortedEntities.forEach((entity) => {
      const placeholder = `__ENTITY_${placeholderCounter}__`;
      placeholderCounter++;

      // Case insensitive replacement
      const regex = new RegExp(`\\b${entity.name}\\b`, "gi");
      result = result.replace(regex, placeholder);
      placeholders[placeholder] = entity.name;
    });

    // Replace placeholders with highlighted entity names
    Object.keys(placeholders).forEach((placeholder) => {
      const entityName = placeholders[placeholder];
      result = result.replace(
        new RegExp(placeholder, "g"),
        `<span style="color: ${PURE_TEXT_CONFIG.text.colors.entityHighlight}">${entityName}</span>`
      );
    });

    return result;
  }, []);

  if (!events.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <p className="text-gray-500">No narrative events available</p>
      </div>
    );
  }

  // Get the first event's real time date for the article header
  const publicationDate =
    typeof metadata?.publishDate === "string"
      ? metadata.publishDate
      : typeof sortedEvents[0]?.temporal_anchoring.real_time === "string"
      ? sortedEvents[0].temporal_anchoring.real_time
      : null;

  // Get the article title from metadata
  const articleTitle =
    typeof metadata?.title === "string" ? metadata.title : "News Article";

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Header - sticky within parent container */}
      <div
        className="flex-none flex items-center px-4 py-3 border-b border-gray-100 bg-white z-10"
        style={{ height: `${SHARED_CONFIG.header.height}px` }}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <h2
            className="text-sm font-medium text-gray-700"
            style={{ fontSize: `${text.fontSize.meta + 2}px` }}
          >
            News Article
          </h2>
          <span
            className="text-xs text-gray-500"
            style={{ fontSize: `${text.fontSize.meta}px` }}
          >
            {events.length} event{events.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Content - scrollable area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-auto bg-gray-50"
      >
        <div
          className="py-4 px-4 sm:px-6 md:px-8"
          style={{
            paddingTop: `${margin.top}px`,
            paddingBottom: `${margin.bottom}px`,
          }}
        >
          <ArticleLayout>
            {/* Display all events in a single flat list, ordered by narrative time */}
            <ArticleSection>
              {sortedEvents.map((event) => (
                <div
                  key={event.index}
                  ref={(el) => {
                    eventRefs.current[event.index] = el;
                  }}
                >
                  <ArticleParagraph
                    event={event}
                    isSelected={focusedEventId === event.index}
                    isMarked={isEventMarked(event.index)}
                    onClick={() => {
                      setfocusedEventId(
                        event.index === focusedEventId ? null : event.index
                      );
                      toggleMarkedEvent(event.index);
                    }}
                    highlightEntities={highlightEntities}
                  />
                </div>
              ))}
            </ArticleSection>
          </ArticleLayout>
        </div>
      </div>
    </div>
  );
}
