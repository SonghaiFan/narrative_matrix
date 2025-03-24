"use client";

interface NumberedSequenceProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function NumberedSequence({
  options,
  value,
  onChange,
  disabled = false,
}: NumberedSequenceProps) {
  return (
    <div className="space-y-2">
      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="p-2 border rounded bg-gray-50 text-sm">
            {option}
          </div>
        ))}
      </div>
      <textarea
        className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 mt-2"
        rows={2}
        placeholder="Enter the numbers in order (e.g., 1,2,3,4)..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      <p className="text-xs text-gray-500">
        Format: 1,2,4,3 (comma-separated numbers in the order you want to
        arrange the items)
      </p>
    </div>
  );
}
