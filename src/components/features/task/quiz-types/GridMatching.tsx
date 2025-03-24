"use client";

interface GridMatchingProps {
  options: {
    countries?: string[];
    roles?: string[];
    causes?: string[];
    effects?: string[];
  };
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function GridMatching({
  options,
  value,
  onChange,
  disabled = false,
}: GridMatchingProps) {
  const isCountryRole = options.countries && options.roles;
  const leftItems = options.countries || options.causes || [];
  const rightItems = options.roles || options.effects || [];
  const leftLabel = options.countries ? "Countries" : "Causes";
  const rightLabel = options.roles ? "Roles" : "Effects";
  const formatExample = isCountryRole
    ? "country1: role1, country2: role2"
    : "cause1: effect1, cause2: effect2";
  const placeholder = isCountryRole
    ? "Enter matches in format: country1: role1, country2: role2..."
    : "Enter cause-effect pairs in format: cause1: effect1, cause2: effect2...";

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">{leftLabel}</p>
          <div className="space-y-1">
            {leftItems.map((item, index) => (
              <div key={index} className="text-sm p-1 bg-gray-50 rounded">
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">{rightLabel}</p>
          <div className="space-y-1">
            {rightItems.map((item, index) => (
              <div key={index} className="text-sm p-1 bg-gray-50 rounded">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
      <textarea
        className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 mt-2"
        rows={3}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      <p className="text-xs text-gray-500">
        Format: {formatExample} (comma-separated pairs)
      </p>
    </div>
  );
}
