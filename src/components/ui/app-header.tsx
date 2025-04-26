"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { getSentimentColor } from "@/components/features/narrative/shared/color-utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faHome,
  faPencilAlt,
  faSignOutAlt,
  faCircle,
} from "@fortawesome/free-solid-svg-icons";

// SVG Icons for mouse actions
const MouseFocusIcon = () => (
  <svg
    width="30"
    height="30"
    viewBox="0 0 34 30"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Mouse body */}
    <path
      d="M14 14C14 9.58172 17.5817 6 22 6V6C26.4183 6 30 9.58172 30 14V22C30 26.4183 26.4183 30 22 30V30C17.5817 30 14 26.4183 14 22V14Z"
      stroke="black"
      strokeWidth="2"
    />

    {/* Scroll wheel */}
    <rect x="21" y="10" width="2" height="6" rx="1" fill="black" />

    {/* L label */}
    <text
      x="3"
      y="28"
      fontFamily="Arial"
      fontSize="10"
      fill="#4F46E5"
      fontWeight="bold"
    >
      L
    </text>
    {/* Cross in circle */}
    <circle
      cx="6"
      cy="10"
      r="5"
      stroke="black"
      strokeWidth="1.5"
      fill="white"
    />
    <path
      d="M6 8V12"
      stroke="#4F46E5"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M4 10H8"
      stroke="#4F46E5"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const MouseMarkIcon = () => (
  <svg
    width="30"
    height="30"
    viewBox="0 0 34 30"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Mouse body */}
    <path
      d="M4 14C4 9.58172 7.58172 6 12 6V6C16.4183 6 20 9.58172 20 14V22C20 26.4183 16.4183 30 12 30V30C7.58172 30 4 26.4183 4 22V14Z"
      stroke="black"
      strokeWidth="2"
    />

    {/* Scroll wheel */}
    <rect x="11" y="10" width="2" height="6" rx="1" fill="black" />

    {/* R label */}
    <text
      x="25"
      y="28"
      fontFamily="Arial"
      fontSize="10"
      fill="#22C55E"
      fontWeight="bold"
    >
      R
    </text>

    {/* Checkmark in circle */}
    <circle
      cx="28"
      cy="10"
      r="5"
      stroke="black"
      strokeWidth="1.5"
      fill="white"
    />
    <path
      d="M25.5 10L27.5 12L30.5 8"
      stroke="#22C55E"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface AuthHeaderProps {
  title: string;
  children?: ReactNode;
  onToggleUserData?: () => void;
  showUserData?: boolean;
  isTrainingMode?: boolean;
  showSentimentLegend?: boolean;
}

export function AppHeader({
  title,
  children,
  onToggleUserData,
  showUserData = false,
  isTrainingMode = false,
  showSentimentLegend = false,
}: AuthHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if current path is dashboard
  const isDashboard = pathname === "/dashboard";

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

  const handleBackClick = () => {
    // Back navigation based on user role and current path
    if (user?.role === "domain") {
      // Domain users always go back to dashboard
      router.push("/dashboard");
    } else {
      // Normal users go back to login page (they should not be able to go back)
      router.push("/");
    }
  };

  return (
    <header className="bg-white shadow-sm z-50 px-6 py-3 relative">
      <div className="max-w-full mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {/* Only show back button in specific situations */}
          {!isDashboard && user?.role === "domain" && (
            <>
              <button
                onClick={handleBackClick}
                className="flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors focus:outline-none"
                aria-label="Go back to dashboard"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-1" />
                <span className="text-sm font-medium">Dashboard</span>
              </button>
              <div className="h-6 border-l border-gray-300 mx-2"></div>
            </>
          )}
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>

            {/* Mode indicator badge - only show in non-dashboard pages */}
            {!isDashboard &&
              (isTrainingMode ? (
                <span className="ml-3 px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  Training Mode
                </span>
              ) : (
                <span className="ml-3 px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-300">
                  Real Task
                </span>
              ))}
          </div>
        </div>

        {/* Center section with sentiment legend - only show in non-dashboard pages */}
        {showSentimentLegend && !isDashboard && (
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
                    style={{ color: getSentimentColor("positive") }}
                  />
                  <span className="text-xs font-medium text-gray-700">
                    Positive
                  </span>
                </div>
                <div className="flex items-center">
                  <FontAwesomeIcon
                    icon={faCircle}
                    className="mr-1.5 text-xs"
                    style={{ color: getSentimentColor("neutral") }}
                  />
                  <span className="text-xs font-medium text-gray-700">
                    Neutral
                  </span>
                </div>
                <div className="flex items-center">
                  <FontAwesomeIcon
                    icon={faCircle}
                    className="mr-1.5 text-xs"
                    style={{ color: getSentimentColor("negative") }}
                  />
                  <span className="text-xs font-medium text-gray-700">
                    Negative
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          {/* Interaction Hints - only show in non-dashboard pages */}
          {!isDashboard && (
            <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 px-3 py-1.5 shadow-sm">
              <div className="flex items-center mr-4">
                <div className="mr-2 flex items-center justify-center">
                  <MouseFocusIcon />
                </div>
                <span className="text-xs font-medium text-gray-700">
                  <span className="text-indigo-600">Left Click:</span> Focus
                </span>
              </div>
              <div className="flex items-center">
                <div className="mr-2 flex items-center justify-center">
                  <MouseMarkIcon />
                </div>
                <span className="text-xs font-medium text-gray-700">
                  <span className="text-green-600">Right Click:</span> Mark
                </span>
              </div>
            </div>
          )}

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
                <span className="font-medium">{user?.username}</span>
                <span className="text-xs text-gray-500 capitalize">
                  {user?.role}
                </span>
              </div>
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <span className="text-blue-800 font-medium">
                  {user?.username?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
            </button>

            {dropdownOpen && user?.role === "domain" && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-[9999] border border-gray-200">
                <div className="px-4 py-2 text-xs text-gray-500">
                  Signed in as{" "}
                  <span className="font-semibold">{user?.username}</span>
                </div>
                <div className="border-t border-gray-100 my-1"></div>

                {/* Navigation Links */}
                {!isDashboard && (
                  <div className="px-3 py-1">
                    <Link
                      href="/dashboard"
                      className="flex items-center w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <FontAwesomeIcon
                        icon={faHome}
                        className="mr-2 text-gray-500"
                      />
                      Dashboard
                    </Link>
                  </div>
                )}

                {/* User Data Toggle - Only for domain users */}
                {isDashboard && onToggleUserData && (
                  <div className="px-3 py-1">
                    <button
                      onClick={() => {
                        onToggleUserData();
                        setDropdownOpen(false);
                      }}
                      className="flex items-center w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <FontAwesomeIcon
                        icon={faPencilAlt}
                        className="mr-2 text-gray-500"
                      />
                      {showUserData ? "Hide User Data" : "Show User Data"}
                    </button>
                  </div>
                )}

                {/* Logout Button */}
                <div
                  className={`border-t border-gray-100 my-1 ${
                    !isDashboard ? "" : "mt-0"
                  }`}
                ></div>
                <div className="px-3 py-1">
                  <button
                    onClick={() => {
                      logout();
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
