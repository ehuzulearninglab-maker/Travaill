import { NextResponse } from "next/server";
import { isCantineAdmin } from "@/lib/cantine-admin-auth";
import { getActiveCantineSourceFile } from "@/lib/cantine-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeFileName(value: string): string {
  const cleaned = value
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || "reference-cantine.xlsx";
}

export async function GET() {
  if (!(await isCantineAdmin())) {
    return NextResponse.json({ message: "Acces administrateur requis." }, { status: 403 });
  }

  const sourceFile = await getActiveCantineSourceFile();

  if (!sourceFile) {
    return NextResponse.json(
      { message: "Aucun fichier Excel original n'est encore enregistre en base." },
      { status: 404 }
    );
  }

  const fileName = safeFileName(sourceFile.fileName);

  return new NextResponse(new Uint8Array(sourceFile.data), {
    headers: {
      "Content-Type": sourceFile.mimeType,
      "Content-Disposition": `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": "no-store"
    }
  });
}
