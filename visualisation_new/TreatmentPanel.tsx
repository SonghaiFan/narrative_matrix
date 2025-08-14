"use client";

import { NarrativeEvent } from "@/types/data";
import { PureTextDisplay } from "@/components/visualisation/pure-text/pure-text-display";
import { TopicDisplay } from "@/components/visualisation/topic/topic-display";
import { TimeDisplay } from "@/components/visualisation/time/time-display";
import { EntityDisplay } from "@/components/visualisation/entity/entity-display";
import { ResizableTwoColRow } from "@/components/ui/resizable-two-col-row";

interface TreatmentPanelProps {
  treatment: "text" | "text+visual" | "visual" | string | undefined;
  dimension: "entity" | "topic" | "time" | string | undefined;
  events: NarrativeEvent[];
  metadata: {
    publishDate: string;
  };
  className?: string;
}

export function TreatmentPanel({
  treatment,
  dimension,
  events,
  metadata,
  className = "",
}: TreatmentPanelProps) {
  // Handle loading state
  if (!events.length) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center text-gray-500">
          <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-medium">Loading events...</p>
          <p className="text-sm mt-1">Preparing visualization data</p>
        </div>
      </div>
    );
  }

  // Render based on treatment type
  if (treatment === "text") {
    // Pure text display
    return (
      <div className={`h-full ${className}`}>
        <PureTextDisplay
          events={events}
          metadata={{ publishDate: metadata.publishDate }}
        />
      </div>
    );
  }

  if (treatment === "text+visual") {
    // Text + Visualization side by side with resizable panels
    return (
      <div className={`h-full ${className}`}>
        <ResizableTwoColRow
          firstComponent={
            <PureTextDisplay
              events={events}
              metadata={{ publishDate: metadata.publishDate }}
            />
          }
          secondComponent={renderVisualizationByDimension(
            dimension,
            events,
            "",
            metadata
          )}
          defaultFirstSize={50}
          defaultSecondSize={50}
        />
      </div>
    );
  }

  // Default to visualization only (treatment === "visual" or undefined)
  return renderVisualizationByDimension(dimension, events, className, metadata);
}

// Helper function to render visualization based on dimension
function renderVisualizationByDimension(
  dimension: string | undefined,
  events: NarrativeEvent[],
  className: string,
  metadata: { publishDate: string }
) {
  switch (dimension) {
    case "topic":
      return (
        <TopicDisplay
          events={events}
          metadata={{ publishDate: metadata.publishDate }}
        />
      );

    case "time":
      return (
        <TimeDisplay
          events={events}
          metadata={{ publishDate: metadata.publishDate }}
        />
      );

    case "entity":
      return <EntityDisplay events={events} />;

    default:
      return (
        <div className={`flex items-center justify-center h-full ${className}`}>
          <div className="text-center text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              ❓
            </div>
            <p className="font-medium">Unknown Visualization Type</p>
            <p className="text-sm mt-1">
              Dimension: {dimension || "Not specified"}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Available: entity, topic, time
            </p>
          </div>
        </div>
      );
  }
}
