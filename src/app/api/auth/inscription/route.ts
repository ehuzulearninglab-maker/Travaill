import { NextResponse } from "next/server";
import { SESSION_COOKIE, createSessionToken, hashPassword, sessionMaxAge } from "@/lib/auth";
import { createUser } from "@/lib/storage";

export async function POST(request: Request) {
  const body = (await request.json()) as { nom?: string; email?: string; mot_de_passe?: string };
  const nom = body.nom?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.mot_de_passe;

  if (!nom || !email || !password) {
    return NextResponse.json({ message: "Tous les champs sont requis." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ message: "Le mot de passe doit contenir au moins 8 caractères." }, { status: 400 });
  }

  try {
    const user = await createUser({
      nom,
      email,
      mot_de_passe: await hashPassword(password)
    });
    const response = NextResponse.json({ succes: true });
    response.cookies.set(SESSION_COOKIE, createSessionToken(user), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionMaxAge,
      path: "/"
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Impossible de créer le compte." },
      { status: 400 }
    );
  }
}
