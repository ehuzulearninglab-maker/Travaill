import type { FicheContenu, JsonValue } from "@/lib/types";

const RAW_TEXT_KEYS = [
  "texte_integral",
  "texte_original",
  "texte_de_la_fiche",
  "fiche_texte",
  "fiche_complete",
  "contenu_texte"
];

const SECTION_STARTS = [
  "competences",
  "connaissances",
  "strategies",
  "strategie",
  "materiel",
  "b -",
  "b-",
  "c -",
  "c-",
  "ii -",
  "ii-",
  "je retiens",
  "variante",
  "pre requis",
  "prerequis",
  "realisation",
  "retour",
  "projection",
  "objectivation",
  "evaluation"
];

function canonical(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/°/g, "o")
    .replace(/[’']/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function textValue(value: JsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function hasText(value: JsonValue | undefined): boolean {
  return textValue(value).length > 0;
}

function rawTextFrom(content: FicheContenu): string {
  for (const key of RAW_TEXT_KEYS) {
    const value = textValue(content[key]);
    if (value) {
      return value;
    }
  }
  return "";
}

function linesOf(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function setIfMissing(target: FicheContenu, key: string, value: string) {
  const cleaned = value.trim();
  if (cleaned && !hasText(target[key])) {
    target[key] = cleaned;
  }
}

function valueAfterColon(line: string): string {
  const colonIndex = line.indexOf(":");
  return colonIndex >= 0 ? line.slice(colonIndex + 1).trim() : "";
}

function findLineValue(lines: string[], pattern: RegExp, useWholeLine = false): string {
  for (const line of lines) {
    const match = canonical(line).match(pattern);
    if (!match) {
      continue;
    }

    if (useWholeLine) {
      return line;
    }

    return valueAfterColon(line) || match[1]?.trim() || "";
  }
  return "";
}

function firstLine(lines: string[]): string {
  return lines.find((line) => !/^(cours|duree|seance|date|sa\s*no?)/i.test(canonical(line))) ?? "";
}

function startsNewSection(line: string): boolean {
  const value = canonical(line);
  return SECTION_STARTS.some((start) => value.startsWith(start)) || /^[a-z]\s*-/.test(value);
}

function extractBlock(lines: string[], label: string): string {
  const start = lines.findIndex((line) => canonical(line).startsWith(label));
  if (start === -1) {
    return "";
  }

  const first = valueAfterColon(lines[start]);
  const values: string[] = first ? [first] : [];

  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (startsNewSection(line)) {
      break;
    }
    values.push(line);
  }

  return values.join("\n").trim();
}

function extractBetween(lines: string[], startLabel: string, endLabel?: string): string {
  const start = lines.findIndex((line) => canonical(line).startsWith(startLabel));
  if (start === -1) {
    return "";
  }

  const values: string[] = [];
  const first = valueAfterColon(lines[start]);
  if (first) {
    values.push(first);
  }

  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (endLabel && canonical(line).startsWith(endLabel)) {
      break;
    }
    values.push(line);
  }

  return values.join("\n").trim();
}

function parseDeroulement(lines: string[]): Array<{ consignes: string; resultats_attendus: string }> {
  const start = lines.findIndex((line) => {
    const value = canonical(line);
    return value === "deroulement" || /^ii\s*-?\s*deroulement/.test(value);
  });
  if (start === -1) {
    return [];
  }

  const rows: Array<{ consignes: string; resultats_attendus: string }> = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    const plain = canonical(line);
    if (plain.startsWith("je retiens") || plain.startsWith("variante")) {
      break;
    }
    if (/^consignes?\s+resultats?/.test(plain)) {
      continue;
    }

    const tabParts = line.split(/\t+/).map((part) => part.trim()).filter(Boolean);
    const spacedParts = tabParts.length > 1 ? tabParts : line.split(/\s{3,}/).map((part) => part.trim()).filter(Boolean);

    if (spacedParts.length > 1) {
      rows.push({
        consignes: spacedParts[0],
        resultats_attendus: spacedParts.slice(1).join(" ")
      });
    } else {
      rows.push({
        consignes: line,
        resultats_attendus: ""
      });
    }
  }

  return rows.filter((row) => row.consignes || row.resultats_attendus);
}

export function normalizeImportedFiche(content: FicheContenu): FicheContenu {
  const rawText = rawTextFrom(content);
  if (!rawText) {
    return content;
  }

  const lines = linesOf(rawText);
  const next: FicheContenu = { ...content };

  setIfMissing(next, "fiche_de", firstLine(lines));
  setIfMissing(next, "cours", findLineValue(lines, /^cours\s*:\s*(.+)$/));
  setIfMissing(next, "duree", findLineValue(lines, /^duree\s*:\s*(.+)$/));
  setIfMissing(next, "fiche_no", findLineValue(lines, /^seance\s*no?\s*(.+)$/));
  setIfMissing(next, "date", findLineValue(lines, /^date\s*:\s*(.+)$/));
  setIfMissing(next, "san", findLineValue(lines, /^sa\s*no?\s*.+$/, true));
  setIfMissing(next, "sequence", findLineValue(lines, /^titre\s*:\s*(.+)$/));

  setIfMissing(next, "competences_disciplinaires", extractBlock(lines, "competences disciplinaires"));
  setIfMissing(next, "competences_transversales", extractBlock(lines, "competences transversales"));
  setIfMissing(next, "competences_transdisciplinaires", extractBlock(lines, "competences transdisciplinaires"));
  setIfMissing(next, "connaissances_et_techniques", extractBlock(lines, "connaissances et techniques"));
  setIfMissing(next, "contenu_de_formation", textValue(next.connaissances_et_techniques));

  const strategies = extractBlock(lines, "b- strategies") || extractBlock(lines, "b - strategies");
  setIfMissing(next, "strategie_objet_apprentissage", strategies);
  setIfMissing(next, "strategies_enseignement_apprentissage_evaluation", strategies);
  setIfMissing(next, "materiel", extractBlock(lines, "c- materiel") || extractBlock(lines, "c - materiel"));

  const deroulement = parseDeroulement(lines);
  const existingRows = Array.isArray(next.deroulement) ? next.deroulement.length : 0;
  if (deroulement.length > existingRows) {
    next.deroulement = deroulement as unknown as JsonValue;
  }

  setIfMissing(next, "je_retiens", extractBetween(lines, "je retiens", "variante"));
  setIfMissing(next, "variante_pedagogique_possible", extractBetween(lines, "variante pedagogique possible"));

  return next;
}

export const RAW_TEXT_FIELD_KEYS = RAW_TEXT_KEYS;
