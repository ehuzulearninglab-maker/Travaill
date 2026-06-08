import type { DeroulementRow, FicheContenu, JsonValue } from "@/lib/types";

type FieldDefinition = {
  key: string;
  label: string;
};

const FIELD_ALIASES: Record<string, string[]> = {
  fiche_de: ["fiche_de", "fiche de", "fichede", "matiere", "matière", "discipline", "domaine"],
  dossier_ou_unite: [
    "dossier_ou_unite",
    "dossier_unite",
    "dossier ou unité",
    "dossier ou unite",
    "dossier",
    "unite",
    "unité",
    "theme",
    "thème"
  ],
  san: ["san", "s_a_n", "s.a.n", "s a n", "situation d'apprentissage", "situation apprentissage"],
  sequence: ["sequence", "séquence", "seance", "séance", "numero sequence"],
  date: ["date", "jour"],
  cours: ["cours", "classe", "niveau"],
  fiche_no: ["fiche_no", "fiche_n", "fiche n°", "fiche no", "fiche numero", "fiche_numero", "numero"],
  duree: ["duree", "durée", "temps", "temps prévu", "temps prevu"],
  contenu_de_formation: [
    "contenu_de_formation",
    "contenu de formation",
    "contenu",
    "contenus",
    "objet d'étude",
    "objet d'etude"
  ],
  competences_disciplinaires: [
    "competences_disciplinaires",
    "compétences disciplinaires",
    "competences disciplinaires",
    "competence disciplinaire",
    "compétence disciplinaire",
    "competences",
    "compétences"
  ],
  competences_transversales: [
    "competences_transversales",
    "compétences transversales",
    "competences transversales",
    "competence transversale",
    "compétence transversale"
  ],
  connaissances_et_techniques: [
    "connaissances_et_techniques",
    "connaissances et techniques",
    "connaissances techniques",
    "connaissances",
    "techniques",
    "savoirs"
  ],
  strategie_objet_apprentissage: [
    "strategie_objet_apprentissage",
    "stratégie objet d'apprentissage",
    "strategie objet d'apprentissage",
    "strategie objet apprentissage",
    "stratégie objet apprentissage",
    "objet_apprentissage",
    "objet d'apprentissage"
  ],
  strategies_enseignement_apprentissage_evaluation: [
    "strategies_enseignement_apprentissage_evaluation",
    "stratégies d'enseignement / apprentissage / évaluation",
    "strategies d'enseignement / apprentissage / evaluation",
    "stratégies d'enseignement apprentissage évaluation",
    "strategies d'enseignement apprentissage evaluation",
    "strategie enseignement apprentissage evaluation",
    "stratégie enseignement apprentissage évaluation",
    "strategies",
    "stratégies",
    "demarche",
    "démarche"
  ],
  materiel: ["materiel", "matériel", "ressources", "supports", "outils"],
  deroulement: [
    "deroulement",
    "déroulement",
    "grand_tableau_pedagogique",
    "grand tableau pédagogique",
    "grand tableau pedagogique",
    "tableau_pedagogique",
    "tableau pédagogique",
    "tableau pedagogique",
    "phases",
    "etapes",
    "étapes",
    "situations"
  ],
  consignes: ["consignes", "consigne", "instructions"],
  resultats_attendus: [
    "resultats_attendus",
    "résultats attendus",
    "resultats attendus",
    "resultats",
    "résultats",
    "attendus",
    "productions attendues"
  ],
  evaluation: ["evaluation", "évaluation", "critères d'évaluation", "criteres evaluation"]
};

const ROW_ALIASES: Record<keyof DeroulementRow, string[]> = {
  etape: ["etape", "étape", "phase", "moment", "deroulement", "déroulement", "situation", "activite"],
  duree: ["duree", "durée", "temps", "temps prévu", "temps prevu"],
  activites_enseignant: [
    "activites_enseignant",
    "activités de l'enseignant",
    "activites de l'enseignant",
    "activités enseignant",
    "activites enseignant",
    "enseignant",
    "maitre",
    "maître",
    "maitresse",
    "maîtresse",
    "actions enseignant",
    "rôle enseignant",
    "role enseignant"
  ],
  activites_apprenants: [
    "activites_apprenants",
    "activités des apprenants",
    "activites des apprenants",
    "activités apprenants",
    "activites apprenants",
    "apprenants",
    "élèves",
    "eleves",
    "enfants",
    "actions apprenants",
    "rôle apprenants",
    "role apprenants"
  ],
  consignes: ["consignes", "consigne", "instructions", "taches", "tâches"],
  resultats_attendus: [
    "resultats_attendus",
    "résultats attendus",
    "resultats attendus",
    "resultats",
    "résultats",
    "productions attendues",
    "reponses attendues",
    "réponses attendues"
  ],
  evaluation: ["evaluation", "évaluation", "critères", "criteres", "controle", "contrôle"]
};

const EXTRA_FIELD_LABELS: Record<string, string> = {
  competences_transdisciplinaires: "Compétences transdisciplinaires",
  je_retiens: "Je retiens",
  variante_pedagogique_possible: "Variante pédagogique possible",
  sections_supplementaires: "Sections supplémentaires"
};

