import * as Checkbox from "@radix-ui/react-checkbox";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface MultipleSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function MultipleSelect({
  options,
  value,
  onChange,
  disabled,
}: MultipleSelectProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // Sync with external value
  useEffect(() => {
    if (value) {
      setSelectedOptions(value.split(","));
    }
  }, [value]);

  const handleOptionChange = (option: string) => {
    const newSelectedOptions = selectedOptions.includes(option)
      ? selectedOptions.filter((o) => o !== option)
      : [...selectedOptions, option];

    setSelectedOptions(newSelectedOptions);
    onChange(newSelectedOptions.join(","));
  };

  return (
    <div className="space-y-1.5">
      {options.map((option) => {
        const isSelected = selectedOptions.includes(option);
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
            <Checkbox.Root
              id={option}
              checked={isSelected}
              onCheckedChange={() => handleOptionChange(option)}
              disabled={disabled}
              className={cn(
                "h-4 w-4 shrink-0 rounded border transition-all",
                isSelected
                  ? "border-blue-500 bg-blue-500"
                  : "border-gray-300 bg-white",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-0",
                disabled && "cursor-not-allowed"
              )}
            >
              <Checkbox.Indicator className="flex items-center justify-center text-white">
                <svg
                  className={cn(
                    "h-3 w-3 transition-transform",
                    isSelected ? "scale-100" : "scale-0"
                  )}
                  viewBox="0 0 15 15"
                  fill="none"
                >
                  <path
                    d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z"
                    fill="currentColor"
                    fillRule="evenodd"
                    clipRule="evenodd"
                  />
                </svg>
              </Checkbox.Indicator>
            </Checkbox.Root>
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
    </div>
  );
}
