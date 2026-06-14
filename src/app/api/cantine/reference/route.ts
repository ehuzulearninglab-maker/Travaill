import { NextResponse } from "next/server";
import { isCantineAdmin } from "@/lib/cantine-admin-auth";
import { normalizeCantineReference } from "@/lib/cantine-engine";
import {
  getCantineReferenceBundle,
  getCantineReferenceWriteBlocker,
  saveActiveCantineReference
} from "@/lib/cantine-storage";
import { parseCantineWorkbook } from "@/lib/cantine-xlsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const bundle = await getCantineReferenceBundle();
  return NextResponse.json(bundle);
}

export async function POST(request: Request) {
  if (!(await isCantineAdmin())) {
    return NextResponse.json({ message: "Acces administrateur requis." }, { status: 403 });
  }

  const writeBlocker = getCantineReferenceWriteBlocker();
  if (writeBlocker) {
    return NextResponse.json({ message: writeBlocker }, { status: 503 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
    return NextResponse.json({ message: "Fichier Excel requis." }, { status: 400 });
  }

  const fileName = "name" in file && typeof file.name === "string" ? file.name : "reference-cantine.xlsx";
  if (!/\.(xlsx|xls)$/i.test(fileName)) {
    return NextResponse.json({ message: "Format attendu: .xlsx ou .xls." }, { status: 400 });
  }

  try {
    const raw = await parseCantineWorkbook(await file.arrayBuffer(), fileName);
    const normalized = normalizeCantineReference(raw);
    const alimentsActifs = normalized.foods.filter((food) => food.actif).length;
    const platsValides = normalized.dishes.filter((dish) => {
      const status = dish.statut
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      return !status || (status.includes("valide") && !status.includes("a valider"));
    }).length;

    if (alimentsActifs === 0) {
      return NextResponse.json({ message: "Aucun aliment actif trouve dans Base_Aliments." }, { status: 400 });
    }
    if (platsValides === 0) {
      return NextResponse.json({ message: "Aucun plat valide trouve dans Plats_Validés." }, { status: 400 });
    }

    const bundle = await saveActiveCantineReference(raw, fileName);
    return NextResponse.json({
      succes: true,
      ...bundle,
      message: bundle.status.warning || `${fileName} enregistre comme base de reference.`
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Import impossible." },
      { status: 400 }
    );
  }
}
