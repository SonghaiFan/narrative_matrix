import { NextResponse } from "next/server";
import { getAvailableScenarios } from "@/lib/get-scenarios";

export async function GET() {
  try {
    const scenarios = await getAvailableScenarios();

    return NextResponse.json({
      scenarios,
    });
  } catch (error) {
    console.error("Error fetching scenarios:", error);
    return NextResponse.json(
      { error: "Failed to fetch scenarios" },
      { status: 500 }
    );
  }
}
