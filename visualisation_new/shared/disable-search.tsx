"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

export function DisableSearch() {
  // We need to track if this is client-side
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+F or Cmd+F (browser search shortcut)
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault(); // Prevent default browser search

        // Show warning toast
        toast.warning("Search functionality is disabled", {
          description: "This feature has been removed from the application.",
          duration: 3000,
        });
      }
    };

    // Add the event listener
    window.addEventListener("keydown", handleKeyDown);

    // Clean up on unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Only render on client-side
  if (!isMounted) return null;

  return null;
}
