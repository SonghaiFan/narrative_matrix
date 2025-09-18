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
  // New: selected social roles filter (multi-select)
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());

  // Derive available values for the selected attribute across events
  const availableRoles = useMemo(() => {
    const roles = new Set<string>();
    if (!selectedAttribute || selectedAttribute === "name") return [];

    events.forEach((e) => {
      e.entities?.forEach((ent) => {
        const value = ent[selectedAttribute];
        if (value && typeof value === "string") {
          roles.add(value);
        }
      });
    });
    return Array.from(roles).sort();
  }, [events, selectedAttribute]);

  // Initialize selected roles to all when events / roles change
  useEffect(() => {
    if (availableRoles.length > 0) {
      setSelectedRoles(new Set(availableRoles));
    } else {
      setSelectedRoles(new Set());
    }
  }, [availableRoles]);

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) {
        next.delete(role);
      } else {
        next.add(role);
      }
      // Prevent empty set: if user deselects last role, re-add it
      if (next.size === 0) next.add(role);
      return next;
    });
  };

  // Filter events by selected roles (if not all selected)
  const filteredEvents = useMemo(() => {
    if (
      !selectedAttribute ||
      selectedRoles.size === 0 ||
      selectedRoles.size === availableRoles.length
    ) {
      return events;
    }
    return events.map((ev) => ({
      ...ev,
      entities: ev.entities.filter((ent) => {
        const value = ent[selectedAttribute];
        return value && selectedRoles.has(value);
      }),
    }));
  }, [events, selectedRoles, availableRoles.length, selectedAttribute]);

  // Function to get available attributes in current entities
  const getAvailableAttributes = useCallback(() => {
    const availableAttrs = new Set<EntityAttribute>();
    const allAttributes = new Set<string>();

    // First pass: collect all possible attributes from entities
    events.forEach((event) => {
      event.entities.forEach((entity) => {
        Object.keys(entity).forEach((key) => {
          if (key !== "id") {
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
    const attrs = Array.from(availableAttrs);
    attrs.sort((a, b) => {
      if (a === "name") return -1;
      if (b === "name") return 1;
      return a.localeCompare(b);
    });
    return attrs;
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
      title="Entities X Paragraph"
      isEmpty={!events.length}
      headerContent={
        <div
          className="flex items-center gap-4"
          style={{ height: `${SHARED_CONFIG.header.height * 0.8}px` }}
        >
          <Select
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
          </Select>
          {/* {availableRoles.length > 0 ? (
            <div className="flex items-center gap-2 flex-wrap text-[10px]">
              {availableRoles.map((role) => {
                const checked = selectedRoles.has(role);
                return (
                  <label
                    key={role}
                    className={[
                      "flex items-center gap-1 px-2 py-1 rounded border cursor-pointer select-none",
                      checked
                        ? "bg-blue-50 border-blue-400"
                        : "bg-white border-gray-300",
                      "hover:border-blue-400 transition-colors",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      className="h-3 w-3"
                      checked={checked}
                      onChange={() => toggleRole(role)}
                    />
                    <span
                      className={checked ? "text-blue-700" : "text-gray-600"}
                    >
                      {role}
                    </span>
                  </label>
                );
              })}
            </div>
          ) : null} */}
        </div>
      }
    >
      <EntityVisual
        events={filteredEvents}
        selectedAttribute={selectedAttribute}
      />
    </VisualizationDisplay>
  );
}
