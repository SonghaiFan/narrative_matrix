import { NextRequest, NextResponse } from "next/server";

// Define the expected session end request structure
interface SessionEndRequest {
  sessionId: string;
  completionData?: {
    totalTasks?: number;
    completedTasks?: number;
    totalTime?: number;
  };
}

/**
 * API handler for ending a user session
 * Replaces the mock endSession function
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the incoming request body
    const body = (await request.json()) as SessionEndRequest;

    // Validate required fields
    if (!body.sessionId) {
      return NextResponse.json(
        { error: "Missing session ID" },
        { status: 400 }
      );
    }

    // TODO: In a real implementation, this would update a database
    // For now, we'll log the data as the mock function did
    console.log("API: endSession", {
      sessionId: body.sessionId,
      completionData: body.completionData || {},
    });

    // TODO: Database integration
    // Example using a simple DB adapter (to be implemented)
    /*
    // Update the session record
    await db.session.update({
      where: { id: body.sessionId },
      data: {
        isCompleted: true,
        completedAt: new Date(),
        totalTasks: body.completionData?.totalTasks,
        completedTasks: body.completionData?.completedTasks,
        totalTime: body.completionData?.totalTime
      }
    })
    */

    return NextResponse.json({
      success: true,
      message: "Session ended successfully",
    });
  } catch (error) {
    console.error("Error ending session:", error);
    return NextResponse.json(
      { error: "Failed to end session" },
      { status: 500 }
    );
  }
}
