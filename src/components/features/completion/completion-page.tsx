"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { useState } from "react";
import { StudyFeedbackForm } from "./study-feedback-form";

export function CompletionPage({
  metadata,
  scenarioId,
  paramId,
}: {
  metadata: any;
  scenarioId: string;
  paramId: string;
}) {
  const completionCode = "C5QC5X93";
  const [isSubmitted, setIsSubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="text-center space-y-4">
            {!isSubmitted ? (
              <>
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Almost Done!
                  </h2>
                  <p className="text-base text-gray-500 mt-1">
                    Thank you for participating in{" "}
                    <span className="font-medium">{metadata.name}</span>.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Please complete the feedback form below to receive your
                    completion code
                  </p>
                </div>
                <StudyFeedbackForm onSubmit={() => setIsSubmitted(true)} />
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Thank You!
                  </h2>
                  <p className="text-base text-gray-500 mt-1">
                    Your feedback has been submitted successfully.
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 mb-6 mx-auto max-w-md">
                  <h3 className="text-base font-medium text-gray-800 mb-2">
                    Your Completion Code
                  </h3>
                  <div className="flex items-center justify-center gap-2">
                    <code className="bg-white px-4 py-2 rounded border border-gray-100 font-mono text-lg flex-grow text-center">
                      {completionCode}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(completionCode);
                        alert("Copied to clipboard!");
                      }}
                      className="px-3 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700 flex items-center justify-center transition-colors"
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
                    className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Return Home
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
