"use client";

import { useState, useRef, useEffect } from "react";
import { NarrativeEvent } from "@/types/narrative/lite";
import { useCenterControl } from "@/contexts/center-control-context";
import { Send, User, Bot, Loader2, Info } from "lucide-react";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date | string;
}

interface ChatInterfaceProps {
  events: NarrativeEvent[];
  className?: string;
}

const MAX_MESSAGES = 20;

// Regex to match event references in the format [Event #X]
const EVENT_REFERENCE_REGEX = /\[Event #(\d+)\]/g;

export function ChatInterface({ events, className = "" }: ChatInterfaceProps) {
  const { selectedEventId, getSelectedEvent, setSelectedEventId } =
    useCenterControl();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI assistant for narrative analysis. I can help you understand the events, characters, and themes in this narrative. I'll reference specific events using the format [Event #X] to help you navigate the narrative. For example, if I mention [Event #3], you can click on it to view that event. You can ask me questions about specific events or the narrative as a whole. You have 20 messages remaining.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [previousSelectedEventId, setPreviousSelectedEventId] = useState<
    number | null
  >(null);

  // Calculate remaining messages
  const userMessageCount = messages.filter((msg) => msg.role === "user").length;
  const remainingMessages = MAX_MESSAGES - userMessageCount;
  const hasReachedLimit = remainingMessages <= 0;

  // Function to handle event reference clicks
  const handleEventReferenceClick = (eventId: number) => {
    // Simply set the selected event ID without validation
    setSelectedEventId(eventId);
  };

  // Function to parse message content and render event references as links
  const renderMessageWithEventLinks = (content: string) => {
    if (!content) return null;

    // Split the content by event references
    const parts = content.split(EVENT_REFERENCE_REGEX);

    if (parts.length === 1) {
      // No event references found
      return <span>{content}</span>;
    }

    const result = [];
    let i = 0;

    // Reconstruct the content with clickable links for event references
    while (i < parts.length) {
      // Add the text before the reference
      if (parts[i]) {
        result.push(<span key={`text-${i}`}>{parts[i]}</span>);
      }

      // Add the event reference as a link if there is one
      if (i + 1 < parts.length) {
        const eventId = parseInt(parts[i + 1], 10);
        result.push(
          <button
            key={`event-${i + 1}`}
            className="text-blue-600 hover:underline font-medium px-1 py-0.5 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
            onClick={() => handleEventReferenceClick(eventId)}
          >
            [Event #{eventId}]
          </button>
        );
        i += 2; // Skip the event ID part
      } else {
        i++;
      }
    }

    return <>{result}</>;
  };

  // Effect to handle selected event changes
  useEffect(() => {
    // Only proceed if the selectedEventId has changed and is not null
    if (
      selectedEventId !== previousSelectedEventId &&
      selectedEventId !== null
    ) {
      const selectedEvent = getSelectedEvent();

      if (selectedEvent) {
        // Create a suggestion message about the selected event
        const newMessage: Message = {
          role: "assistant",
          content: `I notice you've selected [Event #${selectedEventId}]: "${selectedEvent.text.substring(
            0,
            100
          )}${
            selectedEvent.text.length > 100 ? "..." : ""
          }" Would you like to know more about this event?`,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, newMessage]);

        // Pre-fill the input with a question about the event
        setInput(`Tell me more about [Event #${selectedEventId}]`);
      }
    }

    // Update the previous selected event ID
    setPreviousSelectedEventId(selectedEventId);
  }, [selectedEventId, getSelectedEvent]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle when a new event is selected
  useEffect(() => {
    if (selectedEventId !== null && selectedEventId !== undefined) {
      const selectedEvent = events.find(
        (event) => event.index === selectedEventId
      );
      if (selectedEvent) {
        // Update or add a system message about the selected event
        setMessages((prev) => {
          // Find the last system message index, if any
          const lastSystemIndex = [...prev]
            .reverse()
            .findIndex((msg) => msg.role === "system");

          // If no system message exists, add a new one
          if (lastSystemIndex === -1) {
            return [
              ...prev,
              {
                role: "system",
                content: `Event selected: [Event #${selectedEventId}] "${selectedEvent.text}"`,
                timestamp: new Date().toISOString(),
              },
            ];
          }

          // Otherwise, update the existing system message
          const actualIndex = prev.length - 1 - lastSystemIndex;
          const newMessages = [...prev];
          newMessages[actualIndex] = {
            role: "system",
            content: `Event selected: [Event #${selectedEventId}] "${selectedEvent.text}"`,
            timestamp: new Date().toISOString(),
          };

          return newMessages;
        });
      }
    }
  }, [selectedEventId, events]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || hasReachedLimit) return;

    // Add user message to chat
    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Call the OpenAI API route
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messages.concat(userMessage),
          events,
          selectedEventId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Use the error message from the API if available
        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
        } else {
          throw new Error(data.error || "Failed to get response from API");
        }
      } else {
        // Add the assistant's response to the messages
        setMessages((prev) => [...prev, data.message]);
      }
    } catch (error) {
      console.error("Error in chat:", error);

      // Add an error message to the chat
      const errorMessage: Message = {
        role: "assistant",
        content:
          "I'm sorry, but I encountered an error while processing your request. Please try again later.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);

      // Focus the input after sending
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  // Handle textarea height adjustment
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    // Reset height to auto to get the correct scrollHeight
    e.target.style.height = "auto";

    // Set the height to scrollHeight + 2px for border
    const newHeight = Math.min(e.target.scrollHeight, 100);
    e.target.style.height = `${newHeight}px`;
  };

  // Handle Enter key to submit (with Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Format timestamp
  const formatTime = (date: Date | string) => {
    if (typeof date === "string") {
      // If it's a string, convert it to a Date object first
      return new Date(date).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    // If it's already a Date object
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      className={`flex flex-col h-full bg-white overflow-hidden ${className}`}
    >
      {/* Compact Header */}
      <div className="p-2 bg-gray-50 border-b border-gray-100 flex items-center">
        <div className="flex items-center">
          <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center mr-2">
            <Bot className="w-3 h-3 text-gray-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">
              AI Assistant
            </h2>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-auto p-2 space-y-2 bg-white text-xs">
        {/* System message container - only show if there are system messages */}
        {messages.some((msg) => msg.role === "system") && (
          <div className="sticky top-0 z-10 mb-2 bg-white pb-1">
            <div className="bg-blue-50 border border-blue-100 rounded-md p-2 text-xs text-blue-700 shadow-sm">
              <div className="flex items-center">
                <Info className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                <span className="font-medium">Current Selection:</span>
              </div>
              <div className="pl-5 mt-1 text-blue-600 line-clamp-2">
                {messages.filter((msg) => msg.role === "system").pop()?.content}
              </div>
            </div>
          </div>
        )}

        {/* Regular chat messages - filter out system messages */}
        {messages
          .filter((msg) => msg.role !== "system")
          .map((message, index, filteredArray) => (
            <div
              key={`msg-${message.timestamp}`}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              } ${
                index > 0 && filteredArray[index - 1].role === message.role
                  ? "mt-1"
                  : "mt-2"
              }`}
            >
              {message.role === "assistant" && (
                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center mr-1 mt-1 flex-shrink-0">
                  <Bot className="w-3 h-3 text-gray-600" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-lg px-2 py-1.5 ${
                  message.role === "user"
                    ? "bg-gray-800 text-white rounded-tr-none"
                    : message.role === "system"
                    ? "bg-gray-100 text-gray-600 italic text-xs"
                    : "bg-gray-100 text-gray-800 rounded-tl-none"
                }`}
              >
                <div className="whitespace-pre-wrap text-xs">
                  {message.role === "user"
                    ? message.content
                    : renderMessageWithEventLinks(message.content)}
                </div>
                <div
                  className={`text-[9px] mt-0.5 text-right ${
                    message.role === "user" ? "text-gray-300" : "text-gray-400"
                  }`}
                >
                  {formatTime(message.timestamp)}
                </div>
              </div>

              {message.role === "user" && (
                <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center ml-1 mt-1 flex-shrink-0">
                  <User className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          ))}
        <div ref={messagesEndRef} />

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center">
            <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center mr-1 flex-shrink-0">
              <Bot className="w-3 h-3 text-gray-600" />
            </div>
            <div className="bg-gray-100 text-gray-500 rounded-lg px-2 py-1.5 rounded-tl-none">
              <div className="flex space-x-1">
                <div
                  className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-2 border-t border-gray-100">
        {isLoading && (
          <div className="flex items-center justify-center mb-2">
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin mr-1" />
            <span className="text-xs text-gray-400">AI is thinking...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-1">
          <div className="flex items-center justify-between mb-1 px-1">
            <div className="text-xs text-gray-500">
              {remainingMessages <= 5 ? (
                <span className="text-amber-600">
                  {remainingMessages} message{remainingMessages !== 1 && "s"}{" "}
                  remaining
                </span>
              ) : (
                <span>
                  {remainingMessages} message{remainingMessages !== 1 && "s"}{" "}
                  remaining
                </span>
              )}
            </div>
          </div>

          <div className="flex items-end gap-1 mb-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={
                hasReachedLimit
                  ? "Message limit reached"
                  : "Type your message..."
              }
              disabled={isLoading || hasReachedLimit}
              className="flex-1 resize-none border rounded-md px-2 py-1.5 text-xs min-h-[36px] max-h-[100px] focus:outline-none focus:ring-1 focus:ring-gray-300 disabled:bg-gray-50 disabled:text-gray-400"
              style={{ height: "36px" }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading || hasReachedLimit}
              className="bg-gray-800 text-white rounded-md p-1.5 disabled:opacity-50 disabled:cursor-not-allowed self-end"
            >
              <Send className="w-3 h-3" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
