"use client";

import { useState } from "react";
import { ScenarioType } from "@/types/shared/scenario";

// Define introduction content for each scenario type
const introductionContent = {
  "pure-text": [
    {
      title: "Welcome to the Text-Based Study",
      content:
        "Thank you for participating in our user study. This study aims to understand how text-based approaches help users comprehend narrative data.",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Example URL - replace with actual video
    },
    {
      title: "Text Interface Overview",
      content:
        "In this study, you will read and analyze narrative content in a text-only format, complete specific tasks, and interact with the interface at your own pace.",
    },
    {
      title: "Text Features",
      content:
        "You will be presented with a narrative interface that includes text content, a task panel, and navigation controls. The interface focuses on clear textual presentation.",
    },
    {
      title: "Getting Started",
      content:
        "When you're ready, click the button below to begin. You cannot return to this introduction once you begin.",
    },
  ],
  "text-visual": [
    {
      title: "Welcome to the Text-Visual Study",
      content:
        "Thank you for participating in our user study. This study aims to understand how visual approaches help users comprehend narrative data.",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Example URL - replace with actual video
    },
    {
      title: "Text-Visual Interface Overview",
      content:
        "In this study, you will explore narrative content through visualizations, complete specific tasks, and interact with the interface at your own pace.",
    },
    {
      title: "Visual Features",
      content:
        "You will be presented with a narrative interface that includes visual representations, interactive elements, a task panel, and navigation controls.",
    },
    {
      title: "Getting Started",
      content:
        "When you're ready, click the button below to begin. You cannot return to this introduction once you begin.",
    },
  ],
  "text-chat": [
    {
      title: "Welcome to the Text-Chat Study",
      content:
        "Thank you for participating in our user study. This study aims to understand how text-based chat interfaces help users comprehend narrative data.",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Example URL - replace with actual video
    },
    {
      title: "Text-Chat Interface Overview",
      content:
        "In this study, you will interact with narrative content through a chat interface, complete specific tasks, and engage with the system at your own pace.",
    },
    {
      title: "Chat Features",
      content:
        "You will be presented with a chat interface that allows you to ask questions and receive responses about the narrative content, alongside a task panel and navigation controls.",
    },
    {
      title: "Getting Started",
      content:
        "When you're ready, click the button below to begin. You cannot return to this introduction once you begin.",
    },
  ],
  mixed: [
    {
      title: "Welcome to the Mixed Study",
      content:
        "Thank you for participating in our user study. This study aims to understand how visual representations with chat capabilities help users comprehend narrative data.",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Example URL - replace with actual video
    },
    {
      title: "Mixed Interface Overview",
      content:
        "In this study, you will explore narrative content through visualizations and a chat interface, complete specific tasks, and interact at your own pace.",
    },
    {
      title: "Combined Features",
      content:
        "You will be presented with an interface that combines visual representations with chat capabilities, allowing you to both see and ask about narrative elements.",
    },
    {
      title: "Getting Started",
      content:
        "When you're ready, click the button below to begin. You cannot return to this introduction once you begin.",
    },
  ],
};

// Default generic content as fallback
const defaultSteps = [
  {
    title: "Welcome to the Study",
    content:
      "Thank you for participating in our user study. This study aims to understand how different approaches help users comprehend narrative data.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Example URL - replace with actual video
  },
  {
    title: "Study Overview",
    content:
      "In this study, you will read and analyze narrative content, complete specific tasks, and interact with the interface at your own pace.",
  },
  {
    title: "Interface Overview",
    content:
      "You will be presented with a narrative interface that includes content, a task panel, and navigation controls.",
  },
  {
    title: "Getting Started",
    content:
      "When you're ready, click the button below to begin. You cannot return to this introduction once you begin.",
  },
];

// YouTube video component
const YouTubeVideo = ({ url }: { url: string }) => {
  if (!url) return null;

  return (
    <div className="relative w-full pt-[56.25%] mb-4 rounded overflow-hidden">
      <iframe
        className="absolute top-0 left-0 w-full h-full"
        src={url}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
};

interface IntroductionPageProps {
  onComplete: () => void;
  scenarioType?: ScenarioType;
}

export function IntroductionPage({
  onComplete,
  scenarioType = "pure-text",
}: IntroductionPageProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // Get the appropriate steps based on scenario type
  const steps =
    scenarioType && introductionContent[scenarioType]
      ? introductionContent[scenarioType]
      : defaultSteps;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-sm p-6 max-w-md w-full mx-auto">
        <div className="text-sm font-medium text-blue-600 mb-1">
          Step {currentStep + 1} of {steps.length}
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          {currentStepData.title}
        </h2>

        <p className="text-gray-600 mb-4 text-sm">{currentStepData.content}</p>

        {/* Render YouTube video if URL exists */}
        {currentStepData.videoUrl && (
          <YouTubeVideo url={currentStepData.videoUrl} />
        )}

        <div className="flex justify-between items-center">
          <div className="flex space-x-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? "bg-blue-500" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleNext}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {currentStep === steps.length - 1 ? "Begin" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
