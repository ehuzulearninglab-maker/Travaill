import { NextResponse } from "next/server";
import { isCantineAdmin } from "@/lib/cantine-admin-auth";
import { getGeminiAdminStatus, updateGeminiSettings } from "@/lib/storage";

export const runtime = "nodejs";

type AiSettingsBody = {
  gemini_api_key?: string;
  gemini_model?: string;
  effacer_cle?: boolean;
};

export async function GET() {
  if (!(await isCantineAdmin())) {
    return NextResponse.json({ message: "Acces administrateur requis." }, { status: 403 });
  }

  return NextResponse.json({ parametres: await getGeminiAdminStatus() });
}

export async function POST(request: Request) {
  if (!(await isCantineAdmin())) {
    return NextResponse.json({ message: "Acces administrateur requis." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as AiSettingsBody;
  const model = typeof body.gemini_model === "string" ? body.gemini_model.trim() : "";
  const apiKey = typeof body.gemini_api_key === "string" ? body.gemini_api_key.trim() : undefined;

  if (!model) {
    return NextResponse.json({ message: "Le modele IA est requis." }, { status: 400 });
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
      (body.effacer_cle === true ? "Cle API retiree." : "Cle API enregistree.")
  });
}
