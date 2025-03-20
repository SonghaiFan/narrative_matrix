"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useRouter, usePathname } from "next/navigation";

interface AuthHeaderProps {
  title: string;
  children?: ReactNode;
  onToggleUserData?: () => void;
  showUserData?: boolean;
  isTrainingMode?: boolean;
}

export function AuthHeader({
  title,
  children,
  onToggleUserData,
  showUserData = false,
  isTrainingMode = false,
}: AuthHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if current path is dashboard
  const isDashboard = pathname === "/dashboard";
  // Check if current path is a completion page
  const isCompletionPage = pathname.startsWith("/completion");

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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">Dashboard</span>
              </button>
              <div className="h-6 border-l border-gray-300 mx-2"></div>
            </>
          )}
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>

            {/* Mode indicator badge */}
            {isTrainingMode ? (
              <span className="ml-3 px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                Training Mode
              </span>
            ) : (
              <span className="ml-3 px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-300">
                Real Task
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center">
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
                <span className="font-medium">{user?.name}</span>
                <span className="text-xs text-gray-500 capitalize">
                  {user?.role}
                </span>
              </div>
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <span className="text-blue-800 font-medium">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-1 text-gray-400 group-hover:text-gray-600"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {dropdownOpen && (
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
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2 text-gray-500"
                      >
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path d="M9 22V12h6v10" />
                      </svg>
                      Dashboard
                    </Link>
                  </div>
                )}

                {/* User Data Toggle - Only for domain users */}
                {isDashboard && user?.role === "domain" && onToggleUserData && (
                  <div className="px-3 py-1">
                    <button
                      onClick={() => {
                        onToggleUserData();
                        setDropdownOpen(false);
                      }}
                      className="flex items-center w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2 text-gray-500"
                      >
                        <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34" />
                        <polygon points="18 2 22 6 12 16 8 16 8 12 18 2" />
                      </svg>
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2"
                    >
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                      <path d="M16 17l5-5-5-5" />
                      <path d="M21 12H9" />
                    </svg>
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
