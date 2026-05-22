import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { deleteFiche, getFiche, updateFiche } from "@/lib/storage";
import type { FicheContenu } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Connexion requise." }, { status: 401 });
  }

  const { id } = await context.params;
  const fiche = await getFiche(id, user.id);
  if (!fiche) {
    return NextResponse.json({ message: "Fiche introuvable." }, { status: 404 });
  }

  return NextResponse.json({ fiche });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Connexion requise." }, { status: 401 });
  }

  const body = (await request.json()) as { contenu_json?: FicheContenu };
  if (!body.contenu_json || typeof body.contenu_json !== "object" || Array.isArray(body.contenu_json)) {
    return NextResponse.json({ message: "Contenu invalide." }, { status: 400 });
  }

  const { id } = await context.params;
  const fiche = await updateFiche(id, user.id, body.contenu_json);
  if (!fiche) {
    return NextResponse.json({ message: "Fiche introuvable." }, { status: 404 });
  }

  return NextResponse.json({ succes: true, fiche });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Connexion requise." }, { status: 401 });
  }

  const { id } = await context.params;
  const deleted = await deleteFiche(id, user.id);
  if (!deleted) {
    return NextResponse.json({ message: "Fiche introuvable." }, { status: 404 });
  }

  return NextResponse.json({ succes: true });
}
