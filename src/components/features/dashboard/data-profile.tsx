"use client";

import { NarrativeEvent } from "@/types/narrative/lite";
import Image from "next/image";
import { useCenterControl } from "@/contexts/center-control-context";

interface ProfileSectionProps {
  title: string;
  topic: string;
  description: string;
  author: string;
  publishDate: string;
  imageUrl?: string | null;
  events: NarrativeEvent[];
}

export function ProfileSection({
  title,
  topic,
  description,
  author,
  publishDate,
  imageUrl,
  events = [],
}: ProfileSectionProps) {
  const { isLoading } = useCenterControl();

  return (
    <div className="p-5">
      <header className="mb-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
              {topic || "Uncategorized"}
            </span>
            <span className="text-xs text-gray-500">
              {publishDate
                ? new Date(publishDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "No date"}
            </span>
          </div>
        </div>

        <h1 className="text-xl font-bold text-neutral-900 leading-tight">
          {title}
        </h1>
        <p className="text-sm text-neutral-600">By {author}</p>
      </header>

      <div>
        <h2 className="text-sm font-semibold text-neutral-700 mb-2">
          Description
        </h2>
        <p className="text-sm text-neutral-600 mb-4">{description}</p>

        <div className="mt-5 border-t pt-4">
          <h2 className="text-sm font-semibold text-neutral-700 mb-2">Stats</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 p-3 rounded border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Events</div>
              <div className="text-lg font-semibold text-blue-700">
                {events.length}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Entities</div>
              <div className="text-lg font-semibold text-blue-700">
                {
                  new Set(
                    events?.flatMap(
                      (event) => event.entities?.map((e) => e.id) || []
                    ) || []
                  ).size
                }
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Topics</div>
              <div className="text-lg font-semibold text-blue-700">
                {
                  new Set(events?.map((event) => event.topic?.main_topic) || [])
                    .size
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
