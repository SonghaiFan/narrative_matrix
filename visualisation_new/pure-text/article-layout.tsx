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
        className="text-gray-800 space-y-2"
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
  onContextMenu?: (e: React.MouseEvent) => void;
}

export function ArticleParagraph({
  event,
  isSelected,
  isMarked,
  onClick,
  onContextMenu,
}: ArticleParagraphProps) {
  const { text } = PURE_TEXT_CONFIG;

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
          lineHeight: "1.4",
        }}
      >
        <span className="inline-block font-bold text-blue-600 mr-2">
          #{event.index}
        </span>
        <span>{event.text}</span>
      </div>
    </div>
  );
}
