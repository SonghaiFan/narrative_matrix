"use client";

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ScenarioError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="p-4 text-center">
      <h2 className="text-xl font-semibold text-red-600 mb-2">
        Something went wrong!
      </h2>
      <p className="text-gray-700 mb-4">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={reset} // Attempt to recover by re-rendering the segment
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  );
}
