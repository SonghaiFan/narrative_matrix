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

  // Check if the route is a scenario path
  const isScenarioPath =
    pathname.startsWith("/pure-text") ||
    pathname.startsWith("/text-visual") ||
    pathname.startsWith("/text-chat") ||
    pathname.startsWith("/mixed");

  if (isScenarioPath) {
    // Direct access to all scenario pages
    return NextResponse.next();
  }

  // Default: allow request to proceed
  return NextResponse.next();
}

// Configure middleware to run on all paths except specific exclusions
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
