import { NextResponse } from "next/server";
import { getUserByEmail, importFiche } from "@/lib/storage";
import type { FicheContenu } from "@/lib/types";

export const runtime = "nodejs";

type ImportBody = {
  secret_key?: string;
  utilisateur_email?: string;
  fiche?: FicheContenu;
};

export async function POST(request: Request) {
  let body: ImportBody;

  try {
    body = (await request.json()) as ImportBody;
  } catch {
    return NextResponse.json({ succes: false, message: "Données invalides." }, { status: 400 });
  }

  const expectedSecret = process.env.IMPORT_SECRET_KEY || "CLE_SECURISÉE";
  if (!body.secret_key || body.secret_key !== expectedSecret) {
    return NextResponse.json({ succes: false, message: "Clé secrète invalide." }, { status: 401 });
  }

  if (!body.fiche || typeof body.fiche !== "object" || Array.isArray(body.fiche)) {
    return NextResponse.json({ succes: false, message: "Fiche absente ou invalide." }, { status: 400 });
  }

  const targetUser = body.utilisateur_email ? await getUserByEmail(body.utilisateur_email) : undefined;
  const fiche = await importFiche(body.fiche, targetUser?.id);

  return NextResponse.json({
    succes: true,
    message: "Fiche reçue et enregistrée.",
    fiche_id: fiche.id
  });
}
