"use client";

import { NarrativeEvent } from "@/types/data";
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
  isMarked: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  highlightEntities: (text: string, entities: any[]) => string;
  searchQuery?: string;
  highlightSearchTerm?: (text: string, searchQuery: string) => string;
}

export function ArticleParagraph({
  event,
  isSelected,
  isMarked,
  onClick,
  onContextMenu,
  highlightEntities,
  searchQuery = "",
  highlightSearchTerm,
}: ArticleParagraphProps) {
  const { text } = PURE_TEXT_CONFIG;

  // Process text with entities highlighted
  const processedText = highlightEntities(event.text, event.entities);

  // Apply search term highlighting if searchQuery is provided
  const finalText =
    searchQuery && highlightSearchTerm
      ? highlightSearchTerm(processedText, searchQuery)
      : processedText;

  return (
    <div
      className={`relative group pl-5 py-2 border-l-2 transition-colors cursor-pointer ${
        isMarked ? "border-l-blue-500" : "border-l-transparent"
      }`}
      style={{
        backgroundColor: isSelected ? text.colors.selected : "white",
        padding: `${text.cardPadding / 2}px`,
        paddingLeft: "1.25rem",
      }}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <div
        className="leading-relaxed text-gray-800"
        style={{
          fontSize: `${text.fontSize.content}px`,
          lineHeight: "1.6",
        }}
      >
        <span className="inline-block font-bold text-blue-600 mr-2">
          #{event.index}
        </span>
        <span
          dangerouslySetInnerHTML={{
            __html: finalText,
          }}
        />
      </div>
    </div>
  );
}
