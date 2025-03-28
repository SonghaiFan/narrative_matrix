import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExpand, faCompress } from "@fortawesome/free-solid-svg-icons";

interface ExpandButtonProps {
  isExpanded: boolean;
  onClick: () => void;
  className?: string;
}

export function ExpandButton({
  isExpanded,
  onClick,
  className = "",
}: ExpandButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`absolute top-2 right-2 z-50 p-1.5 w-7 h-7 rounded flex items-center justify-center bg-white/90 hover:bg-white shadow-sm border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:scale-110 active:scale-95 group ${className}`}
      aria-label={isExpanded ? "Collapse section" : "Expand section"}
      title={isExpanded ? "Click to collapse" : "Click to expand"}
    >
      <FontAwesomeIcon
        icon={isExpanded ? faCompress : faExpand}
        className={`w-3 h-3 transition-colors duration-200 ${
          isExpanded
            ? "text-blue-500"
            : "text-gray-600 group-hover:text-blue-500"
        }`}
      />
    </button>
  );
}
