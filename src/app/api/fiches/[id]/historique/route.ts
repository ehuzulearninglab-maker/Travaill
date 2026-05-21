import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { listHistorique } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Connexion requise." }, { status: 401 });
  }

  const { id } = await context.params;
  return NextResponse.json({ historique: await listHistorique(id, user.id) });
}
