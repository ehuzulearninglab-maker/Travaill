import type { DeroulementRow, FicheContenu, JsonValue } from "@/lib/types";

const FIELD_ALIASES: Record<string, string[]> = {
  fiche_de: ["fiche_de", "fiche de", "fichede", "matiere", "matière", "discipline"],
  dossier_ou_unite: [
    "dossier_ou_unite",
    "dossier_unite",
    "dossier ou unité",
    "dossier",
    "unite",
    "unité"
  ],
  san: ["san", "s_a_n", "s.a.n", "s a n"],
  sequence: ["sequence", "séquence"],
  date: ["date"],
  cours: ["cours", "classe", "niveau"],
  fiche_no: ["fiche_no", "fiche_n", "fiche n°", "fiche numero", "fiche_numero", "numero"],
  duree: ["duree", "durée", "temps"],
  contenu_de_formation: ["contenu_de_formation", "contenu de formation", "contenu"],
  competences_disciplinaires: [
    "competences_disciplinaires",
    "compétences disciplinaires",
    "competences",
    "compétences"
  ],
  competences_transversales: [
    "competences_transversales",
    "compétences transversales"
  ],
  connaissances_et_techniques: [
    "connaissances_et_techniques",
    "connaissances et techniques",
    "connaissances"
  ],
  strategie_objet_apprentissage: [
    "strategie_objet_apprentissage",
    "stratégie objet d’apprentissage",
    "strategie objet apprentissage",
    "objet_apprentissage"
  ],
  strategies_enseignement_apprentissage_evaluation: [
    "strategies_enseignement_apprentissage_evaluation",
    "stratégies d’enseignement / apprentissage / évaluation",
    "strategies",
    "stratégies"
  ],
  materiel: ["materiel", "matériel", "ressources"],
  deroulement: ["deroulement", "déroulement"],
  consignes: ["consignes"],
  resultats_attendus: ["resultats_attendus", "résultats attendus", "resultats", "résultats"]
};

export const HEADER_FIELDS = [
  { key: "fiche_de", label: "Fiche de" },
  { key: "dossier_ou_unite", label: "Dossier ou unité" },
  { key: "san", label: "S.A.N" },
  { key: "sequence", label: "Séquence" },
  { key: "date", label: "Date" },
  { key: "cours", label: "Cours" },
  { key: "fiche_no", label: "Fiche N°" },
  { key: "duree", label: "Durée" }
];

export const PLANNING_FIELDS = [
  { key: "contenu_de_formation", label: "Contenu de formation" },
  { key: "competences_disciplinaires", label: "Compétences disciplinaires" },
  { key: "competences_transversales", label: "Compétences transversales" },
  { key: "connaissances_et_techniques", label: "Connaissances et techniques" },
  { key: "strategie_objet_apprentissage", label: "Stratégie objet d’apprentissage" },
  {
    key: "strategies_enseignement_apprentissage_evaluation",
    label: "Stratégies d’enseignement / apprentissage / évaluation"
  },
  { key: "materiel", label: "Matériel" }
];

export const DEROULEMENT_COLUMNS = [
  { key: "etape", label: "Déroulement" },
  { key: "duree", label: "Durée" },
  { key: "activites_enseignant", label: "Activités de l’enseignant" },
  { key: "activites_apprenants", label: "Activités des apprenants" },
  { key: "consignes", label: "Consignes" },
  { key: "resultats_attendus", label: "Résultats attendus" },
  { key: "evaluation", label: "Évaluation" }
] as const;

export function slugKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function candidateKeys(key: string): string[] {
  const aliases = FIELD_ALIASES[key] ?? [key];
  return [...new Set([key, ...aliases, ...aliases.map(slugKey)])];
}

function lookupInObject(source: Record<string, JsonValue>, key: string): JsonValue | undefined {
  const candidates = candidateKeys(key);
  for (const candidate of candidates) {
    if (Object.prototype.hasOwnProperty.call(source, candidate)) {
      return source[candidate];
    }
  }

  const wanted = candidates.map(slugKey);
  for (const [sourceKey, value] of Object.entries(source)) {
    if (wanted.includes(slugKey(sourceKey))) {
      return value;
    }
  }
  return undefined;
}

export function readField(content: FicheContenu, key: string): JsonValue | undefined {
  const direct = lookupInObject(content, key);
  if (direct !== undefined) {
    return direct;
  }

  const planning = lookupInObject(content, "elements_de_planification");
  if (planning && typeof planning === "object" && !Array.isArray(planning)) {
    return lookupInObject(planning as Record<string, JsonValue>, key);
  }

  return undefined;
}

export function valueToText(value: JsonValue | undefined): string {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item && typeof item === "object" && !Array.isArray(item)) {
          return Object.entries(item)
            .map(([key, itemValue]) => `${formatLabel(key)} : ${valueToText(itemValue)}`)
            .join("\n");
        }
        return valueToText(item);
      })
      .filter(Boolean)
      .join("\n");
  }

  return Object.entries(value)
    .map(([key, itemValue]) => `${formatLabel(key)} : ${valueToText(itemValue)}`)
    .join("\n");
}

