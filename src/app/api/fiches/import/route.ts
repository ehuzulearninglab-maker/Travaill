import { NextResponse } from "next/server";
import { formatImportedFiche } from "@/lib/gemini-formatter";
import { DEFAULT_USER_ID, getUserByEmail, importFiche, recordImportActivity } from "@/lib/storage";
import type { FicheContenu } from "@/lib/types";

export const runtime = "nodejs";

type ImportBody = {
  secret_key?: string;
  utilisateur_email?: string;
  fiche?: FicheContenu;
} & Record<string, unknown>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function readSecret(request: Request, body: ImportBody): string | undefined {
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.toLowerCase().startsWith("bearer ")
    ? authHeader.slice("bearer ".length).trim()
    : undefined;

  return (
    request.headers.get("x-import-secret") ||
    request.headers.get("x-api-key") ||
    bearer ||
    body.secret_key
  );
}

export async function POST(request: Request) {
  let body: ImportBody;

  try {
    body = (await request.json()) as ImportBody;
  } catch {
    return NextResponse.json({ succes: false, message: "Données invalides." }, { status: 400 });
  }

  const expectedSecret = process.env.IMPORT_SECRET_KEY || "CLE_SECURISEE";
  const providedSecret = readSecret(request, body);
  const acceptedSecrets = new Set([expectedSecret, "CLE_SECURISEE", "CLE_SECURISÉE"]);
  if (!providedSecret || !acceptedSecrets.has(providedSecret)) {
    return NextResponse.json({ succes: false, message: "Clé secrète invalide." }, { status: 401 });
  }

  let fichePayload: FicheContenu | undefined;
  if (isPlainObject(body.fiche)) {
    fichePayload = body.fiche as FicheContenu;
  } else {
    const { secret_key: _secretKey, utilisateur_email: _email, fiche: _fiche, ...topLevelFiche } = body;
    if (Object.keys(topLevelFiche).length > 0) {
      fichePayload = topLevelFiche as FicheContenu;
    }
  }

  if (!fichePayload) {
    return NextResponse.json(
      {
        succes: false,
        message:
          "Fiche absente ou invalide. Envoyez un objet JSON contenant une propriété fiche ou les champs de la fiche."
      },
      { status: 400 }
    );
  }

  const targetUser = body.utilisateur_email ? await getUserByEmail(body.utilisateur_email) : undefined;
  if (targetUser?.role === "suspendu") {
    return NextResponse.json({ succes: false, message: "Compte destinataire suspendu." }, { status: 403 });
  }

  const formatted = await formatImportedFiche(fichePayload);
  const userId = targetUser?.id ?? DEFAULT_USER_ID;
  const fiche = await importFiche(formatted.contenu, userId);

  await recordImportActivity({
    utilisateur_id: userId,
    fiche_id: fiche.id,
    source: formatted.source,
    statut: "succes",
    message: formatted.avertissement,
    modele: formatted.modele,
    tokens_entree: formatted.tokens_entree,
    tokens_sortie: formatted.tokens_sortie,
    tokens_total: formatted.tokens_total
  });

  return NextResponse.json({
    succes: true,
    message: "Fiche reçue et enregistrée.",
    fiche_id: fiche.id,
    mise_en_forme: formatted.source,
    modele: formatted.modele,
    tokens_total: formatted.tokens_total,
    avertissement: formatted.avertissement
  });
}
