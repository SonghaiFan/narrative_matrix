"use client";

import { useState, useEffect } from "react";
import { resetTaskProgress, resetAllTaskProgress } from "@/lib/task-progress";

interface StorageItem {
  key: string;
  value: any;
  type: string;
  source: "localStorage" | "cookie";
  expiration?: string;
}

// List of keys that are relevant to our project
const PROJECT_RELATED_KEYS = [
  "user",
  "taskProgress_",
  "studyCompleted",
  "hasCompletedIntro",
  "hasCompletedIntro_expiration",
  "hasCompletedTraining_",
  "hasCompletedTraining_expiration",
  "selectedFile",
  "selectedScenario",
  "selectedEvents",
  "selectedEntities",
  "selectedTopics",
  "selectedScenarios",
  "studyType",
  "completionCode",
  "lastUpdated",
  "totalTasks",
  "completedTasks",
  "correctTasks",
  "answers",
];

// List of cookies that are relevant to our project
const PROJECT_RELATED_COOKIES = ["hasCompletedIntro"];

export function UserDataViewer() {
  const [storageItems, setStorageItems] = useState<StorageItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<StorageItem | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "all" | "localStorage" | "cookies"
  >("all");

  // Only run on client-side
  useEffect(() => {
    setIsClient(true);
    refreshStorageItems();
  }, []);

  const parseCookies = (): Record<string, string> => {
    const cookies: Record<string, string> = {};
    if (typeof document === "undefined") return cookies;

    document.cookie.split(";").forEach((cookie) => {
      const [name, value] = cookie.trim().split("=");
      if (name) cookies[name] = value || "";
    });

    return cookies;
  };

  const refreshStorageItems = () => {
    if (typeof window === "undefined") return;

    const items: StorageItem[] = [];

    // Get localStorage items
    const keys = Object.keys(localStorage);

    // Filter only project-related keys
    const relevantKeys = keys.filter((key) =>
      PROJECT_RELATED_KEYS.some(
        (projectKey) => key === projectKey || key.startsWith(projectKey)
      )
    );

    // Group related localStorage items (main item and its expiration)
    const groupedItems: Record<string, any> = {};

    relevantKeys.forEach((key) => {
      // Check if this is an expiration key
      if (key.endsWith("_expiration")) {
        const baseKey = key.replace("_expiration", "");
        if (!groupedItems[baseKey]) {
          groupedItems[baseKey] = {};
        }

        // Store expiration timestamp
        const expirationTimestamp = localStorage.getItem(key);
        if (expirationTimestamp) {
          const expirationDate = new Date(parseInt(expirationTimestamp, 10));
          groupedItems[baseKey].expiration = expirationDate.toLocaleString();
          groupedItems[baseKey].expirationKey = key;
        }
      } else {
        // This is a regular key
        if (!groupedItems[key]) {
          groupedItems[key] = {};
        }

        try {
          groupedItems[key].value = JSON.parse(
            localStorage.getItem(key) || "{}"
          );
        } catch (error) {
          groupedItems[key].value = localStorage.getItem(key);
        }

        // Determine the type
        if (key.startsWith("taskProgress_")) {
          groupedItems[key].type = "Task Progress";
        } else if (key === "user") {
          groupedItems[key].type = "User Data";
        } else {
          groupedItems[key].type = "Study Data";
        }
      }
    });

    // Convert grouped items to StorageItem array
    Object.entries(groupedItems).forEach(([key, data]) => {
      if (!key.endsWith("_expiration")) {
        // Skip expiration keys as they're already processed
        items.push({
          key,
          value: data.value,
          type: data.type || "Unknown",
          source: "localStorage",
          expiration: data.expiration,
        });
      }
    });

    // Get cookie items
    const cookies = parseCookies();
    Object.entries(cookies).forEach(([name, value]) => {
      // Only include project-related cookies or if the name is empty (which shouldn't happen)
      if (PROJECT_RELATED_COOKIES.includes(name) || name === "") {
        try {
          // Try to parse as JSON first
          const parsedValue = JSON.parse(value);
          items.push({
            key: name,
            value: parsedValue,
            type: "Cookie Data",
            source: "cookie",
          });
        } catch (error) {
          // If not JSON, store as string
          items.push({
            key: name,
            value,
            type: "Cookie Data",
            source: "cookie",
          });
        }
      }
    });

    setStorageItems(items);
  };

  const handleResetItem = (key: string, source: "localStorage" | "cookie") => {
    if (typeof window === "undefined") return;

    if (source === "localStorage") {
      if (key.startsWith("taskProgress_")) {
        const userId = key.replace("taskProgress_", "");
        resetTaskProgress(userId);
      } else {
        // Remove both the item and its expiration
        localStorage.removeItem(key);
        localStorage.removeItem(`${key}_expiration`);
      }
    } else if (source === "cookie") {
      // Delete the cookie by setting its expiration date to the past
      document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }

    refreshStorageItems();
    setSelectedItem(null);
  };

  const handleResetAllProgress = () => {
    if (
      window.confirm(
        "Are you sure you want to reset all user progress? This cannot be undone."
      )
    ) {
      // Reset all localStorage progress
      resetAllTaskProgress();

      // Remove all introduction completion flags from localStorage
      localStorage.removeItem("hasCompletedIntro");
      localStorage.removeItem("hasCompletedIntro_expiration");

      // Reset all cookies
      PROJECT_RELATED_COOKIES.forEach((cookieName) => {
        document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      });

      refreshStorageItems();
      setSelectedItem(null);
    }
  };

  const handleViewItem = (item: StorageItem) => {
    setSelectedItem(item);
  };

  const filteredItems = storageItems.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "localStorage") return item.source === "localStorage";
    if (activeTab === "cookies") return item.source === "cookie";
    return true;
  });

  if (!isClient) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              User Data Storage
            </h2>
            <p className="text-xs text-gray-500">
              View and manage user data and progress
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={refreshStorageItems}
              className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
            >
              Refresh
            </button>
            <button
              onClick={handleResetAllProgress}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Reset All Progress
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-4 border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("all")}
              className={`py-2 px-4 text-sm font-medium ${
                activeTab === "all"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              All Data
            </button>
            <button
              onClick={() => setActiveTab("localStorage")}
              className={`py-2 px-4 text-sm font-medium ${
                activeTab === "localStorage"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Local Storage
            </button>
            <button
              onClick={() => setActiveTab("cookies")}
              className={`py-2 px-4 text-sm font-medium ${
                activeTab === "cookies"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Cookies
            </button>
          </nav>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No data found. Try refreshing or check browser settings.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b">
                <h3 className="text-sm font-medium text-gray-700">
                  Storage Items
                </h3>
              </div>
              <div className="divide-y max-h-96 overflow-y-auto">
                {filteredItems.map((item) => (
                  <div
                    key={`${item.source}-${item.key}`}
                    onClick={() => handleViewItem(item)}
                    className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${
                      selectedItem?.key === item.key &&
                      selectedItem?.source === item.source
                        ? "bg-blue-50"
                        : ""
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-sm text-gray-900 mb-1">
                          {item.key}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.type} ({item.source})
                          {item.expiration && (
                            <span className="ml-2">
                              Expires: {item.expiration}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResetItem(item.key, item.source);
                        }}
                        className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b">
                <h3 className="text-sm font-medium text-gray-700">
                  {selectedItem
                    ? "Item Details"
                    : "Select an item to view details"}
                </h3>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                {selectedItem ? (
                  <div>
                    <div className="mb-4">
                      <div className="text-xs font-medium text-gray-500 mb-1">
                        Key
                      </div>
                      <div className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
                        {selectedItem.key}
                      </div>
                    </div>

                    {selectedItem.expiration && (
                      <div className="mb-4">
                        <div className="text-xs font-medium text-gray-500 mb-1">
                          Expiration
                        </div>
                        <div className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
                          {selectedItem.expiration}
                        </div>
                      </div>
                    )}

                    <div className="mb-4">
                      <div className="text-xs font-medium text-gray-500 mb-1">
                        Type
                      </div>
                      <div className="text-sm text-gray-900">
                        {selectedItem.type}
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="text-xs font-medium text-gray-500 mb-1">
                        Source
                      </div>
                      <div className="text-sm text-gray-900">
                        {selectedItem.source === "localStorage"
                          ? "Local Storage"
                          : "Cookie"}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">
                        Value
                      </div>
                      <pre className="text-xs text-gray-900 font-mono bg-gray-50 p-2 rounded overflow-x-auto">
                        {typeof selectedItem.value === "object"
                          ? JSON.stringify(selectedItem.value, null, 2)
                          : selectedItem.value}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Select an item from the list to view details
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
