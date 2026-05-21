import { NextResponse } from "next/server";
import { buildFichePdf } from "@/lib/export-pdf";
import { getCurrentUser } from "@/lib/current-user";
import { getFiche } from "@/lib/storage";

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

  const buffer = await buildFichePdf(fiche);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fiche.titre.replace(/[^a-z0-9-]+/gi, "_")}.pdf"`
    }
  });
}
