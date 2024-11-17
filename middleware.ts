import { NextResponse } from "next/server";

export function middleware(request: Request) {
  // Set the timezone to IST (Asia/Kolkata)
  process.env.TZ = "Asia/Kolkata";

  return NextResponse.next();
}
