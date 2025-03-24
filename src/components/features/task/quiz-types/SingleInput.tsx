"use client";

interface SingleInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function SingleInput({
  value,
  onChange,
  disabled = false,
  placeholder = "Enter your answer...",
}: SingleInputProps) {
  return (
    <div className="space-y-2">
      <input
        type="text"
        className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      <p className="text-xs text-gray-500">
        Enter a single word or short phrase
      </p>
    </div>
  );
}
