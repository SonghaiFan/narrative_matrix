"use client";

import { useState } from "react";
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

// Define introduction content
const introductionSteps: IntroductionStep[] = [
  {
    title: "Welcome to the Narrative Metrics Training Walkthrough",
    content: (
      <div className="space-y-4">
        <p className="font-medium">
          In this short guide, we'll show you how to navigate and interact with
          the <strong>three-panel interface</strong> designed to support
          narrative understanding in complex tasks.
        </p>
      </div>
    ),
  },
  {
    title: "Interface Overview",
    content: (
      <div className="space-y-4">
        <p>The interface is composed of three key panels:</p>
        <ul className="list-none space-y-2">
          <li>
            • The <strong>Visualisation Panel</strong> (left)
          </li>
          <li>
            • The <strong>Text Panel</strong> (center)
          </li>
          <li>
            • The <strong>Task Panel</strong> (right)
          </li>
        </ul>
      </div>
    ),
    image: "/images/overview.png",
  },
  {
    title: "Visualisation Panel",
    content: (
      <div className="space-y-4">
        <p>
          We have three types of visualisations that share common semantic
          visual elements:
        </p>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Shared Visual Elements</h4>
              <ul className="list-none space-y-2">
                <li>
                  • <strong>Nodes</strong> represent events, with consistent
                  sentiment colors:
                </li>
                <ul className="list-none pl-6 space-y-1">
                  <li>
                    - <span className="text-green-500 font-medium">Green</span>{" "}
                    for Positive events
                  </li>
                  <li>
                    - <span className="text-gray-500 font-medium">Grey</span>{" "}
                    for Neutral events
                  </li>
                  <li>
                    -{" "}
                    <span className="text-orange-500 font-medium">Orange</span>{" "}
                    for Negative events
                  </li>
                </ul>
                <li className="mt-2">
                  • <strong>Tracks</strong> (grey bars) connect related events
                  by:
                </li>
                <ul className="list-none pl-6 space-y-1">
                  <li>- Entity involvement</li>
                  <li>- Topic association</li>
                  <li>- Narrative sequence</li>
                </ul>
              </ul>
            </div>
          </div>

          <div className="space-y-4 border-l pl-6">
            <div>
              <h4 className="font-medium mb-2">Three Visualisation</h4>
              <ul className="list-none space-y-1">
                <li>
                  <strong className="block mb-1">1. Entity Swimlane</strong>
                  <p className="text-sm text-gray-600">
                    Shows how entities interact across the narrative sequence
                    (the order in which writers present events in news
                    articles).
                  </p>
                </li>
                <li>
                  <strong className="block mb-1">2. Topic Stream</strong>
                  <p className="text-sm text-gray-600">
                    Groups events by their topics, with clustered nodes showing
                    related events along real-world chronological order.
                  </p>
                </li>
                <li>
                  <strong className="block mb-1">3. Story Time</strong>
                  <p className="text-sm text-gray-600">
                    Maps events to their real-world chronological order vs
                    narrative sequence (the order in which writers present
                    events in news articles).
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    ),
    image: "/images/visualisation.png",
  },
  {
    title: "Entity Swimlane",
    content: (
      <div className="space-y-4">
        <p>
          In the <strong>Entity Swimlane</strong>:
        </p>
        <ul className="list-none space-y-2">
          <li>
            • The <strong>Y-axis</strong> represents{" "}
            <strong>narrative sequence</strong> (the order in which events
            appear in the text, from top to bottom)
          </li>
          <li>
            • The <strong>X-axis</strong> shows{" "}
            <strong>different entities</strong> (people, organizations, or
            concepts involved in the story)
          </li>
        </ul>
        <p>
          Each node, or pair of connected nodes, corresponds to an event from
          the text.
        </p>
        <p>For example:</p>
        <ul className="list-none space-y-2 pl-4">
          <li>
            • A connected node between Entity A and B at narrative sequence 1
            indicates the event mentioned both entities in the first paragraph.
          </li>
          <li>
            • A single node on Entity A at sequence 2 indicates an event that
            only involved Entity A, described in a later paragraph.
          </li>
        </ul>
      </div>
    ),
    image: "/images/entity_intro.png",
  },
  {
    title: "Topic Stream",
    content: (
      <div className="space-y-4">
        <p>
          In the <strong>Topic Stream</strong>:
        </p>
        <ul className="list-none space-y-2">
          <li>
            • The <strong>Y-axis</strong> represents{" "}
            <strong>real-world chronological time</strong> (when events actually
            happened)
          </li>
          <li>
            • The <strong>X-axis</strong> shows{" "}
            <strong>different topics</strong> (themes or subjects of the events)
          </li>
          <li>• Each track represents a topic</li>
          <li>• Each node marks a related event</li>
        </ul>
        <p>
          You may see a <strong>clustered node</strong> with a number — this
          means multiple events happened close together under the same topic
          (e.g., around January 2024).
        </p>
        <ul className="list-none space-y-2">
          <li>• Click to expand and align them vertically on the timeline</li>
          <li>• Click outside the canvas to close the group view</li>
        </ul>
      </div>
    ),
    image: "/images/topic_intro.png",
  },
  {
    title: "Story Time",
    content: (
      <div className="space-y-4">
        <p>
          In <strong>Story Time</strong>:
        </p>
        <ul className="list-none space-y-2">
          <li>
            • The <strong>Y-axis</strong> represents{" "}
            <strong>narrative sequence</strong> (the order in which events
            appear in the text)
          </li>
          <li>
            • The <strong>X-axis</strong> shows{" "}
            <strong>real-world chronological time</strong> (when events actually
            happened)
          </li>
        </ul>
        <p>For instance:</p>
        <ul className="list-none space-y-2 pl-4">
          <li>
            • A single node at January 2024 reflects an event in the first
            paragraph.
          </li>
          <li>
            • An elongated node starting from February to March indicates a
            continuing event described in the second paragraph.
          </li>
        </ul>
        <p>
          This visualization helps you see how the narrative order differs from
          the actual timeline of events.
        </p>
      </div>
    ),
    image: "/images/time_intro.png",
  },
  {
    title: "Interactions",
    content: (
      <div className="space-y-4">
        <p>
          There are <strong>two types of interaction</strong>:
        </p>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium">Focus (Left Click)</h4>
            <p>
              Click on any text, node, or visual element to{" "}
              <strong>focus</strong> it across the panels.
            </p>
            <p>
              A <strong className="text-blue-500">blue guideline</strong> will
              help you trace the connection between the text and its
              corresponding visual element.
            </p>
          </div>
          <div>
            <h4 className="font-medium">Mark (Right Click)</h4>
            <p>
              Use right-click to <strong>mark an event</strong> that supports
              your answer. The marked event will have a{" "}
              <strong className="text-blue-500">blue border</strong>.
            </p>
            <p>
              This is especially important when justifying your reasoning during
              task completion.
            </p>
          </div>
        </div>
      </div>
    ),
    image: "/images/interaction.gif",
  },
  {
    title: "Text Panels",
    content: (
      <div className="space-y-4">
        <div>
          <p className="font-medium">
            In the <strong>Text Panel</strong>, you can:
          </p>
          <ul className="list-none space-y-2 pl-4">
            <li>
              • <strong>Read the full article</strong>, organized paragraphs
              (events) by narrative sequence
            </li>
            <li>
              • Use the <strong>search function</strong> to highlight key terms
              and locate relevant events instantly
            </li>
          </ul>
        </div>
      </div>
    ),
    image: "/images/text_search.gif",
  },
  {
    title: "Task",
    content: (
      <div className="space-y-4">
        <div>
          <p className="font-medium">
            Your task is to use the <strong>Text Panel</strong>—with or without
            visual support—to answer questions shown in the{" "}
            <strong>Task Panel</strong>.
          </p>
          <p>
            Each question comes with a <strong>time limit</strong>. Without
            visualizations, you'll need to read quickly and efficiently. When
            visualizations are available, take advantage of them to help locate
            relevant information more rapidly.
          </p>
        </div>
        <p>Please remember three key rules:</p>
        <ol className="list-none space-y-3">
          <li className="flex items-start space-x-2">
            <span className="text-green-500 font-bold">1.</span>
            <span>
              <strong>Base your answers only on the text</strong>, not on prior
              knowledge—details may differ from real-world facts.
            </span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-red-500 font-bold">2.</span>
            <span>
              <strong>If you cannot find the information</strong>, click
              "Information Not Found" to skip the question.
            </span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-500 font-bold">3.</span>
            <span>
              <strong>You must mark the supporting event(s)</strong> in the
              visualisation. This helps us understand how you arrived at your
              response.
            </span>
          </li>
        </ol>
      </div>
    ),
  },
  {
    title: "🚀 Let's Get Started",
    content: (
      <div className="space-y-4 text-center">
        <p>Thank you for completing this introduction.</p>
        <p>
          We understand this task is not easy and can be challenging at times.
        </p>
        <p className="font-medium">
          Remember, the goal is to try your best - don't be frustrated if you
          find some questions difficult.
        </p>
        <p>You're now ready to begin your training.</p>
        <p className="font-bold">Take a deep breath and good luck!</p>
      </div>
    ),
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
  scenarioType = "text-visual-1",
}: IntroductionPageProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < introductionSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const currentStepData = introductionSteps[currentStep];

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
