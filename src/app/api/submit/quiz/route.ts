import { NextRequest, NextResponse } from "next/server";

// Define the expected quiz submission structure
interface QuizSubmission {
  prolificId: string;
  sessionId: string;
  quizData: {
    question: string;
    userAnswer: string | string[];
    markedEvents: number[];
    isSkipped: boolean;
    isTimeUp: boolean;
    isTraining: boolean;
    taskId: string;
    startTime: number;
    endTime: number;
  };
}

/**
 * API handler for quiz response submissions
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the incoming request body
    const body = (await request.json()) as QuizSubmission;

    // Validate required fields
    if (!body.prolificId || !body.sessionId || !body.quizData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate quiz data
    const { quizData } = body;
    if (!quizData.question || !quizData.taskId) {
      return NextResponse.json(
        { error: "Missing quiz question or taskId" },
        { status: 400 }
      );
    }

    // TODO: In a real implementation, this would save to a database
    // For now, we'll log the data as the mock function did
    console.log("API: saveQuizResponse", {
      prolificId: body.prolificId,
      sessionId: body.sessionId,
      quizData: body.quizData,
    });

    // TODO: Database integration
    // Example using a simple DB adapter (to be implemented)
    /*
    await db.quiz.create({
      data: {
        userId: body.prolificId,
        sessionId: body.sessionId,
        question: body.quizData.question,
        answer: Array.isArray(body.quizData.userAnswer) 
          ? body.quizData.userAnswer.join(', ') 
          : body.quizData.userAnswer,
        markedEvents: body.quizData.markedEvents,
        isSkipped: body.quizData.isSkipped,
        isTimeUp: body.quizData.isTimeUp,
        isTraining: body.quizData.isTraining,
        taskId: body.quizData.taskId,
        startTime: new Date(body.quizData.startTime),
        endTime: new Date(body.quizData.endTime),
        createdAt: new Date()
      }
    })
    */

    return NextResponse.json(
      { success: true, message: "Quiz response saved successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving quiz response:", error);
    return NextResponse.json(
      { error: "Failed to save quiz response" },
      { status: 500 }
    );
  }
}
