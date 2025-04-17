"use client";

import React from "react";
import { ScenarioInfo } from "@/types/scenario";
import {
  Check,
  FileText,
  BarChart3,
  MessageSquare,
  Layers,
} from "lucide-react";

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

  // Map icon name to component
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "FileText":
        return <FileText className="h-5 w-5" />;
      case "BarChart3":
        return <BarChart3 className="h-5 w-5" />;
      case "MessageSquare":
        return <MessageSquare className="h-5 w-5" />;
      case "Layers":
        return <Layers className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative p-5 rounded-lg border transition-all duration-200
        cursor-pointer hover:shadow-md
        ${
          isSelected
            ? `border-2 shadow bg-white`
            : "border border-gray-200 bg-gray-50 hover:bg-white"
        }
      `}
      style={{
        borderColor: isSelected ? metadata.color : undefined,
      }}
    >
      {isSelected && (
        <div
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: metadata.color }}
        >
          <Check className="h-4 w-4 text-white" />
        </div>
      )}

      <div className="flex items-start gap-4">
        <div
          className="p-2 rounded-md"
          style={{
            backgroundColor: `${metadata.color}20`,
            color: metadata.color,
          }}
        >
          {getIcon(metadata.icon)}
        </div>

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
