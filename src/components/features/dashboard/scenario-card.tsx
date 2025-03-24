"use client";
import Image from "next/image";

export interface ScenarioCardProps {
  title: string;
  description: string;
  imageSrc: string;
  onClick: () => void;
  isSelected: boolean;
}

export function ScenarioCard({
  title,
  description,
  imageSrc,
  onClick,
  isSelected,
}: ScenarioCardProps) {
  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-lg border transition-all cursor-pointer bg-white hover:shadow-md aspect-square ${
        isSelected
          ? "border-blue-500 ring-1 ring-blue-500 shadow-md"
          : "border-gray-200 hover:border-gray-300"
      }`}
      onClick={onClick}
    >
      <div className="p-4 flex flex-col h-full">
        <div className="bg-gray-100 rounded-lg overflow-hidden mb-3 flex-1">
          <Image
            src={imageSrc}
            alt={title}
            width={400}
            height={400}
            className="w-full h-full object-contain p-4"
          />
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-800 line-clamp-1">
            {title}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {description}
          </p>
        </div>
        {isSelected && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
              Selected
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
