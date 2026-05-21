import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { createFiche, listFiches } from "@/lib/storage";
import type { FicheContenu } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Connexion requise." }, { status: 401 });
  }

  return NextResponse.json({ fiches: await listFiches(user.id) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Connexion requise." }, { status: 401 });
  }

  let contenu: FicheContenu | undefined;
  try {
    const body = (await request.json()) as { fiche?: FicheContenu };
    contenu = body.fiche;
  } catch {
    contenu = undefined;
  }

  const fiche = await createFiche(user.id, contenu);
  return NextResponse.json({ succes: true, fiche }, { status: 201 });
}