export function formatLabel(key: string): string {
  const known = [...HEADER_FIELDS, ...PLANNING_FIELDS].find((field) => field.key === key);
  if (known) {
    return known.label;
  }

  return key
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (letter) => letter.toUpperCase());
}

function readRowValue(row: Record<string, JsonValue>, aliases: string[]): string {
  const wanted = aliases.map(slugKey);
  for (const [key, value] of Object.entries(row)) {
    if (wanted.includes(slugKey(key))) {
      return valueToText(value);
    }
  }
  return "";
}

export function normaliseDeroulement(content: FicheContenu): DeroulementRow[] {
  const raw = readField(content, "deroulement");
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return {
        etape: valueToText(item),
        duree: "",
        activites_enseignant: "",
        activites_apprenants: "",
        consignes: "",
        resultats_attendus: "",
        evaluation: ""
      };
    }

    const row = item as Record<string, JsonValue>;
    const used = new Set(
      [
        "etape",
        "étape",
        "phase",
        "moment",
        "duree",
        "durée",
        "temps",
        "activites_enseignant",
        "activités enseignant",
        "enseignant",
        "maitre",
        "maître",
        "activites_apprenants",
        "activités apprenants",
        "apprenants",
        "eleves",
        "élèves",
        "consignes",
        "resultats_attendus",
        "résultats attendus",
        "evaluation",
        "évaluation"
      ].map(slugKey)
    );

    const extras = Object.entries(row)
      .filter(([key]) => !used.has(slugKey(key)))
      .map(([key, value]) => `${formatLabel(key)} : ${valueToText(value)}`)
      .join("\n");

    const resultats = readRowValue(row, ["resultats_attendus", "résultats attendus", "resultats"]);

    return {
      etape: readRowValue(row, ["etape", "étape", "phase", "moment", "deroulement"]),
      duree: readRowValue(row, ["duree", "durée", "temps"]),
      activites_enseignant: readRowValue(row, [
        "activites_enseignant",
        "activités enseignant",
        "enseignant",
        "maitre",
        "maître"
      ]),
      activites_apprenants: readRowValue(row, [
        "activites_apprenants",
        "activités apprenants",
        "apprenants",
        "eleves",
        "élèves"
      ]),
      consignes: readRowValue(row, ["consignes", "consigne"]),
      resultats_attendus: [resultats, extras].filter(Boolean).join("\n"),
      evaluation: readRowValue(row, ["evaluation", "évaluation"])
    };
  });
}

export function setContentField(content: FicheContenu, key: string, value: string): FicheContenu {
  return {
    ...content,
    [key]: value
  };
}

export function setDeroulement(content: FicheContenu, rows: DeroulementRow[]): FicheContenu {
  return {
    ...content,
    deroulement: rows as unknown as JsonValue
  };
}

export function inferFicheMeta(content: FicheContenu): {
  titre: string;
  matiere: string;
  classe: string;
} {
  const matiere =
    valueToText(readField(content, "fiche_de")) ||
    valueToText(readField(content, "matiere")) ||
    "Fiche pédagogique";
  const classe =
    valueToText(readField(content, "cours")) ||
    valueToText(readField(content, "classe")) ||
    "Classe non précisée";
  const sequence = valueToText(readField(content, "sequence"));
  const titre =
    valueToText(content.titre) ||
    [matiere, classe, sequence].filter(Boolean).join(" · ") ||
    "Fiche pédagogique";

  return { titre, matiere, classe };
}

export function getExtraSections(content: FicheContenu): Array<{ key: string; label: string; value: JsonValue }> {
  const consumed = new Set<string>();
  [...HEADER_FIELDS, ...PLANNING_FIELDS].forEach((field) => {
    candidateKeys(field.key).forEach((key) => consumed.add(slugKey(key)));
  });
  ["elements_de_planification", "deroulement", "titre", "matiere", "classe"].forEach((key) =>
    consumed.add(slugKey(key))
  );

  return Object.entries(content)
    .filter(([key, value]) => !consumed.has(slugKey(key)) && valueToText(value).trim().length > 0)
    .map(([key, value]) => ({ key, label: formatLabel(key), value }));
}

export function createEmptyFiche(): FicheContenu {
  return {
    fiche_de: "Nouvelle matière",
    dossier_ou_unite: "",
    san: "",
    sequence: "",
    date: new Date().toISOString().slice(0, 10),
    cours: "",
    fiche_no: "",
    duree: "",
    contenu_de_formation: "",
    competences_disciplinaires: "",
    competences_transversales: "",
    connaissances_et_techniques: "",
    strategie_objet_apprentissage: "",
    strategies_enseignement_apprentissage_evaluation: "",
    materiel: "",
    deroulement: [],
    resultats_attendus: ""
  };
}
