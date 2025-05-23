"use client";

import { useState, useEffect } from "react";
import { ScenarioType } from "@/types/scenario";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

interface IntroductionStep {
  title: string;
  content: React.ReactNode;
  videoUrl?: string;
  image?: string;
}

// Define shared introduction content
const sharedIntroductionSteps: IntroductionStep[] = [
  {
    title: "Welcome",
    content: (
      <div className="space-y-4">
        <p className="font-medium">
          Welcome to the Narrative Matrix study. This guide will help you get
          started quickly.
        </p>
      </div>
    ),
  },
  {
    title: "Interface Overview",
    content: (
      <div className="space-y-4">
        <p>The interface has three main panels:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Visualisation Panel</strong> (left, when available): See
            event relationships and patterns visually.
          </li>
          <li>
            <strong>Text Panel</strong> (center): Read the article, organized by
            event.
          </li>
          <li>
            <strong>Task Panel</strong> (right): Answer questions about the
            article.
          </li>
        </ul>
      </div>
    ),
    image: "/images/overview.png",
  },
  {
    title: "Interactions",
    content: (
      <div className="space-y-6">
        <p>Use these actions to explore and answer questions:</p>
        <div className="grid md:grid-cols-3 gap-4 space-y-4 md:space-y-0">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 flex flex-col">
            <h4 className="font-semibold text-blue-700 mb-2 flex items-center">
              <span className="mr-2">🖱️</span> Hover
            </h4>
            <ul className="list-disc pl-5 text-gray-700 text-base space-y-1">
              <li>
                Hover over a visual element to see a tooltip with details.
              </li>
            </ul>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 flex flex-col">
            <h4 className="font-semibold text-blue-700 mb-2 flex items-center">
              <span className="mr-2">🖱️</span> Focus (Left Click)
            </h4>
            <ul className="list-disc pl-5 text-gray-700 text-base space-y-1">
              <li>Click a node or paragraph to focus on an event.</li>
              <li>Highlights the event in both visualization and text.</li>
            </ul>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 flex flex-col">
            <h4 className="font-semibold text-blue-700 mb-2 flex items-center">
              <span className="mr-2">🖱️</span> Mark (Right Click)
            </h4>
            <ul className="list-disc pl-5 text-gray-700 text-base space-y-1">
              <li>Right-click a node or paragraph to mark an event.</li>
              <li>
                Marked events have a{" "}
                <span className="text-blue-500 font-semibold">blue border</span>
                .
              </li>
            </ul>
          </div>
        </div>
      </div>
    ),
    image: "/images/interaction.gif",
  },
  {
    title: "Text Panel",
    content: (
      <div className="space-y-2">
        <ul className="list-disc pl-5 space-y-1">
          <li>Read the article, organized by event.</li>
          <li>Use search to highlight key terms and find events quickly.</li>
        </ul>
      </div>
    ),
    image: "/images/text_search.gif",
  },
  {
    title: "Task Panel",
    content: (
      <div className="space-y-2">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Answer questions about the article using the text and visual panels.
          </li>
          <li>Each question has a time limit.</li>
          <li>
            If you can't find the answer, use "Information Not Found" to skip.
          </li>
        </ul>
      </div>
    ),
  },
];

// Entity-specific introduction steps
const entityIntroductionSteps: IntroductionStep[] = [
  {
    title: "Entity Swimlane",
    content: (
      <div className="space-y-4">
        <p>
          In the <strong>Entity Swimlane</strong>:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Y-axis</strong>: Narrative sequence (order in the text)
          </li>
          <li>
            <strong>X-axis</strong>: Entities (people, organizations, concepts)
          </li>
        </ul>
        <p>
          Each node or connection shows which entities are involved in each
          event.
        </p>
      </div>
    ),
    image: "/images/entity_intro.png",
  },
  {
    title: "Entity Swimlane: Video Guide",
    content: (
      <div className="space-y-2 text-center">
        <p>
          Watch this short video to see how the Entity Swimlane works in
          practice.
        </p>
      </div>
    ),
    videoUrl: "https://www.youtube.com/embed/ENTITY_VIDEO_ID", // Replace with actual video
  },
];

// Topic-specific introduction steps
const topicIntroductionSteps: IntroductionStep[] = [
  {
    title: "Topic Stream",
    content: (
      <div className="space-y-4">
        <p>
          In the <strong>Topic Stream</strong>:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Y-axis</strong>: Topics (themes or subjects)
          </li>
          <li>
            <strong>X-axis</strong>: Real-world chronological time
          </li>
        </ul>
        <p>
          Each track is a topic, and each node is a related event. Clusters show
          multiple events close together.
        </p>
      </div>
    ),
    image: "/images/topic_intro.png",
  },
  {
    title: "Topic Stream: Video Guide",
    content: (
      <div className="space-y-2 text-center">
        <p>
          Watch this short video to see how the Topic Stream works in practice.
        </p>
      </div>
    ),
    videoUrl: "https://www.youtube.com/embed/TOPIC_VIDEO_ID", // Replace with actual video
  },
];

