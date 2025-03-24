"use client";

interface LongTextProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  rows?: number;
}

export function LongText({
  value,
  onChange,
  disabled = false,
  placeholder = "Provide a detailed explanation...",
  rows = 4,
}: LongTextProps) {
  return (
    <div className="space-y-2">
      <textarea
        className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      <p className="text-xs text-gray-500">
        Provide a clear explanation supported by the article's content
      </p>
    </div>
  );
}
