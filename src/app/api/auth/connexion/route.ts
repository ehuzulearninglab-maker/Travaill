import { NextResponse } from "next/server";
import { SESSION_COOKIE, createSessionToken, sessionMaxAge, verifyCredentials } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; mot_de_passe?: string };
  const email = body.email?.trim();
  const password = body.mot_de_passe;

  if (!email || !password) {
    return NextResponse.json({ message: "Courriel et mot de passe requis." }, { status: 400 });
  }

  const user = await verifyCredentials(email, password);
  if (!user) {
    return NextResponse.json({ message: "Identifiants incorrects." }, { status: 401 });
  }

  const response = NextResponse.json({ succes: true });
  response.cookies.set(SESSION_COOKIE, createSessionToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: sessionMaxAge,
    path: "/"
  });
  return response;
}
