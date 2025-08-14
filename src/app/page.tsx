"use client";

import { useState } from "react";
import { LoginForm } from "@/components/features/auth/login-form";

export default function Home() {
  const [hasConsented, setHasConsented] = useState(false);

  // Simple login page - no loading or redirects needed

  // Render login form with consent for unauthenticated users
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left side - Consent Form */}
          <div className="p-8 border-b md:border-b-0 md:border-r border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Consent Form
            </h2>

            <div className="h-[450px] overflow-y-auto pr-4 mb-6 custom-scrollbar">
              <div className="space-y-4">
                <section>
                  <h3 className="font-medium text-gray-800">
                    Research Study Consent
                  </h3>
                  <p className="text-gray-600">
                    You are invited to participate in a research study on
                    narrative visualization. This study aims to understand how
                    different visualization approaches help users comprehend
                    narrative data.
                  </p>
                </section>

                <section>
                  <h3 className="font-medium text-gray-800">
                    What will you be asked to do?
                  </h3>
                  <p className="text-gray-600">
                    You will interact with a narrative interface, complete
                    specific tasks, and provide feedback on your experience. The
                    study will take approximately 20-30 minutes to complete.
                  </p>
                </section>

                <section>
                  <h3 className="font-medium text-gray-800">
                    Risks and Benefits
                  </h3>
                  <p className="text-gray-600">
                    There are no anticipated risks associated with this study.
                    Benefits include contributing to research on information
                    visualization and narrative comprehension.
                  </p>
                </section>

                <section>
                  <h3 className="font-medium text-gray-800">Confidentiality</h3>
                  <p className="text-gray-600">
                    Your responses will be kept confidential. All data will be
                    stored securely and any published results will not include
                    personally identifiable information.
                  </p>
                </section>

                <section>
                  <h3 className="font-medium text-gray-800">
                    Voluntary Participation
                  </h3>
                  <p className="text-gray-600">
                    Your participation is voluntary. You may withdraw at any
                    time without penalty.
                  </p>
                </section>

                <section>
                  <h3 className="font-medium text-gray-800">
                    Contact Information
                  </h3>
                  <p className="text-gray-600">
                    If you have questions about this research, please contact
                    the research team at research@example.com.
                  </p>
                </section>

                <section>
                  <h3 className="font-medium text-gray-800">Data Usage</h3>
                  <p className="text-gray-600">
                    The data collected in this study will be used for research
                    purposes only. Your interactions with the interface will be
                    recorded and analyzed to improve visualization techniques
                    for narrative data.
                  </p>
                </section>
              </div>
            </div>

            <label className="flex items-start cursor-pointer group">
              <input
                type="checkbox"
                className="mt-0.5 mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={hasConsented}
                onChange={(e) => setHasConsented(e.target.checked)}
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                I have read and understand the consent form and agree to
                participate in this study.
              </span>
            </label>
          </div>

          {/* Right side - Login Form */}
          <div className="p-8 bg-gray-50 flex flex-col">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">
                Narrative Matrix
              </h1>
              <p className="text-gray-500">Interactive Demo Platform</p>
            </div>

            <div className="flex-grow flex flex-col justify-center">
              <div className="max-w-sm mx-auto w-full">
                <LoginForm isDisabled={!hasConsented} />

                {!hasConsented && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-center">
                    <div className="flex items-center justify-center gap-2 text-amber-700">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-sm font-medium">
                        Please read and accept the consent form to proceed
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
