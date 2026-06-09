import { NextResponse } from "next/server";
import { CANTINE_ADMIN_COOKIE } from "@/lib/cantine-admin-auth";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ succes: true });
  response.cookies.set(CANTINE_ADMIN_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
  return response;
}
