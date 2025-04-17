"use client";

import React from "react";
import { ScenarioInfo } from "@/types/scenario";
import { Check } from "lucide-react";

interface ScenarioCardProps {
  scenario: ScenarioInfo;
  isSelected: boolean;
  onClick: () => void;
}

export function ScenarioCard({
  scenario,
  isSelected,
  onClick,
}: ScenarioCardProps) {
  const { metadata } = scenario;

  return (
    <div
      onClick={onClick}
      className={`
        relative p-5 rounded-lg border transition-all duration-200
        cursor-pointer hover:shadow-md
        ${
          isSelected
            ? "border-2 shadow bg-white border-blue-500"
            : "border border-gray-200 bg-gray-50 hover:bg-white"
        }
      `}
    >
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center bg-blue-500">
          <Check className="h-4 w-4 text-white" />
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h3 className="text-base font-medium text-gray-900">
            {metadata.name}
          </h3>
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
            {metadata.description}
          </p>
        </div>
      </div>
    </div>
  );
}
