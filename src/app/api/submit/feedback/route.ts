import { NextRequest, NextResponse } from "next/server";

// Define the expected feedback submission structure
interface FeedbackSubmission {
  userId: string;
  sessionId: string;
  feedback: {
    visualizationUsage: {
      frequency: number;
      helpfulness: number;
      preference: number;
    };
    experience: {
      withVisualization: number;
      withoutVisualization: number;
      overall: number;
    };
    visualizationRatings: {
      entity: number;
      topic: number;
      time: number;
    };
    comments?: string;
  };
}

/**
 * API handler for user feedback submissions
 * Replaces the mock saveFeedback and updateSessionCompletion functions
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the incoming request body
    const body = (await request.json()) as FeedbackSubmission;

    // Validate required fields
    if (!body.userId || !body.sessionId || !body.feedback) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate feedback data (basic validation)
    const { feedback } = body;
    if (
      !feedback.visualizationUsage ||
      !feedback.experience ||
      !feedback.visualizationRatings
    ) {
      return NextResponse.json(
        { error: "Incomplete feedback data" },
        { status: 400 }
      );
    }

    // Validate rating ranges (assuming 1-5 scale)
    const validateRatingRange = (rating: number) => rating >= 1 && rating <= 5;

    const allRatingsValid =
      validateRatingRange(feedback.visualizationUsage.frequency) &&
      validateRatingRange(feedback.visualizationUsage.helpfulness) &&
      validateRatingRange(feedback.visualizationUsage.preference) &&
      validateRatingRange(feedback.experience.withVisualization) &&
      validateRatingRange(feedback.experience.withoutVisualization) &&
      validateRatingRange(feedback.experience.overall) &&
      validateRatingRange(feedback.visualizationRatings.entity) &&
      validateRatingRange(feedback.visualizationRatings.topic) &&
      validateRatingRange(feedback.visualizationRatings.time);

    if (!allRatingsValid) {
      return NextResponse.json(
        { error: "Ratings must be between 1 and 5" },
        { status: 400 }
      );
    }

    // TODO: In a real implementation, this would save to a database
    // For now, we'll log the data as the mock function did
    console.log("API: saveFeedback", {
      userId: body.userId,
      sessionId: body.sessionId,
      feedback: body.feedback,
    });

    // TODO: Database integration
    // Example using a simple DB adapter (to be implemented)
    /*
    await db.feedback.create({
      data: {
        userId: body.userId,
        sessionId: body.sessionId,
        visualizationUsageFrequency: body.feedback.visualizationUsage.frequency,
        visualizationUsageHelpfulness: body.feedback.visualizationUsage.helpfulness,
        visualizationUsagePreference: body.feedback.visualizationUsage.preference,
        experienceWithVisualization: body.feedback.experience.withVisualization,
        experienceWithoutVisualization: body.feedback.experience.withoutVisualization,
        experienceOverall: body.feedback.experience.overall,
        visualizationRatingsEntity: body.feedback.visualizationRatings.entity,
        visualizationRatingsTopic: body.feedback.visualizationRatings.topic,
        visualizationRatingsTime: body.feedback.visualizationRatings.time,
        comments: body.feedback.comments || "",
        createdAt: new Date()
      }
    })
    
    // Also mark the session as completed
    await db.session.update({
      where: { id: body.sessionId },
      data: {
        isCompleted: true,
        completedAt: new Date()
      }
    })
    */

    return NextResponse.json(
      { success: true, message: "Feedback saved successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving feedback:", error);
    return NextResponse.json(
      { error: "Failed to save feedback" },
      { status: 500 }
    );
  }
}
