"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Fuse from "fuse.js";
import { NarrativeEvent } from "@/types/data";
import { PURE_TEXT_CONFIG } from "./pure-text-config";

interface PureTextSearchProps {
  events: NarrativeEvent[];
  onSearchResults: (results: NarrativeEvent[]) => void;
  onSearchQueryChange: (query: string) => void;
  onNavigateToMatch: (direction: "next" | "prev") => void;
  currentMatchIndex: number;
  totalMatches: number;
}

export function PureTextSearch({
  events,
  onSearchResults,
  onSearchQueryChange,
  onNavigateToMatch,
  currentMatchIndex,
  totalMatches,
}: PureTextSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { text } = PURE_TEXT_CONFIG;
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Override browser default search with our custom search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+F or Cmd+F (browser search shortcut)
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault(); // Prevent default browser search

        // Focus on our search input
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    };

    // Add the event listener
    window.addEventListener("keydown", handleKeyDown);

    // Clean up on unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Handle search query changes
  useEffect(() => {
    onSearchQueryChange(searchQuery.trim());
  }, [searchQuery, onSearchQueryChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="relative flex-1 max-w-xl">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg
          className="h-4 w-4 text-gray-400"
          style={{ width: `${text.iconSize}px`, height: `${text.iconSize}px` }}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <input
        ref={searchInputRef}
        type="text"
        className="block w-full pl-10 pr-3 py-1.5 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        style={{ fontSize: `${text.fontSize.meta}px` }}
        placeholder="Search article content..."
        value={searchQuery}
        onChange={handleInputChange}
      />
      {searchQuery && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
          {totalMatches > 0 && (
            <div className="text-xs text-gray-500">
              {currentMatchIndex + 1} of {totalMatches}
            </div>
          )}
          {totalMatches > 1 && (
            <div className="flex items-center gap-1">
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => onNavigateToMatch("prev")}
                disabled={currentMatchIndex === 0}
              >
                <svg
                  className="h-4 w-4"
                  style={{
                    width: `${text.iconSize}px`,
                    height: `${text.iconSize}px`,
                  }}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => onNavigateToMatch("next")}
                disabled={currentMatchIndex === totalMatches - 1}
              >
                <svg
                  className="h-4 w-4"
                  style={{
                    width: `${text.iconSize}px`,
                    height: `${text.iconSize}px`,
                  }}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          )}
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={() => setSearchQuery("")}
          >
            <svg
              className="h-4 w-4"
              style={{
                width: `${text.iconSize}px`,
                height: `${text.iconSize}px`,
              }}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
