"use client";

import { useEffect } from "react";
import Clarity from "@microsoft/clarity";

export function ClarityAnalytics() {
  useEffect(() => {
    try {
      console.log("Initializing Microsoft Clarity...");
      Clarity.init("ra9bak84l9");
      console.log("Microsoft Clarity initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Microsoft Clarity:", error);
    }
  }, []);

  return null;
}
