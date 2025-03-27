import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date string or timestamp into a human-readable format
 * @param date - Date string, timestamp, Date object, or array of two dates for a range
 * @param options - Intl.DateTimeFormatOptions for customizing the output
 * @returns Formatted date string
 */
export function formatDate(
  date: string | number | Date | [string, string] | null,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  }
): string {
  if (!date) return "";

  // Handle date range
  if (Array.isArray(date)) {
    const startDate = new Date(date[0]);
    const endDate = new Date(date[1]);

    // Check if both dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return "Invalid date range";
    }

    return `${new Intl.DateTimeFormat("en-US", options).format(
      startDate
    )} - ${new Intl.DateTimeFormat("en-US", options).format(endDate)}`;
  }

  // Handle single date
  const dateObj =
    typeof date === "string" || typeof date === "number"
      ? new Date(date)
      : date;

  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-US", options).format(dateObj);
}
