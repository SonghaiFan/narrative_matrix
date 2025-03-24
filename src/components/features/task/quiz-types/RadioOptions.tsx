"use client";

import { useState } from "react";

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
    <div className="space-y-2">
      {options.map((option, index) => (
        <label
          key={index}
          className={`flex items-center p-2 border rounded transition-colors ${
            disabled
              ? "bg-gray-50 opacity-75"
              : "hover:bg-gray-50 cursor-pointer"
          }`}
        >
          <input
            type="radio"
            name="answer"
            value={option}
            checked={value === option}
            onChange={(e) => onChange(e.target.value)}
            className="mr-2"
            disabled={disabled}
          />
          <span className="text-sm">{option}</span>
        </label>
      ))}
    </div>
  );
}