// Time-specific introduction steps
const timeIntroductionSteps: IntroductionStep[] = [
  {
    title: "Storytime",
    content: (
      <div className="space-y-4">
        <p>
          In <strong>Storytime</strong>:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Y-axis</strong>: Narrative sequence (order in the text)
          </li>
          <li>
            <strong>X-axis</strong>: Real-world chronological time
          </li>
        </ul>
        <p>
          See how the order of events in the story compares to when they
          actually happened.
        </p>
      </div>
    ),
    image: "/images/time_intro.png",
  },
  {
    title: "Storytime: Video Guide",
    content: (
      <div className="space-y-2 text-center">
        <p>Watch this short video to see how Storytime works in practice.</p>
      </div>
    ),
    videoUrl: "https://www.youtube.com/embed/TIME_VIDEO_ID", // Replace with actual video
  },
];

// Helper to get a custom final intro step based on dimension
function getFinalIntroStep(dimension?: "entity" | "topic" | "time" | "common") {
  let message = "You are ready to begin.";
  let detail = "";
  switch (dimension) {
    case "entity":
      message = "Let's get started with Entity Swimlane!";
      detail = "Focus on how entities interact in the story.";
      break;
    case "topic":
      message = "Let's get started with Topic Stream!";
      detail = "Pay attention to how topics group events.";
      break;
    case "time":
      message = "Let's get started with Storytime!";
      detail = "Notice how events unfold over time.";
      break;
    case "common":
    default:
      message = "You're ready to begin the study!";
      detail = "Remember, you can use all panels and features to help you.";
      break;
  }
  return {
    title: "🚀 Let's Get Started",
    content: (
      <div className="space-y-4 text-center">
        <p className="text-xl font-bold">{message}</p>
        {detail && <p className="text-gray-600">{detail}</p>}
        <p className="font-medium">
          Do your best and use the tools provided. Good luck!
        </p>
      </div>
    ),
  };
}

interface IntroductionPageProps {
  onComplete: () => void;
  scenarioType?: ScenarioType;
  dimension?: "entity" | "topic" | "time" | "common";
}

export function IntroductionPage({
  onComplete,
  scenarioType = "text-visual-1",
  dimension,
}: IntroductionPageProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [introductionSteps, setIntroductionSteps] = useState<
    IntroductionStep[]
  >([]);

  // Set up the introduction steps based on the dimension
  useEffect(() => {
    if (dimension) {
      let dimensionSteps: IntroductionStep[] = [];
      switch (dimension) {
        case "entity":
          dimensionSteps = [...entityIntroductionSteps];
          dimensionSteps.push(getFinalIntroStep("entity"));
          break;
        case "topic":
          dimensionSteps = [...topicIntroductionSteps];
          dimensionSteps.push(getFinalIntroStep("topic"));
          break;
        case "time":
          dimensionSteps = [...timeIntroductionSteps];
          dimensionSteps.push(getFinalIntroStep("time"));
          break;
        case "common":
          dimensionSteps = [...sharedIntroductionSteps];
          break;
        default:
          dimensionSteps = [...sharedIntroductionSteps];
      }
      setIntroductionSteps(dimensionSteps);
      setCurrentStep(0);
    } else {
      const steps = [...sharedIntroductionSteps];
      setIntroductionSteps(steps);
      setCurrentStep(0);
    }
  }, [dimension]);

  const handleNext = () => {
    if (currentStep < introductionSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  // Don't render until steps are loaded
  if (introductionSteps.length === 0) {
    return null;
  }

  const currentStepData =
    introductionSteps[currentStep] || introductionSteps[0];

  // Safety check - if somehow we don't have valid step data, reset to first step
  if (!currentStepData) {
    setCurrentStep(0);
    return null;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/5">
      <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 max-w-5xl w-full mx-auto">
        <div className="text-sm font-medium text-blue-600 mb-4">
          Step {currentStep + 1} of {introductionSteps.length}
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          {currentStepData.title}
        </h2>

        {/* Render image if exists */}
        {currentStepData.image && (
          <div className="relative w-full h-80 mb-8 rounded-lg overflow-hidden border border-gray-100">
            <Image
              src={currentStepData.image}
              alt={currentStepData.title}
              fill
              className="object-contain"
            />
          </div>
        )}

        <div className="text-gray-600 text-lg prose prose-base max-w-none mb-8">
          {currentStepData.content}
        </div>

        {/* Render YouTube video if URL exists */}
        {currentStepData.videoUrl && (
          <YouTubeVideo url={currentStepData.videoUrl} />
        )}

        <div className="flex justify-between items-center mt-10">
          <div className="flex space-x-2">
            {introductionSteps.map((_, index: number) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index === currentStep ? "bg-blue-500" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <Button onClick={handleNext} variant="primary" size="lg">
            {currentStep === introductionSteps.length - 1 ? (
              "Begin"
            ) : (
              <>
                Next <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

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
