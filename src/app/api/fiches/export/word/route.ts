import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { buildFicheWord } from "@/lib/export-word";
import { ficheFromExportBody } from "@/lib/export-request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Connexion requise." }, { status: 401 });
  }

  const fiche = ficheFromExportBody(await request.json(), user.id);
  if (!fiche) {
    return NextResponse.json({ message: "Fiche absente ou invalide." }, { status: 400 });
  }

  const buffer = await buildFicheWord(fiche);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${fiche.titre.replace(/[^a-z0-9-]+/gi, "_")}.docx"`
    }
  });
}

