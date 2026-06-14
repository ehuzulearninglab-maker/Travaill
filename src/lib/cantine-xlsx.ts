import type { RawCantineReference, RawRow } from "@/lib/cantine-engine";
import type { WorkBook } from "xlsx";

const sheetAliases = {
  foods: ["base aliments", "base alimentaire", "aliments"],
  dishes: ["plats valides", "plats valide", "menus valides"],
  snacks: ["gouters", "gouter", "goûters", "goûter", "collations", "collation", "snacks", "snack"],
  avoid: ["associations a eviter", "associations eviter"],
  rules: ["regles de gestion", "regles"],
  sources: ["sources recherche", "sources"]
};

export async function parseCantineWorkbook(buffer: ArrayBuffer, fileName: string): Promise<RawCantineReference> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(buffer, { type: "array" });

  const foods = rowsFromSheet(XLSX, workbook, sheetAliases.foods);
  const dishes = rowsFromSheet(XLSX, workbook, sheetAliases.dishes);

  if (foods.length === 0) {
    throw new Error("La feuille Base_Aliments est absente ou vide.");
  }
  if (dishes.length === 0) {
    throw new Error("La feuille Plats_Validés est absente ou vide.");
  }

  return {
    sourceName: fileName,
    importedAt: new Date().toISOString(),
    foods,
    dishes,
    snacks: rowsFromSheet(XLSX, workbook, sheetAliases.snacks),
    avoid: rowsFromSheet(XLSX, workbook, sheetAliases.avoid),
    rules: rowsFromSheet(XLSX, workbook, sheetAliases.rules),
    sources: rowsFromSheet(XLSX, workbook, sheetAliases.sources)
  };
}

function rowsFromSheet(
  XLSX: typeof import("xlsx"),
  workbook: WorkBook,
  aliases: string[]
): RawRow[] {
  const sheetName = findSheetName(workbook.SheetNames, aliases);
  if (!sheetName) {
    return [];
  }

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return [];
  }

  return XLSX.utils.sheet_to_json<Record<string, string | number | null | undefined>>(sheet, {
    defval: "",
    raw: false
  });
}

function findSheetName(names: string[], aliases: string[]): string | undefined {
  return names.find((name) => {
    const normalized = normalizeName(name);
    return aliases.some((alias) => normalized === normalizeName(alias) || normalized.includes(normalizeName(alias)));
  });
}

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_()]/g, " ")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}