export const HEADER_FIELDS: FieldDefinition[] = [
  { key: "fiche_de", label: "Fiche de" },
  { key: "dossier_ou_unite", label: "Dossier ou unité" },
  { key: "san", label: "S.A.N" },
  { key: "sequence", label: "Séquence" },
  { key: "date", label: "Date" },
  { key: "cours", label: "Cours" },
  { key: "fiche_no", label: "Fiche N°" },
  { key: "duree", label: "Durée" }
];

export const PLANNING_FIELDS: FieldDefinition[] = [
  { key: "contenu_de_formation", label: "Contenu de formation" },
  { key: "competences_disciplinaires", label: "Compétences disciplinaires" },
  { key: "competences_transversales", label: "Compétences transversales" },
  { key: "connaissances_et_techniques", label: "Connaissances et techniques" },
  { key: "strategie_objet_apprentissage", label: "Stratégie objet d'apprentissage" },
  {
    key: "strategies_enseignement_apprentissage_evaluation",
    label: "Stratégies d'enseignement / apprentissage / évaluation"
  },
  { key: "materiel", label: "Matériel" }
];

export const FINAL_FIELDS: FieldDefinition[] = [
  { key: "consignes", label: "Consignes" },
  { key: "resultats_attendus", label: "Résultats attendus" }
];

export const OFFICIAL_DEROULEMENT_COLUMNS = [
  { key: "consignes", label: "Consignes" },
  { key: "resultats_attendus", label: "Résultats attendus" }
] as const;

export type OfficialDeroulementRow = Record<(typeof OFFICIAL_DEROULEMENT_COLUMNS)[number]["key"], string>;

export const DEROULEMENT_COLUMNS = [
  { key: "etape", label: "Déroulement" },
  { key: "duree", label: "Durée" },
  { key: "activites_enseignant", label: "Activités de l'enseignant" },
  { key: "activites_apprenants", label: "Activités des apprenants" },
  { key: "consignes", label: "Consignes" },
  { key: "resultats_attendus", label: "Résultats attendus" },
  { key: "evaluation", label: "Évaluation" }
] as const;

const NESTED_SECTION_ALIASES = [
  "elements_de_planification",
  "éléments de planification",
  "elements de planification",
  "planification",
  "identification",
  "informations_generales",
  "informations générales",
  "informations generales"
];

export function slugKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function aliasesFor(key: string): string[] {
  const aliases = FIELD_ALIASES[key] ?? [key];
  return [...new Set([key, ...aliases, ...aliases.map(slugKey)])];
}

function lookupInObject(source: Record<string, JsonValue>, key: string): JsonValue | undefined {
  const candidates = aliasesFor(key);
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

function asRecord(value: JsonValue | undefined): Record<string, JsonValue> | undefined {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, JsonValue>;
  }
  return undefined;
}

