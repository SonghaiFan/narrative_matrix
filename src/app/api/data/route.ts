import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { ScenarioMetadata, Entity, Topic, NarrativeEvent } from "@/types/lite";
import { Quiz, QuizItem } from "@/components/features/task/quiz-types";

// Types for our data structure
type DataType = "scenario" | "quiz" | "events" | "training";

interface EventData extends NarrativeEvent {
  id: string;
  studyId: string;
  sessionId: string;
  type: string;
  content: {
    entities: Entity[];
    topic: Topic;
  };
  timestamp: number;
}

type DataRequest = {
  studyId: string;
  sessionId: string;
  type: DataType;
};

// Cache for file contents
const fileCache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

async function readJsonFile(filePath: string): Promise<any> {
  try {
    // Check cache first
    const cacheEntry = fileCache[filePath];
    const now = Date.now();

    if (cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION) {
      return cacheEntry.data;
    }

    const content = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(content);

    // Update cache
    fileCache[filePath] = { data, timestamp: now };

    return data;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
}

async function getScenarioData(
  studyId: string,
  sessionId: string
): Promise<ScenarioMetadata | null> {
  const filePath = path.join(
    process.cwd(),
    "public",
    "scenario",
    "scenario_data.json"
  );
  const data = await readJsonFile(filePath);
  return data?.[studyId]?.sessions?.[sessionId] || null;
}

async function getQuizData(
  studyId: string,
  sessionId: string
): Promise<QuizItem[] | null> {
  // Read quiz data
  const quizPath = path.join(process.cwd(), "public", "quiz", "quiz_data.json");
  const quizData = await readJsonFile(quizPath);

  // Return the quiz array directly
  return quizData?.quiz || null;
}

async function getEventsData(
  studyId: string,
  sessionId: string
): Promise<EventData[] | null> {
  const filePath = path.join(process.cwd(), "public", "events", "data.json");
  const data = await readJsonFile(filePath);
  const eventData = data || {};

  // TODO: Processing events by studyId and sessionId in the future
  return eventData;
}

async function getTrainingData(
  studyId: string,
  sessionId: string
): Promise<{
  quizzes: QuizItem[];
  events: EventData[];
} | null> {
  const quizPath = path.join(
    process.cwd(),
    "public",
    "quiz",
    "train_quiz_data.json"
  );
  const eventsPath = path.join(
    process.cwd(),
    "public",
    "events",
    "train_data.json"
  );

  const [quizData, eventsData] = await Promise.all([
    readJsonFile(quizPath) as Promise<Record<string, QuizItem>>,
    readJsonFile(eventsPath) as Promise<EventData[]>,
  ]);

  if (!quizData || !eventsData) return null;

  return {
    quizzes: Object.values(quizData),
    events: eventsData.filter(
      (event: any) => event.studyId === studyId && event.sessionId === sessionId
    ),
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studyId = searchParams.get("study_id");
    const sessionId = searchParams.get("session_id");
    const type = searchParams.get("type") as DataType;

    if (!studyId || !sessionId || !type) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    let data = null;

    switch (type) {
      case "scenario":
        data = await getScenarioData(studyId, sessionId);
        break;
      case "quiz":
        data = await getQuizData(studyId, sessionId);
        break;
      case "events":
        data = await getEventsData(studyId, sessionId);
        break;
      case "training":
        data = await getTrainingData(studyId, sessionId);
        break;
      default:
        return NextResponse.json(
          { error: "Invalid data type" },
          { status: 400 }
        );
    }

    if (!data) {
      return NextResponse.json({ error: "Data not found" }, { status: 404 });
    }

    // Set cache headers
    const headers = {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    };

    return NextResponse.json(data, { headers });
  } catch (error) {
    console.error("Error handling request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
