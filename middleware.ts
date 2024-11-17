import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Set timezone for all API routes
  process.env.TZ = "Asia/Kolkata";
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
