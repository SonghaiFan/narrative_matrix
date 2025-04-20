"use client";

import { useState } from "react";

export function ConsentForm({
  onConsent,
}: {
  onConsent: (hasConsented: boolean) => void;
}) {
  const [hasConsented, setHasConsented] = useState(false);

  const handleConsentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setHasConsented(isChecked);
    onConsent(isChecked);
  };

  return (
    <div className="p-8 border-b md:border-b-0 md:border-r border-gray-100">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Consent Form</h2>

      <div className="h-[450px] overflow-y-auto pr-4 mb-6 custom-scrollbar">
        <div className="space-y-4">
          <section>
            <h3 className="font-medium text-gray-800">
              Research Study Consent
            </h3>
            <p className="text-gray-600">
              You are invited to participate in a research study on narrative
              visualization. This study aims to understand how different
              visualization approaches help users comprehend narrative data.
            </p>
          </section>

          <section>
            <h3 className="font-medium text-gray-800">
              What will you be asked to do?
            </h3>
            <p className="text-gray-600">
              You will interact with a narrative interface, complete specific
              tasks, and provide feedback on your experience. The study will
              take approximately 20-30 minutes to complete.
            </p>
          </section>

          <section>
            <h3 className="font-medium text-gray-800">Risks and Benefits</h3>
            <p className="text-gray-600">
              There are no anticipated risks associated with this study.
              Benefits include contributing to research on information
              visualization and narrative comprehension.
            </p>
          </section>

          <section>
            <h3 className="font-medium text-gray-800">Confidentiality</h3>
            <p className="text-gray-600">
              Your responses will be kept confidential. All data will be stored
              securely and any published results will not include personally
              identifiable information.
            </p>
          </section>

          <section>
            <h3 className="font-medium text-gray-800">
              Voluntary Participation
            </h3>
            <p className="text-gray-600">
              Your participation is voluntary. You may withdraw at any time
              without penalty.
            </p>
          </section>

          <section>
            <h3 className="font-medium text-gray-800">Contact Information</h3>
            <p className="text-gray-600">
              If you have questions about this research, please contact the
              research team at songhai.fan@moansh.edu.
            </p>
          </section>

          <section>
            <h3 className="font-medium text-gray-800">Data Usage</h3>
            <p className="text-gray-600">
              The data collected in this study will be used for research
              purposes only. Your interactions with the interface will be
              recorded and analyzed to improve visualization techniques for
              narrative data.
            </p>
          </section>
        </div>
      </div>

      <label className="flex items-start cursor-pointer group">
        <input
          type="checkbox"
          className="mt-0.5 mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          checked={hasConsented}
          onChange={handleConsentChange}
        />
        <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
          I have read and understand the consent form and agree to participate
          in this study.
        </span>
      </label>
    </div>
  );
}
