"use client";

interface CommaSeparatedProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  format?: string;
}

export function CommaSeparated({
  value,
  onChange,
  disabled = false,
  placeholder = "Enter your answers separated by commas...",
  format = "item1, item2, item3",
}: CommaSeparatedProps) {
  return (
    <div className="space-y-2">
      <textarea
        className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        rows={2}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      <p className="text-xs text-gray-500">
        Format: {format} (comma-separated)
      </p>
    </div>
  );
}
