"use client";

import { NarrativeEvent, NarrativeMatrixData } from "@/types/narrative/lite";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useCenterControl } from "@/contexts/center-control-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { useFileSelector } from "@/hooks/use-file-selector";

interface ProfileSectionProps {
  title: string;
  topic: string;
  description: string;
  author: string;
  publishDate: string;
  imageUrl?: string | null;
  events: NarrativeEvent[];
  onDataChange?: (data: NarrativeMatrixData) => void;
  selectedFile?: string;
  setSelectedFile?: (file: string) => void;
}

export function ProfileSection({
  title,
  topic,
  description,
  author,
  publishDate,
  imageUrl,
  events = [],
  onDataChange,
  selectedFile: propSelectedFile,
  setSelectedFile: propSetSelectedFile,
}: ProfileSectionProps) {
  const { isLoading } = useCenterControl();

  // Use the file selector hook
  const {
    availableFiles,
    selectedFile: effectiveSelectedFile,
    setSelectedFile: handleFileChange,
  } = useFileSelector({
    onDataChange,
    externalSelectedFile: propSelectedFile,
    externalSetSelectedFile: propSetSelectedFile,
  });

  const stats = {
    entities: new Set(
      events?.flatMap((event) => event.entities?.map((e) => e.id) || []) || []
    ).size,
    topics: new Set(events?.map((event) => event.topic?.main_topic) || []).size,
    events: events?.length || 0,
  };

  return (
    <article className="flex flex-col h-full p-4 space-y-4 overflow-hidden">
      <header className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="px-2 py-0.5 bg-neutral-100 text-neutral-800 rounded-full">
              {topic}
            </span>
            <time className="text-neutral-600" dateTime={publishDate}>
              {new Date(publishDate).toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
              })}
            </time>
          </div>
          <div className="flex items-center gap-2">
            {isLoading && (
              <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                <div className="w-3 h-3 border-2 border-neutral-300 border-t-neutral-500 rounded-full animate-spin"></div>
                <span>Loading...</span>
              </div>
            )}
            <Select
              value={effectiveSelectedFile}
              onValueChange={handleFileChange}
            >
              <SelectTrigger className="w-[180px] h-7 px-2 py-1 text-xs">
                <SelectValue
                  placeholder="Select data file"
                  className="truncate"
                />
              </SelectTrigger>
              <SelectContent>
                {(() => {
                  // Separate archived and non-archived files
                  const nonArchivedFiles = availableFiles.filter(
                    (file) => !file.startsWith("archived/")
                  );
                  const archivedFiles = availableFiles.filter((file) =>
                    file.startsWith("archived/")
                  );

                  return (
                    <>
                      {/* Non-archived files */}
                      {nonArchivedFiles.map((file) => {
                        const displayName = file;
                        const truncatedName =
                          displayName.length > 25
                            ? displayName.substring(0, 22) + "..."
                            : displayName;

                        return (
                          <SelectItem
                            key={file}
                            value={file}
                            className="text-xs py-1"
                            title={file}
                          >
                            <span className="truncate block max-w-[160px]">
                              {truncatedName}
                            </span>
                          </SelectItem>
                        );
                      })}

                      {/* Add separator if both archived and non-archived files exist */}
                      {nonArchivedFiles.length > 0 &&
                        archivedFiles.length > 0 && (
                          <div className="px-2 py-1.5 text-xs text-neutral-400 border-t border-neutral-200 mt-1 pt-1">
                            Archived Files
                          </div>
                        )}

                      {/* Archived files */}
                      {archivedFiles.map((file) => {
                        const displayName = file.split("/").pop() || file;
                        const truncatedName =
                          displayName.length > 25
                            ? displayName.substring(0, 22) + "..."
                            : displayName;

                        return (
                          <SelectItem
                            key={file}
                            value={file}
                            className="text-xs py-1"
                            title={file}
                          >
                            <span className="truncate block max-w-[160px]">
                              <span className="text-neutral-500 mr-1">
                                [Archived]{" "}
                              </span>
                              {truncatedName}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </>
                  );
                })()}
              </SelectContent>
            </Select>
          </div>
        </div>

        <h1 className="text-xl font-bold text-neutral-900 leading-tight">
          {title}
        </h1>
        <p className="text-sm text-neutral-600">By {author}</p>
      </header>

      <div className="relative aspect-video w-full bg-neutral-100 rounded-lg overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            priority={true}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-neutral-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      <p className="text-sm text-neutral-600 leading-relaxed">{description}</p>

      <footer className="mt-auto pt-3 border-t border-neutral-100">
        <div className="grid grid-cols-3 gap-2 text-center">
          {Object.entries(stats).map(([key, value]) => (
            <div key={key}>
              <div className="text-xs font-medium text-neutral-500 capitalize">
                {key}
              </div>
              <div className="text-lg font-semibold text-neutral-900">
                {value}
              </div>
            </div>
          ))}
        </div>
      </footer>
    </article>
  );
}
