"use client";

import { useEffect } from "react";
import Clarity from "@microsoft/clarity";

export function ClarityAnalytics() {
  useEffect(() => {
    // Initialize Clarity with your project ID
    // Replace 'YOUR_PROJECT_ID' with your actual Clarity project ID
    Clarity.init("ra9bak84l9");
  }, []);

  return null;
}
