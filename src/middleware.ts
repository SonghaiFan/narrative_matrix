import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow access to root (login) page without checks
  if (pathname === "/") {
    return NextResponse.next();
  }

  // Skip middleware for assets, API routes, etc.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes("favicon.ico")
  ) {
    return NextResponse.next();
  }

  // Allow access to completion page (but client-side auth check will still happen)
  if (pathname.startsWith("/completion")) {
    return NextResponse.next();
  }

  // Handle dashboard access - we'll check auth client-side
  if (pathname === "/dashboard") {
    return NextResponse.next();
  }

  // Check if the route is a scenario path
  const isScenarioPath =
    pathname.startsWith("/pure-text") ||
    pathname.startsWith("/text-visual") ||
    pathname.startsWith("/text-chat") ||
    pathname.startsWith("/mixed");

  if (isScenarioPath) {
    // Allow direct access to introduction and training pages
    if (pathname.endsWith("/introduction") || pathname.endsWith("/training")) {
      return NextResponse.next();
    }

    // For main scenario pages, we'll check completion status on client
    const response = NextResponse.next();
    response.headers.set("X-Check-Auth", "true");
    response.headers.set("X-Check-Intro-Completion", "true");
    response.headers.set("X-Check-Training-Completion", "true");
    return response;
  }

  // Default: allow request to proceed
  return NextResponse.next();
}

// Configure middleware to run on all paths except specific exclusions
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
