"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

interface AuthHeaderProps {
  title: string;
  children?: ReactNode;
}

export function AuthHeader({
  title,
  children,
}: AuthHeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Simple header - no special dashboard handling needed

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
    // Go back to login page 
    router.push("/");
  };


  return (
    <header className="bg-white shadow-sm z-50 px-6 py-3 relative">
      <div className="max-w-full mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {/* Back to login button */}
          <button
            onClick={handleBackClick}
            className="flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors focus:outline-none"
            aria-label="Go back to home"
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
            <span className="text-sm font-medium">Home</span>
          </button>
          <div className="h-6 border-l border-gray-300 mx-2"></div>
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>

            {/* Demo mode indicator */}
            <span className="ml-3 px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-300">
              Demo Mode
            </span>
          </div>
        </div>

        {/* Center spacer */}
        <div className="flex-1"></div>

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

                {/* Logout Button */}
                <div className="border-t border-gray-100 my-1"></div>
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
