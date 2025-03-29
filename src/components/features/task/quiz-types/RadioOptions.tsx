"use client";

import { useState } from "react";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";

interface RadioOptionsProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function RadioOptions({
  options,
  value,
  onChange,
  disabled = false,
}: RadioOptionsProps) {
  return (
    <RadioGroup.Root
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      className="space-y-1.5"
    >
      {options.map((option) => {
        const isSelected = value === option;
        return (
          <div
            key={option}
            className={cn(
              "group relative flex items-center rounded-md border px-3 py-2 transition-all",
              isSelected
                ? "bg-blue-50/50 border-blue-100"
                : "bg-white border-transparent hover:bg-gray-50/50",
              "ring-1 ring-gray-200 hover:ring-gray-300",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <RadioGroup.Item
              value={option}
              id={option}
              className={cn(
                "h-4 w-4 shrink-0 rounded-full border transition-all",
                isSelected
                  ? "border-blue-500 bg-white"
                  : "border-gray-300 bg-white",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-0",
                disabled && "cursor-not-allowed"
              )}
            >
              <RadioGroup.Indicator className="flex items-center justify-center">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full bg-blue-500 transition-transform",
                    isSelected ? "scale-100" : "scale-0"
                  )}
                />
              </RadioGroup.Indicator>
            </RadioGroup.Item>
            <label
              htmlFor={option}
              className={cn(
                "ml-2.5 flex-1 text-sm transition-colors select-none",
                isSelected ? "text-blue-900" : "text-gray-700",
                disabled ? "cursor-not-allowed" : "cursor-pointer"
              )}
            >
              {option}
            </label>
          </div>
        );
      })}
    </RadioGroup.Root>
  );
}
