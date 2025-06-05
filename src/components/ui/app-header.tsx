"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { getNodetColor } from "@/components/features/narrative/shared/color-utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt, faCircle } from "@fortawesome/free-solid-svg-icons";

interface AuthHeaderProps {
  title: string;
  children?: ReactNode;
  isTrainingMode?: boolean;
  showColourLegend?: boolean;
}

export function AppHeader({
  title,
  children,
  isTrainingMode = false,
  showColourLegend = false,
}: AuthHeaderProps) {
  const router = useRouter();
  const { userId, role } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white shadow-sm z-50 px-6 py-3 relative">
      <div className="max-w-full mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>

            {/* Mode indicator badge */}
            {isTrainingMode ? (
              <span className="ml-3 px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                Training Mode
              </span>
            ) : (
              <span className="ml-3 px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-blue-800 border border-blue-300">
                Real Task
              </span>
            )}
          </div>
        </div>

        {/* Center section with sentiment legend
        {showColourLegend && (
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 px-4 py-2 shadow-sm">
              <span className="text-xs font-semibold text-gray-700 mr-3">
                Sentiment:
              </span>
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  <FontAwesomeIcon
                    icon={faCircle}
                    className="mr-1.5 text-xs"
                    style={{ color: getNodetColor("positive") }}
                  />
                  <span className="text-xs font-medium text-gray-700">
                    Positive
                  </span>
                </div>
                <div className="flex items-center">
                  <FontAwesomeIcon
                    icon={faCircle}
                    className="mr-1.5 text-xs"
                    style={{ color: getNodetColor("neutral") }}
                  />
                  <span className="text-xs font-medium text-gray-700">
                    Neutral
                  </span>
                </div>
                <div className="flex items-center">
                  <FontAwesomeIcon
                    icon={faCircle}
                    className="mr-1.5 text-xs"
                    style={{ color: getNodetColor("negative") }}
                  />
                  <span className="text-xs font-medium text-gray-700">
                    Negative
                  </span>
                </div>
              </div>
            </div>
          </div>
        )} */}

        <div className="flex items-center gap-3">
          {/* Additional content passed as children */}
          {children}

          <div className="relative ml-4" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none group"
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              <div className="flex flex-col items-end mr-3">
                <span className="font-medium">{userId}</span>
                <span className="text-xs text-gray-500 capitalize">{role}</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <span className="text-blue-800 font-medium">
                  {userId?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
            </button>

            {dropdownOpen && role === "domain" && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-[9999] border border-gray-200">
                <div className="px-4 py-2 text-xs text-gray-500">
                  Signed in as <span className="font-semibold">{userId}</span>
                </div>
                <div className="border-t border-gray-100 my-1"></div>

                {/* Logout Button */}
                <div className="px-3 py-1">
                  <button
                    onClick={() => {
                      window.location.href = "/";
                    }}
                    className="flex items-center w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
