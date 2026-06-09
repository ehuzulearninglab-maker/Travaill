import { NextResponse } from "next/server";
import {
  CANTINE_ADMIN_COOKIE,
  cantineAdminSessionMaxAge,
  createCantineAdminSession,
  isCantineAdminPasswordConfigured,
  verifyCantineAdminPassword
} from "@/lib/cantine-admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isCantineAdminPasswordConfigured()) {
    return NextResponse.json(
      { message: "Mot de passe admin non configure. Ajoutez CANTINE_ADMIN_PASSWORD sur Vercel." },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { password?: string };
  const password = typeof body.password === "string" ? body.password : "";

  if (!(await verifyCantineAdminPassword(password))) {
    return NextResponse.json({ message: "Mot de passe incorrect." }, { status: 401 });
  }

  const response = NextResponse.json({ succes: true });
  response.cookies.set(CANTINE_ADMIN_COOKIE, createCantineAdminSession(), {
    httpOnly: true,
    maxAge: cantineAdminSessionMaxAge,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
  return response;
}