export function readField(content: FicheContenu, key: string): JsonValue | undefined {
  const direct = lookupInObject(content, key);
  if (direct !== undefined) {
    return direct;
  }

  for (const sectionAlias of NESTED_SECTION_ALIASES) {
    const section = asRecord(lookupInObject(content, sectionAlias));
    if (!section) {
      continue;
    }
    const nested = lookupInObject(section, key);
    if (nested !== undefined) {
      return nested;
    }
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
    .filter(Boolean)
    .join("\n");
}

export function formatLabel(key: string): string {
  if (EXTRA_FIELD_LABELS[key]) {
    return EXTRA_FIELD_LABELS[key];
  }

  const known = [...HEADER_FIELDS, ...PLANNING_FIELDS, ...DEROULEMENT_COLUMNS].find(
    (field) => field.key === key
  );
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

function rowFromRecord(row: Record<string, JsonValue>): DeroulementRow {
  const used = new Set(Object.values(ROW_ALIASES).flat().map(slugKey));
  const extras = Object.entries(row)
    .filter(([key, value]) => !used.has(slugKey(key)) && valueToText(value).trim().length > 0)
    .map(([key, value]) => `${formatLabel(key)} : ${valueToText(value)}`)
    .join("\n");

  const resultats = readRowValue(row, ROW_ALIASES.resultats_attendus);

  return {
    etape: readRowValue(row, ROW_ALIASES.etape),
    duree: readRowValue(row, ROW_ALIASES.duree),
    activites_enseignant: readRowValue(row, ROW_ALIASES.activites_enseignant),
    activites_apprenants: readRowValue(row, ROW_ALIASES.activites_apprenants),
    consignes: readRowValue(row, ROW_ALIASES.consignes),
    resultats_attendus: [resultats, extras].filter(Boolean).join("\n"),
    evaluation: readRowValue(row, ROW_ALIASES.evaluation)
  };
}

function rawDeroulementItems(raw: JsonValue | undefined): JsonValue[] {
  if (Array.isArray(raw)) {
    return raw;
  }

  if (raw && typeof raw === "object") {
    const record = raw as Record<string, JsonValue>;
    const nested =
      lookupInObject(record, "deroulement") ||
      lookupInObject(record, "etapes") ||
      lookupInObject(record, "phases") ||
      lookupInObject(record, "lignes") ||
      lookupInObject(record, "tableau");
    if (Array.isArray(nested)) {
      return nested;
    }

    const hasRowField = Object.values(ROW_ALIASES).some((aliases) =>
      Object.keys(record).some((key) => aliases.map(slugKey).includes(slugKey(key)))
    );
    if (hasRowField) {
      return [record as JsonValue];
    }

    const values = Object.values(record);
    if (values.every((value) => value && typeof value === "object" && !Array.isArray(value))) {
      return values;
    }
    return values;
  }

  return [];
}

function hasRowContent(row: DeroulementRow): boolean {
  return Object.values(row).some((value) => value.trim().length > 0);
}

export function normaliseDeroulement(content: FicheContenu): DeroulementRow[] {
  const rows = rawDeroulementItems(readField(content, "deroulement"))
    .map((item) => {
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

      return rowFromRecord(item as Record<string, JsonValue>);
    })
    .filter(hasRowContent);

  if (rows.length > 0) {
    return rows;
  }

  const fallbackRow: DeroulementRow = {
    etape: valueToText(readField(content, "deroulement")),
    duree: valueToText(readField(content, "duree")),
    activites_enseignant: valueToText(readField(content, "activites_enseignant")),
    activites_apprenants: valueToText(readField(content, "activites_apprenants")),
    consignes: valueToText(readField(content, "consignes")),
    resultats_attendus: valueToText(readField(content, "resultats_attendus")),
    evaluation: valueToText(readField(content, "evaluation"))
  };

  return hasRowContent(fallbackRow) ? [fallbackRow] : [];
}

function joinOfficialParts(parts: string[]): string {
  return parts.map((part) => part.trim()).filter(Boolean).join("\n");
}

function labelledOfficialPart(label: string, value: string): string {
  return value.trim() ? `${label} : ${value.trim()}` : "";
}

function comparableText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function officialRowContains(rows: OfficialDeroulementRow[], key: keyof OfficialDeroulementRow, value: string): boolean {
  const wanted = comparableText(value);
  if (!wanted) {
    return true;
  }

  return rows.some((row) => {
    const existing = comparableText(row[key]);
    return existing.length > 0 && (existing.includes(wanted) || wanted.includes(existing));
  });
}

function toOfficialDeroulementRow(row: DeroulementRow): OfficialDeroulementRow {
  return {
    consignes: joinOfficialParts([
      labelledOfficialPart("Déroulement", row.etape),
      labelledOfficialPart("Durée", row.duree),
      labelledOfficialPart("Activités de l'enseignant", row.activites_enseignant),
      row.consignes
    ]),
    resultats_attendus: joinOfficialParts([
      labelledOfficialPart("Activités des apprenants", row.activites_apprenants),
      row.resultats_attendus,
      labelledOfficialPart("Évaluation", row.evaluation)
    ])
  };
}

export function normaliseOfficialDeroulement(content: FicheContenu): OfficialDeroulementRow[] {
  const rows = normaliseDeroulement(content)
    .map(toOfficialDeroulementRow)
    .filter((row) => row.consignes.trim().length > 0 || row.resultats_attendus.trim().length > 0);

  const consignes = valueToText(readField(content, "consignes"));
  const resultats = valueToText(readField(content, "resultats_attendus"));
  const alreadyShown =
    officialRowContains(rows, "consignes", consignes) && officialRowContains(rows, "resultats_attendus", resultats);

  if (!alreadyShown && (consignes.trim().length > 0 || resultats.trim().length > 0)) {
    rows.push({
      consignes,
      resultats_attendus: resultats
    });
  }

  return rows;
}

export function getFinalSections(content: FicheContenu): Array<{ key: string; label: string; value: string }> {
  return FINAL_FIELDS.map((field) => ({
    key: field.key,
    label: field.label,
    value: valueToText(readField(content, field.key))
  })).filter((section) => section.value.trim().length > 0);
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

function consumedSlugs(): Set<string> {
  const consumed = new Set<string>();
  [...HEADER_FIELDS, ...PLANNING_FIELDS].forEach((field) => {
    aliasesFor(field.key).forEach((key) => consumed.add(slugKey(key)));
  });
  FINAL_FIELDS.forEach((field) => {
    aliasesFor(field.key).forEach((key) => consumed.add(slugKey(key)));
  });
  aliasesFor("deroulement").forEach((key) => consumed.add(slugKey(key)));
  [
    "titre",
    "matiere",
    "classe",
    "utilisateur_email",
    "enseignant_email",
    "compte_email",
    "courriel",
    "email",
    "secret_key",
    "texte_integral",
    "texte_original",
    "texte_de_la_fiche",
    "fiche_texte",
    "fiche_complete",
    "contenu_texte"
  ].forEach((key) => consumed.add(slugKey(key)));
  NESTED_SECTION_ALIASES.forEach((key) => consumed.add(slugKey(key)));
  return consumed;
}

export function getExtraSections(content: FicheContenu): Array<{ key: string; label: string; value: JsonValue }> {
  const consumed = consumedSlugs();

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
