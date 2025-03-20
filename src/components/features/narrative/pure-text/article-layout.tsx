"use client";

import { NarrativeEvent } from "@/types/narrative/lite";
import { ReactNode } from "react";
import { PURE_TEXT_CONFIG } from "./pure-text-config";

interface ArticleLayoutProps {
  title?: string;
  publishDate?: string | null;
  children: ReactNode;
}

export function ArticleLayout({
  title,
  publishDate,
  children,
}: ArticleLayoutProps) {
  const { text } = PURE_TEXT_CONFIG;

  return (
    <article
      className="mx-auto bg-white shadow-sm rounded-lg overflow-hidden"
      style={{ maxWidth: `${text.maxWidth}px` }}
    >
      {title && (
        <header className="px-4 sm:px-6 pt-6 pb-4">
          <h1
            className="font-bold text-gray-900 leading-tight"
            style={{ fontSize: `${text.fontSize.title + 8}px` }}
          >
            {title}
          </h1>
          {publishDate && (
            <div
              className="mt-2 text-gray-500"
              style={{ fontSize: `${text.fontSize.meta + 1}px` }}
            >
              {new Date(publishDate).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          )}
        </header>
      )}
      <div
        className="px-4 sm:px-6 py-2"
        style={{ padding: `${text.cardPadding}px` }}
      >
        {children}
      </div>
    </article>
  );
}

interface ArticleSectionProps {
  title?: string;
  children: ReactNode;
}

export function ArticleSection({ title, children }: ArticleSectionProps) {
  const { text } = PURE_TEXT_CONFIG;

  return (
    <section className="mb-6">
      {title && (
        <h2
          className="font-semibold text-gray-900 mb-3"
          style={{
            fontSize: `${text.fontSize.title}px`,
            color: text.colors.mainTopic,
          }}
        >
          {title}
        </h2>
      )}
      <div
        className="text-gray-800 space-y-4"
        style={{ color: text.colors.entityHighlight }}
      >
        {children}
      </div>
    </section>
  );
}

interface ArticleParagraphProps {
  event: NarrativeEvent;
  isSelected: boolean;
  onClick: () => void;
  highlightEntities: (text: string, entities: any[]) => string;
}

export function ArticleParagraph({
  event,
  isSelected,
  onClick,
  highlightEntities,
}: ArticleParagraphProps) {
  const { text } = PURE_TEXT_CONFIG;

  // Format timestamp for display
  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return "";
    return ` <span class="text-gray-500">(${new Date(
      timestamp
    ).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })})</span>`;
  };

  // Process text with entities highlighted
  const processedText = highlightEntities(event.text, event.entities);

  // Append timestamp to the processed text
  const textWithTimestamp = event.temporal_anchoring.real_time
    ? processedText + formatTimestamp(event.temporal_anchoring.real_time)
    : processedText;

  return (
    <div
      className={`relative group pl-5 py-2 border-l-2 transition-colors cursor-pointer ${
        isSelected
          ? "border-blue-500"
          : "hover:border-gray-300 border-transparent"
      }`}
      style={{
        backgroundColor: isSelected ? text.colors.selected : "white",
        padding: `${text.cardPadding / 2}px`,
        paddingLeft: "1.25rem",
      }}
      onClick={onClick}
    >
      <div
        className="leading-relaxed text-gray-800"
        style={{
          fontSize: `${text.fontSize.content}px`,
          lineHeight: "1.6",
        }}
        dangerouslySetInnerHTML={{
          __html: textWithTimestamp,
        }}
      />
    </div>
  );
}
