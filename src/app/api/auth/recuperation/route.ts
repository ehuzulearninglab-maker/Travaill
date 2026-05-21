import { NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    if (body.email) {
      await getUserByEmail(body.email);
    }
  } catch {
    return NextResponse.json({ succes: true });
  }

  return NextResponse.json({ succes: true });
}
