import { NextRequest, NextResponse } from "next/server";

// Define the expected session start request structure
interface SessionStartRequest {
  prolificId: string;
  studyId: string;
  sessionId: string;
  scenarioType: string;
  role?: "normal" | "domain";
  isTraining?: boolean;
  deviceInfo?: Record<string, any>;
}

/**
 * API handler for starting a new user session
 * Replaces the mock createUser and createSession functions
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the incoming request body
    const body = (await request.json()) as SessionStartRequest;

    // Validate required fields
    if (
      !body.prolificId ||
      !body.studyId ||
      !body.sessionId ||
      !body.scenarioType
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Default values
    const role = body.role || "normal";
    const isTraining = body.isTraining || false;

    // Generate a unique session identifier
    const uniqueSessionId = `${body.prolificId}_${body.studyId}_${
      body.sessionId
    }_${Date.now()}`;

    // TODO: In a real implementation, this would save to a database
    // For now, we'll log the data as the mock functions did
    console.log("API: createUser", {
      prolificId: body.prolificId,
      studyId: body.studyId,
      sessionId: body.sessionId,
      role,
    });

    console.log("API: createSession", {
      prolificId: body.prolificId,
      scenarioType: body.scenarioType,
      uniqueSessionId,
      isTraining,
      deviceInfo: body.deviceInfo,
    });

    // TODO: Database integration
    // Example using a simple DB adapter (to be implemented)
    /*
    // First, create or update the user
    const user = await db.user.upsert({
      where: { prolificId: body.prolificId },
      update: { 
        lastActive: new Date(),
        // Only update these if not already set
        studyId: { set: body.studyId },
        role: { set: role },
      },
      create: {
        prolificId: body.prolificId,
        studyId: body.studyId,
        sessionId: body.sessionId,
        role: role,
        createdAt: new Date(),
        lastActive: new Date()
      }
    })
    
    // Then create a new session for this user
    const session = await db.session.create({
      data: {
        id: uniqueSessionId,
        userId: body.prolificId,
        studyId: body.studyId,
        sessionId: body.sessionId,
        scenarioType: body.scenarioType,
        isTraining: isTraining,
        deviceInfo: body.deviceInfo ? JSON.stringify(body.deviceInfo) : null,
        startedAt: new Date(),
        isCompleted: false
      }
    })
    */

    return NextResponse.json({
      success: true,
      userId: body.prolificId,
      sessionId: uniqueSessionId,
      message: "Session started successfully",
    });
  } catch (error) {
    console.error("Error starting session:", error);
    return NextResponse.json(
      { error: "Failed to start session" },
      { status: 500 }
    );
  }
}
