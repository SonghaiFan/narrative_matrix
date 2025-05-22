"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";

export function CompletionComponent({
  metadata,
  scenarioId,
  paramId,
}: {
  metadata: any;
  scenarioId: string;
  paramId: string;
}) {
  // Fixed completion code for Prolific
  const completionCode = "C5QC5X93";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-medium text-gray-900 mb-2">
              Study Completed!
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Thank you for participating in {metadata.name}.
            </p>

            <div className="bg-gray-50 border border-gray-100 rounded p-3 mb-6 mx-auto">
              <h3 className="text-sm font-medium text-gray-800 mb-2">
                Your Completion Code
              </h3>
              <div className="flex items-center">
                <code className="bg-white p-2 rounded border border-gray-100 font-mono text-sm flex-grow text-center">
                  {completionCode}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(completionCode);
                    alert("Copied to clipboard!");
                  }}
                  className="ml-2 p-1.5 bg-gray-800 text-white rounded hover:bg-gray-700 flex items-center justify-center"
                  aria-label="Copy completion code"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Please submit this code on Prolific to complete the study.
              </p>

              <Link
                href="/"
                className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Return Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
