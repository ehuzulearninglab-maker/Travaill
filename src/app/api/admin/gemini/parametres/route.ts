import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { getGeminiAdminStatus, updateGeminiSettings } from "@/lib/storage";

export const runtime = "nodejs";

type GeminiSettingsBody = {
  gemini_api_key?: string;
  gemini_model?: string;
  effacer_cle?: boolean;
};

export async function GET() {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ message: "Accès administrateur requis." }, { status: 403 });
  }

  return NextResponse.json({ parametres: await getGeminiAdminStatus() });
}

export async function POST(request: Request) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ message: "Accès administrateur requis." }, { status: 403 });
  }

  const body = (await request.json()) as GeminiSettingsBody;
  const model = typeof body.gemini_model === "string" ? body.gemini_model.trim() : "";
  const apiKey = typeof body.gemini_api_key === "string" ? body.gemini_api_key.trim() : undefined;

  if (!model) {
    return NextResponse.json({ message: "Le modèle Gemini est requis." }, { status: 400 });
  }

  await updateGeminiSettings({
    gemini_api_key: apiKey,
    gemini_model: model,
    effacer_cle: body.effacer_cle === true
  });

  const parametres = await getGeminiAdminStatus();
  return NextResponse.json({
    succes: true,
    parametres,
    message:
      parametres.avertissement ||
      (body.effacer_cle === true ? "Clé Gemini retirée." : "Paramètres Gemini enregistrés.")
  });
}
