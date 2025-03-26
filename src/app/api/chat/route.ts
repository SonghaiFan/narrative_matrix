import { OpenAI } from "openai";
import { NextRequest, NextResponse } from "next/server";

// Check if OpenAI API key is available
const apiKey = process.env.OPENAI_API_KEY;

// Initialize OpenAI client if API key is available
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI client is initialized
    if (!openai) {
      console.error(
        "OpenAI API key is missing. Please set the OPENAI_API_KEY environment variable."
      );
      return NextResponse.json(
        {
          error:
            "OpenAI API key is not configured. Please contact the administrator.",
          message: {
            role: "assistant",
            content:
              "I'm sorry, but I'm not available at the moment due to a configuration issue. Please try again later or contact the administrator.",
            timestamp: new Date().toISOString(),
          },
        },
        { status: 500 }
      );
    }

    const { messages, events, selectedEventId } = await request.json();

    // Prepare the system message with context about the narrative
    const systemMessage = {
      role: "system",
      content: `You are an AI assistant helping users analyze a narrative. 
      You have access to a list of narrative events. 
      ${
        selectedEventId
          ? `The user has selected event #${selectedEventId}.`
          : ""
      }
      ${
        events && events.length > 0
          ? `Here are the events in the narrative: ${JSON.stringify(events)}...`
          : "No events are currently available."
      }
      
      CRITICAL FORMATTING REQUIREMENT:
      You MUST reference specific events in EVERY response using the format [Event #X] where X is the event ID.
      For example: "As we can see in [Event #5], the character's motivation becomes clear."
      
      This format creates interactive links in the interface that users can click to navigate to specific events.
      
      RULES FOR REFERENCES:
      1. Include at least 2-3 event references in each response
      2. Always use the exact format [Event #X] - with square brackets, the word "Event", a space, # symbol, and the number
      3. Only reference events that exist in the narrative (events with IDs mentioned in the context)
      4. Make your references relevant to the discussion
      5. When answering general questions, cite specific events as evidence
      
      EXAMPLE GOOD RESPONSE:
      "The main character's journey begins with their initial challenge in [Event #2]. This creates tension that builds through [Event #5] and [Event #8], eventually leading to the resolution we see in [Event #12]."
      
      Do not validate or check if the user's references to events are correct. Simply respond to their questions while following the reference format requirements.`,
    };

    // Format messages for OpenAI API
    const formattedMessages = [
      systemMessage,
      ...messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4-0125-preview",
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 500,
    });

    // Extract the assistant's response
    const assistantResponse = response.choices[0].message;

    // Return the response with timestamp as ISO string
    return NextResponse.json({
      message: {
        role: "assistant",
        content: assistantResponse.content,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      {
        error: "Failed to get response from OpenAI",
        message: {
          role: "assistant",
          content:
            "I'm sorry, but I encountered an error while processing your request. Please try again later.",
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
