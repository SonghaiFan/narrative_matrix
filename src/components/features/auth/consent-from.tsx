"use client";

import { useState, useEffect } from "react";

export function ConsentForm({
  onConsent,
}: {
  onConsent: (hasConsented: boolean) => void;
}) {
  const [hasConsented, setHasConsented] = useState(false);

  const handleConsentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasConsented(e.target.checked);
  };

  const handleContinue = () => {
    if (hasConsented) onConsent(true);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Consent Form</h2>

      <div className="h-[500px] overflow-y-auto pr-4 mb-6 custom-scrollbar space-y-6">
        <section>
          <h3 className="font-semibold text-gray-800 mb-1">
            Invitation to Participate in the Study
          </h3>
          <p className="text-gray-700">
            You are invited to participate in a study titled{" "}
            <strong>"Sketching Narrative Structures"</strong> conducted by the
            Department of Human Centred Computing, Monash University. Please
            read this explanatory statement before deciding whether to
            participate. For further information, contact the researchers via
            the email addresses provided below.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-gray-800 mb-1">Project Details</h3>
          <ul className="text-gray-700 list-disc pl-5 space-y-1">
            <li>
              <strong>Project ID:</strong> 36056
            </li>
            <li>
              <strong>Project Title:</strong> Sketching Narrative Structures
            </li>
          </ul>
          <div className="mt-2">
            <strong>Student Investigator:</strong>
            <div className="ml-4">
              Songhai Fan (
              <a
                href="mailto:songhai.fan@monash.edu"
                className="text-blue-600 underline"
              >
                songhai.fan@monash.edu
              </a>
              )
            </div>
          </div>
          <div className="mt-2">
            <strong>Co-Investigators:</strong>
            <ul className="ml-4 list-disc pl-5">
              <li>
                Dr. Ying Yang (
                <a
                  href="mailto:ying.yang@monash.edu"
                  className="text-blue-600 underline"
                >
                  ying.yang@monash.edu
                </a>
                )
              </li>
              <li>
                Assoc Professor Simon Angus (
                <a
                  href="mailto:simon.angus@monash.edu"
                  className="text-blue-600 underline"
                >
                  simon.angus@monash.edu
                </a>
                )
              </li>
              <li>
                Professor Helen Purchase (
                <a
                  href="mailto:helen.purchase@monash.edu"
                  className="text-blue-600 underline"
                >
                  helen.purchase@monash.edu
                </a>
                )
              </li>
              <li>
                Professor Tim Dwyer (
                <a
                  href="mailto:tim.dwyer@monash.edu"
                  className="text-blue-600 underline"
                >
                  tim.dwyer@monash.edu
                </a>
                )
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="font-semibold text-gray-800 mb-1">
            What Does the Research Involve?
          </h3>
          <ul className="text-gray-700 list-disc pl-5 space-y-1">
            <li>Provide a Prolific ID</li>
            <li>
              Participate in a user study involving visualisations and narrative
              structures
            </li>
            <li>
              Finish tasks and answer questions based on the text or
              visualisation
            </li>
            <li>Complete a survey</li>
          </ul>
          <p className="text-gray-700 mt-2">
            Your participation is entirely voluntary and you may withdraw at any
            stage without any implications.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-gray-800 mb-1">
            Why Were You Chosen for this Research?
          </h3>
          <p className="text-gray-700">
            You have been invited to participate in this research because your
            experience and opinions are valuable to our study.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-gray-800 mb-1">
            Confidentiality and Data Storage
          </h3>
          <p className="text-gray-700">
            The confidentiality of your data is a priority. Any personally
            identifiable information will not be shared with anyone not involved
            in this project. All data collected will be stored securely and will
            be retained for five years after the completion of the study.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-gray-800 mb-1">AI Tools Usage</h3>
          <p className="text-gray-700">
            <strong>
              Use of any AI tools (such as ChatGPT, Copilot, Gemini, or similar)
              is strictly prohibited during this study.
            </strong>{" "}
            All responses and actions must be your own work. If you are found to
            have used AI assistance, your participation and data may be excluded
            from the study results.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-gray-800 mb-1">Complaints</h3>
          <p className="text-gray-700">
            Should you have any concerns or complaints about the conduct of the
            project, you are welcome to contact the Executive Officer, Monash
            University Human Research Ethics (MUHREC) at{" "}
            <a
              href="mailto:muhrec@monash.edu"
              className="text-blue-600 underline"
            >
              muhrec@monash.edu
            </a>{" "}
            or +61 3 9905 2052.
          </p>
        </section>
      </div>

      <label className="flex items-start cursor-pointer group">
        <input
          type="checkbox"
          className="mt-0.5 mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          checked={hasConsented}
          onChange={handleConsentChange}
        />
        <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
          I have read and understand the consent form and agree to participate
          in this study.
        </span>
      </label>

      <button
        type="button"
        onClick={handleContinue}
        disabled={!hasConsented}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        Continue
      </button>
    </div>
  );
}
