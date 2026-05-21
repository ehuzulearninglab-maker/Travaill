import { inferFicheMeta } from "@/lib/fiche-utils";
import type { FicheContenu, FicheRecord } from "@/lib/types";

type ExportBody = {
  fiche?: Partial<FicheRecord>;
  contenu_json?: FicheContenu;
};

function isFicheContent(value: unknown): value is FicheContenu {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function ficheFromExportBody(body: ExportBody, userId: string): FicheRecord | undefined {
  const contenu = isFicheContent(body.fiche?.contenu_json)
    ? body.fiche.contenu_json
    : isFicheContent(body.contenu_json)
      ? body.contenu_json
      : undefined;

  if (!contenu) {
    return undefined;
  }

  const meta = inferFicheMeta(contenu);
  const date = new Date().toISOString();

  return {
    id: String(body.fiche?.id || "export"),
    utilisateur_id: String(body.fiche?.utilisateur_id || userId),
    titre: String(body.fiche?.titre || meta.titre),
    matiere: String(body.fiche?.matiere || meta.matiere),
    classe: String(body.fiche?.classe || meta.classe),
    contenu_json: contenu,
    date_creation: String(body.fiche?.date_creation || date),
    date_modification: String(body.fiche?.date_modification || date)
  };
}

