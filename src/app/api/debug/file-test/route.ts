import { NextResponse } from "next/server";
import { testFileAccess } from "@/lib/server/file-test";

/**
 * Debug API endpoint to test file access
 * Use this to check if file paths are correct and readable
 */
export async function GET() {
  try {
    const result = await testFileAccess();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in file-test API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
