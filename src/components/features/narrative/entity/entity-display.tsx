"use client";

import { NarrativeEvent } from "@/types/lite";
import { useState, useCallback, useEffect, useMemo } from "react";
import { VisualizationDisplay } from "../shared/visualization-display";
import { EntityVisual } from "./entity-visual";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SHARED_CONFIG } from "../shared/visualization-config";

// Helper function to format attribute labels
const formatAttributeLabel = (attr: string): string => {
  return attr
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

type EntityAttribute = string;

interface EntityDisplayProps {
  events: NarrativeEvent[];
}

export function EntityDisplay({ events }: EntityDisplayProps) {
  const [selectedAttribute, setSelectedAttribute] =
    useState<EntityAttribute>("");

  // Function to get available attributes in current entities
  const getAvailableAttributes = useCallback(() => {
    const availableAttrs = new Set<EntityAttribute>();
    const allAttributes = new Set<string>();

    // First pass: collect all possible attributes from entities
    events.forEach((event) => {
      event.entities.forEach((entity) => {
        // Get all keys from the entity object
        Object.keys(entity).forEach((key) => {
          // Skip 'id' and 'name' as they're not visualization attributes
          if (key !== "id" && key !== "name") {
            allAttributes.add(key);
          }
        });
      });
    });

    // Second pass: check which attributes have values
    events.forEach((event) => {
      event.entities.forEach((entity) => {
        allAttributes.forEach((attr) => {
          if (
            entity[attr] !== undefined &&
            entity[attr] !== null &&
            entity[attr] !== ""
          ) {
            availableAttrs.add(attr);
          }
        });
      });
    });

    // If no attributes are found, return an empty array
    if (availableAttrs.size === 0) {
      return [];
    }

    // Convert to array and sort alphabetically
    return Array.from(availableAttrs).sort();
  }, [events]);

  // Memoize the available attributes to avoid recalculation
  const availableAttributes = useMemo(
    () => getAvailableAttributes(),
    [getAvailableAttributes]
  );

  // Set initial attribute when events change
  useEffect(() => {
    if (
      availableAttributes.length > 0 &&
      (!availableAttributes.includes(selectedAttribute) ||
        selectedAttribute === "")
    ) {
      setSelectedAttribute(availableAttributes[0]);
    }
  }, [availableAttributes, selectedAttribute]);

  return (
    <VisualizationDisplay
      title="Entities"
      isEmpty={!events.length}
      headerContent={
        <div
          className="flex items-center gap-2"
          style={{ height: `${SHARED_CONFIG.header.height * 0.8}px` }}
        >
          {/* <Select
            value={selectedAttribute}
            onValueChange={setSelectedAttribute}
          >
            <SelectTrigger
              className="text-xs w-[140px] min-h-0"
              style={{ height: `${SHARED_CONFIG.header.height * 0.7}px` }}
            >
              <SelectValue placeholder="Select attribute" />
            </SelectTrigger>
            <SelectContent>
              {availableAttributes.map((attr) => (
                <SelectItem key={attr} value={attr} className="text-xs py-1">
                  {formatAttributeLabel(attr)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select> */}
        </div>
      }
    >
      <EntityVisual events={events} />
    </VisualizationDisplay>
  );
}
