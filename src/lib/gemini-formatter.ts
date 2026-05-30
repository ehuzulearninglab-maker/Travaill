import { normalizeImportedFiche } from "@/lib/import-normalizer";
import { DEFAULT_GEMINI_MODEL, getGeminiRuntimeConfig } from "@/lib/storage";
import type { FicheContenu, JsonValue } from "@/lib/types";

type GeminiPart = {
  text?: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  error?: {
    message?: string;
  };
};

type FormattedImport = {
  contenu: FicheContenu;
  source: "gemini" | "local";
  modele: string;
  tokens_entree: number;
  tokens_sortie: number;
  tokens_total: number;
  avertissement?: string;
};

const ficheSchema = {
  type: "object",
  properties: {
    fiche_de: {
      type: "string",
      description: "Matiere ou discipline de la fiche, par exemple EDUCATION SOCIALE : MORALE."
    },
    dossier_ou_unite: { type: "string" },
    san: { type: "string", description: "Situation d'apprentissage, SA ou S.A.N." },
    sequence: { type: "string", description: "Titre, sequence ou seance de la fiche." },
    date: { type: "string" },
    cours: { type: "string", description: "Classe ou cours, par exemple CM2." },
    fiche_no: { type: "string", description: "Numero de fiche ou numero de seance." },
    duree: { type: "string" },
    contenu_de_formation: { type: "string" },
    competences_disciplinaires: { type: "string" },
    competences_transversales: { type: "string" },
    competences_transdisciplinaires: { type: "string" },
    connaissances_et_techniques: { type: "string" },
    strategie_objet_apprentissage: { type: "string" },
    strategies_enseignement_apprentissage_evaluation: { type: "string" },
    materiel: { type: "string" },
    deroulement: {
      type: "array",
      description:
        "Toutes les lignes de la partie DEROULEMENT dans l'ordre exact, avec seulement deux colonnes.",
      items: {
        type: "object",
        properties: {
          consignes: {
            type: "string",
            description:
              "Texte de la colonne Consignes. Conserver les titres, sous-titres et puces dans cette colonne."
          },
          resultats_attendus: {
            type: "string",
            description: "Texte de la colonne Resultats attendus pour la meme ligne."
          }
        },
        required: ["consignes", "resultats_attendus"]
      }
    },
    je_retiens: { type: "string" },
    variante_pedagogique_possible: { type: "string" },
    sections_supplementaires: {
      type: "array",
      description: "Sections utiles qui ne rentrent pas dans les champs precedents.",
      items: {
        type: "object",
        properties: {
          titre: { type: "string" },
          contenu: { type: "string" }
        },
        required: ["titre", "contenu"]
      }
    }
  },
  required: [
    "fiche_de",
    "cours",
    "duree",
    "contenu_de_formation",
    "competences_disciplinaires",
    "connaissances_et_techniques",
    "materiel",
    "deroulement"
  ]
};

function cleanJsonText(value: string): string {
  return value
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
}

function isRecord(value: unknown): value is Record<string, JsonValue> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function pruneEmptyValues(value: JsonValue): JsonValue | undefined {
  if (typeof value === "string") {
    const text = value.trim();
    return text ? text : undefined;
  }

  if (Array.isArray(value)) {
    const items = value
      .map((item) => pruneEmptyValues(item))
      .filter((item): item is JsonValue => item !== undefined);
    return items.length ? items : undefined;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value)
      .map(([key, entryValue]) => [key, pruneEmptyValues(entryValue)] as const)
      .filter((entry): entry is readonly [string, JsonValue] => entry[1] !== undefined);
    return entries.length ? Object.fromEntries(entries) : undefined;
  }

  if (value === null) {
    return undefined;
  }

  return value;
}

function mergeContent(base: FicheContenu, formatted: FicheContenu): FicheContenu {
  const pruned = pruneEmptyValues(formatted);
  if (!isRecord(pruned)) {
    return base;
  }

  return {
    ...base,
    ...pruned,
    texte_integral: base.texte_integral ?? formatted.texte_integral ?? ""
  };
}

function buildPrompt(content: FicheContenu): string {
  return `Tu es un assistant de mise en forme de fiches pedagogiques beninoises.

Objectif : transformer la fiche recue en JSON strictement compatible avec le canevas de l'application.

Regles obligatoires :
- Ne cree pas de nouvelle lecon.
- Ne resume pas le contenu.
- Ne supprime aucune ligne utile.
- Conserve l'ordre exact du DEROULEMENT.
- Le DEROULEMENT doit avoir uniquement deux colonnes : consignes et resultats_attendus.
- Les titres comme "Activites preliminaires", "INTRODUCTION", "REALISATION", "Je retiens" doivent etre conserves.
- Si une ligne n'a pas de resultat attendu, mets une chaine vide dans resultats_attendus.
- Les champs inconnus mais utiles doivent aller dans sections_supplementaires.
- Reponds uniquement avec le JSON demande par le schema.

Fiche recue :
${JSON.stringify(content, null, 2)}`;
}

function geminiEndpoint(model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

async function callGemini(content: FicheContenu, apiKey: string, model: string): Promise<{
  contenu: FicheContenu;
  tokens_entree: number;
  tokens_sortie: number;
  tokens_total: number;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  const response = await fetch(geminiEndpoint(model), {
    method: "POST",
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: buildPrompt(content) }]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        responseFormat: {
          text: {
            mimeType: "application/json",
            schema: ficheSchema
          }
        }
      }
    })
  }).finally(() => clearTimeout(timeout));

  const data = (await response.json()) as GeminiResponse;
  if (!response.ok) {
    throw new Error(data.error?.message || `Gemini a renvoye le statut ${response.status}.`);
  }

  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
  if (!text) {
    throw new Error("Gemini n'a pas renvoye de contenu.");
  }

  const parsed = JSON.parse(cleanJsonText(text)) as unknown;
  if (!isRecord(parsed)) {
    throw new Error("La reponse Gemini n'est pas un objet JSON.");
  }

  return {
    contenu: parsed as FicheContenu,
    tokens_entree: data.usageMetadata?.promptTokenCount ?? 0,
    tokens_sortie: data.usageMetadata?.candidatesTokenCount ?? 0,
    tokens_total: data.usageMetadata?.totalTokenCount ?? 0
  };
}

export async function formatImportedFiche(content: FicheContenu): Promise<FormattedImport> {
  const local = normalizeImportedFiche(content);
  const config = await getGeminiRuntimeConfig();
  const model = config.model || DEFAULT_GEMINI_MODEL;
  const apiKey = config.apiKey;

  if (!apiKey) {
    return {
      contenu: local,
      source: "local",
      modele: model,
      tokens_entree: 0,
      tokens_sortie: 0,
      tokens_total: 0,
      avertissement: "GEMINI_API_KEY absente : mise en forme locale utilisee."
    };
  }

  try {
    const gemini = await callGemini(local, apiKey, model);
    return {
      contenu: normalizeImportedFiche(mergeContent(local, gemini.contenu)),
      source: "gemini",
      modele: model,
      tokens_entree: gemini.tokens_entree,
      tokens_sortie: gemini.tokens_sortie,
      tokens_total: gemini.tokens_total
    };
  } catch (error) {
    return {
      contenu: local,
      source: "local",
      modele: model,
      tokens_entree: 0,
      tokens_sortie: 0,
      tokens_total: 0,
      avertissement: error instanceof Error ? error.message : "Mise en forme Gemini indisponible."
    };
  }
}
