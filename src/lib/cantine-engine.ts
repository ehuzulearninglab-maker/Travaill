import rawDefaultReference from "@/data/cantine-reference.json";

export type AgeRange = "3-6 ans" | "6-10 ans" | "10-15 ans";
export type Season = "Aucune" | "Seche" | "Pluies";
export type FoodSeason = "Seche" | "Pluies" | "Toute saison";
export type Constraint = "sans porc" | "vegetarien" | "allergie arachide" | "sans poisson";
export type FoodRole = "energetique" | "proteine" | "fruit" | "vegetal" | "autre";
export type DishComponent = "base" | "sauce" | "proteine" | "vegetal" | "fruit";
export type Status = "Conforme" | "Attention" | "Non conforme";
export type PortionUnit = "g" | "piece";

export type PlanInput = {
  nombreEnfants: number;
  trancheAge: AgeRange;
  budgetTotal: number;
  dureeJours: number;
  contraintes: Constraint[];
  saison: Season;
  platsChoisis?: Record<number, string>;
};

export type RawCantineReference = {
  sourceName?: string;
  importedAt?: string;
  foods?: RawRow[];
  dishes?: RawRow[];
  avoid?: RawRow[];
  rules?: RawRow[];
  sources?: RawRow[];
};

export type RawRow = Record<string, string | number | null | undefined>;

export type Food = {
  id: string;
  nom: string;
  groupeAlimentaire: string;
  role: FoodRole;
  saison: FoodSeason;
  uniteAchat: string;
  unitePortion: PortionUnit;
  unitePortionLabel: string;
  prixEstime: number;
  portionEnfant: number;
  minimumEnfant: number;
  modeVente: string;
  quantiteParVente: number;
  quantiteParVenteLabel: string;
  prioriteCout: number;
  typeProteine: "Animale" | "Vegetale" | null;
  categorieCulinaire: string;
  conseils?: string;
  actif: boolean;
  tags: string[];
};

export type ValidatedDish = {
  id: string;
  nom: string;
  base: string;
  sauce: string;
  proteineVisible: string;
  typeProteine: "Animale" | "Vegetale" | "Mixte" | null;
  apportVegetal: string;
  fruit: string;
  budgetConseille: string;
  budgetRank: number;
  statut: string;
  remarques: string;
};

export type CantineReference = {
  sourceName: string;
  importedAt: string;
  foods: Food[];
  dishes: ValidatedDish[];
  avoid: RawRow[];
  rules: RawRow[];
  sources: RawRow[];
};

export type MenuLine = {
  id: string;
  jour: number;
  dishId: string;
  component: DishComponent;
  componentLabel: string;
  sourceText: string;
  alimentId: string;
  aliment: Food;
  role: FoodRole;
  quantiteParEnfant: number;
  quantiteTotale: number;
  quantiteAchat: number;
  surplus: number;
  coutLigne: number;
};

export type DayMenu = {
  jour: number;
  plat: ValidatedDish;
  lignes: MenuLine[];
  coutJournalier: number;
  statut: Status;
  alertes: string[];
};

export type VerificationCheck = {
  code: string;
  libelle: string;
  statut: Status;
  detail: string;
};

export type ShoppingItem = {
  aliment: Food;
  role: FoodRole;
  quantiteTotale: number;
  quantiteAchat: number;
  surplus: number;
  coutTotal: number;
};

export type MenuChoice = {
  id: string;
  nom: string;
  coutJournalier: number;
  budgetConseille: string;
};

export type MenuResult = {
  entree: PlanInput;
  jours: DayMenu[];
  lignes: MenuLine[];
  listeAchats: ShoppingItem[];
  menusDisponibles: MenuChoice[];
  verifications: VerificationCheck[];
  statut: Status;
  coutTotal: number;
  ecartBudget: number;
  coutParEnfant: number;
  utilisationBudget: number;
  genereLe: string;
  explications: string[];
  reference: {
    sourceName: string;
    importedAt: string;
    platsValides: number;
    alimentsActifs: number;
  };
};

export const roleLabels: Record<FoodRole, string> = {
  energetique: "Energie",
  proteine: "Proteine",
  fruit: "Fruit",
  vegetal: "Vegetal",
  autre: "Autre"
};

export const componentLabels: Record<DishComponent, string> = {
  base: "Base",
  sauce: "Sauce",
  proteine: "Proteine",
  vegetal: "Vegetal",
  fruit: "Fruit"
};

export const constraints: Constraint[] = ["sans porc", "vegetarien", "allergie arachide", "sans poisson"];

const ageMultipliers: Record<AgeRange, number> = {
  "3-6 ans": 0.75,
  "6-10 ans": 1,
  "10-15 ans": 1.25
};

const defaultRaw = rawDefaultReference as RawCantineReference;
export const defaultCantineReference = normalizeCantineReference(defaultRaw);

export function normalizeCantineReference(raw: RawCantineReference): CantineReference {
  const ids = new Map<string, number>();
  const foods = (raw.foods ?? [])
    .map((row) => normalizeFood(row, ids))
    .filter((food): food is Food => Boolean(food));

  const dishes = (raw.dishes ?? [])
    .map((row, index) => normalizeDish(row, index))
    .filter((dish): dish is ValidatedDish => Boolean(dish));

  return {
    sourceName: raw.sourceName || "Base Cantine Intelligente",
    importedAt: raw.importedAt || new Date().toISOString(),
    foods,
    dishes,
    avoid: raw.avoid ?? [],
    rules: raw.rules ?? [],
    sources: raw.sources ?? []
  };
}

export function generateMenu(entree: PlanInput, reference: CantineReference = defaultCantineReference): MenuResult {
  const normalized = normalizeInput(entree);
  const candidates = reference.dishes
    .filter((dish) => isValidatedDish(dish))
    .filter((dish) => dishMatchesConstraints(dish, normalized))
    .map((dish) => {
      const resolved = resolveDish(dish, normalized, reference);
      return { dish, ...resolved };
    })
    .filter((item) => hasRequiredDishLines(item.lignes))
    .sort((a, b) => a.cout - b.cout || a.dish.budgetRank - b.dish.budgetRank || a.dish.nom.localeCompare(b.dish.nom));

  const jours: DayMenu[] = [];
  for (let jour = 1; jour <= normalized.dureeJours; jour += 1) {
    const picked = pickDishForDay(candidates, jour, normalized);
    if (!picked) {
      continue;
    }

    const lignes = picked.lignes.map((line) => ({
      ...line,
      id: `${jour}-${line.component}-${line.alimentId}`,
      jour
    }));
    const coutJournalier = roundMoney(lignes.reduce((total, line) => total + line.coutLigne, 0));
    jours.push({
      jour,
      plat: picked.dish,
      lignes,
      coutJournalier,
      statut: picked.alertes.length > 0 ? "Attention" : "Conforme",
      alertes: picked.alertes
    });
  }

  return rebuildMenuResult(normalized, jours, reference, buildMenuChoices(candidates));
}

export function rebuildMenuResult(
  entree: PlanInput,
  jours: DayMenu[],
  reference = defaultCantineReference,
  menusDisponibles: MenuChoice[] = []
): MenuResult {
  const normalized = normalizeInput(entree);
  const lignes = jours.flatMap((jour) => jour.lignes);
  const listeAchats = buildShoppingList(lignes);
  const coutTotal = roundMoney(listeAchats.reduce((total, item) => total + item.coutTotal, 0));
  const ecartBudget = roundMoney(normalized.budgetTotal - coutTotal);
  const verifications = buildVerificationChecks(normalized, jours, coutTotal, reference);
  const statut = summarizeStatus(verifications.map((check) => check.statut));

  return {
    entree: normalized,
    jours,
    lignes,
    listeAchats,
    menusDisponibles,
    verifications,
    statut,
    coutTotal,
    ecartBudget,
    coutParEnfant: normalized.nombreEnfants > 0 ? roundMoney(coutTotal / normalized.nombreEnfants) : 0,
    utilisationBudget: normalized.budgetTotal > 0 ? Math.round((coutTotal / normalized.budgetTotal) * 100) : 0,
    genereLe: new Date().toISOString(),
    explications: buildExplanations(normalized, jours, coutTotal, ecartBudget, statut, reference),
    reference: {
      sourceName: reference.sourceName,
      importedAt: reference.importedAt,
      platsValides: reference.dishes.filter(isValidatedDish).length,
      alimentsActifs: reference.foods.filter((food) => food.actif).length
    }
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
    style: "currency",
    currency: "XOF"
  }).format(value);
}

export function formatPortion(food: Food, quantity: number): string {
  const label = food.unitePortion === "g" ? "g" : food.unitePortionLabel || "piece";
  return `${trimNumber(quantity)} ${formatUnitLabel(label, quantity)}`;
}

export function formatPurchaseQuantity(food: Food, quantity: number): string {
  if (food.uniteAchat === "kg") {
    return `${trimNumber(quantity / 1000)} kg`;
  }
  if (food.quantiteParVente > 1) {
    const saleCount = quantity / food.quantiteParVente;
    return `${trimNumber(saleCount)} ${formatUnitLabel(food.uniteAchat, saleCount)}`;
  }
  return `${trimNumber(quantity)} ${formatUnitLabel(food.uniteAchat, quantity)}`;
}

export function formatUnitPrice(food: Food): string {
  const normalizedUnit = normalizeText(food.uniteAchat);
  const normalizedSale = normalizeText(food.quantiteParVenteLabel);
  const unit =
    normalizedSale && normalizedSale !== `1 ${normalizedUnit}` && normalizedSale !== normalizedUnit
      ? `${food.uniteAchat} (${food.quantiteParVenteLabel})`
      : food.uniteAchat;
  return `${formatCurrency(food.prixEstime)} / ${unit}`;
}

function normalizeFood(row: RawRow, ids: Map<string, number>): Food | undefined {
  const nom = textCell(row, ["Aliment"]);
  if (!nom) {
    return undefined;
  }

  const groupeAlimentaire = textCell(row, ["Groupe alimentaire"]) || "Non classe";
  const roleText = textCell(row, ["Rôle nutritionnel", "Role nutritionnel"]);
  const uniteAchat = textCell(row, ["Unité achat", "Unite achat"]) || "unite";
  const unitePortionText = textCell(row, ["Unité portion", "Unite portion"]) || uniteAchat;
  const unitePortion = mapPortionUnit(unitePortionText);
  const prixEstime = numberCell(row, ["Prix estimé (FCFA)", "Prix estime (FCFA)", "Prix estimé", "Prix estime"]);
  const portionEnfant = numberCell(row, ["Portion standard enfant", "Portion par enfant"]);
  const typeProteine = mapProteinType(textCell(row, ["Type protéine", "Type proteine"]), nom, groupeAlimentaire);
  const role = mapFoodRole(groupeAlimentaire, roleText);
  const searchable = normalizeText(`${nom} ${groupeAlimentaire} ${roleText} ${typeProteine ?? ""}`);
  const quantiteParVenteLabel = textCell(row, ["Quantité par vente", "Quantite par vente"]) || `1 ${uniteAchat}`;

  return {
    id: uniqueSlug(nom, ids),
    nom,
    groupeAlimentaire,
    role,
    saison: mapSeason(textCell(row, ["Saison"])),
    uniteAchat,
    unitePortion,
    unitePortionLabel: unitePortionText,
    prixEstime,
    portionEnfant,
    minimumEnfant: unitePortion === "piece" ? Math.max(0.25, portionEnfant) : Math.max(1, Math.round(portionEnfant * 0.75)),
    modeVente: textCell(row, ["Mode d’achat", "Mode d'achat", "Mode achat"]) || uniteAchat,
    quantiteParVente: parseSaleQuantity(quantiteParVenteLabel, uniteAchat, unitePortion),
    quantiteParVenteLabel,
    prioriteCout: mapCostPriority(textCell(row, ["Niveau de coût", "Niveau de cout"])),
    typeProteine,
    categorieCulinaire: textCell(row, ["Catégorie culinaire", "Categorie culinaire"]) || groupeAlimentaire,
    conseils: textCell(row, ["Conseils d'utilisation"]),
    actif: role !== "autre" && prixEstime > 0 && portionEnfant > 0,
    tags: [
      searchable.includes("porc") ? "porc" : "",
      searchable.includes("poisson") ? "poisson" : "",
      searchable.includes("sardine") ? "poisson" : "",
      searchable.includes("tilapia") ? "poisson" : "",
      searchable.includes("arachide") ? "arachide" : "",
      typeProteine === "Vegetale" ? "vegetarien" : ""
    ].filter(Boolean)
  };
}

function normalizeDish(row: RawRow, index: number): ValidatedDish | undefined {
  const nom = textCell(row, ["Plat validé", "Plat valide"]);
  if (!nom) {
    return undefined;
  }
  const typeText = textCell(row, ["Type protéine", "Type proteine"]);
  return {
    id: `${slugify(nom)}-${index + 1}`,
    nom,
    base: textCell(row, ["Base"]),
    sauce: textCell(row, ["Sauce / préparation", "Sauce preparation"]),
    proteineVisible: textCell(row, ["Protéine visible", "Proteine visible"]),
    typeProteine: normalizeText(typeText).includes("vegetale")
      ? "Vegetale"
      : normalizeText(typeText).includes("animale")
        ? "Animale"
        : typeText
          ? "Mixte"
          : null,
    apportVegetal: textCell(row, ["Apport végétal", "Apport vegetal"]),
    fruit: textCell(row, ["Fruit"]),
    budgetConseille: textCell(row, ["Budget conseillé", "Budget conseille"]),
    budgetRank: mapBudgetRank(textCell(row, ["Budget conseillé", "Budget conseille"])),
    statut: textCell(row, ["Statut"]),
    remarques: textCell(row, ["Remarques terrain"])
  };
}

function resolveDish(dish: ValidatedDish, entree: PlanInput, reference: CantineReference) {
  const alertes: string[] = [];
  const lines: Omit<MenuLine, "id" | "jour">[] = [];

  const addFood = (component: DishComponent, sourceText: string, food: Food) => {
    lines.push(createMenuLine(entree, dish, component, sourceText, food));
  };

  const base = findBestFood(dish.base, "energetique", entree, reference);
  if (base) addFood("base", dish.base, base);
  else alertes.push(`Base non trouvee: ${dish.base}`);

  const proteine = findBestFood(dish.proteineVisible, "proteine", entree, reference);
  if (proteine) addFood("proteine", dish.proteineVisible, proteine);
  else alertes.push(`Proteine non trouvee: ${dish.proteineVisible}`);

  const vegetalFoods = findAllFoods(`${dish.apportVegetal} ${dish.sauce}`, "vegetal", entree, reference).slice(0, 2);
  if (vegetalFoods.length > 0) {
    vegetalFoods.forEach((food) => addFood("vegetal", dish.apportVegetal || dish.sauce, food));
  } else {
    alertes.push(`Apport vegetal non trouve: ${dish.apportVegetal || dish.sauce}`);
  }

  const fruit = findBestFood(dish.fruit, "fruit", entree, reference);
  if (fruit) addFood("fruit", dish.fruit, fruit);
  else alertes.push(`Fruit non trouve: ${dish.fruit}`);

  return {
    lignes: lines,
    cout: roundMoney(lines.reduce((total, line) => total + line.coutLigne, 0)),
    alertes
  };
}

function createMenuLine(
  entree: PlanInput,
  dish: ValidatedDish,
  component: DishComponent,
  sourceText: string,
  aliment: Food
): Omit<MenuLine, "id" | "jour"> {
  const multiplier = ageMultipliers[entree.trancheAge] ?? 1;
  const basePortion = portionForChild(aliment, multiplier);
  const quantiteParEnfant =
    aliment.role === "fruit" && aliment.unitePortion === "piece" ? 1 : Math.max(aliment.minimumEnfant, basePortion);
  const quantiteTotale = roundQuantity(quantiteParEnfant * entree.nombreEnfants);
  const quantiteAchat = Math.ceil(quantiteTotale / aliment.quantiteParVente) * aliment.quantiteParVente;
  const surplus = roundQuantity(quantiteAchat - quantiteTotale);
  const coutLigne = roundMoney((quantiteAchat / aliment.quantiteParVente) * aliment.prixEstime);

  return {
    dishId: dish.id,
    component,
    componentLabel: componentLabels[component],
    sourceText,
    alimentId: aliment.id,
    aliment,
    role: aliment.role,
    quantiteParEnfant,
    quantiteTotale,
    quantiteAchat,
    surplus,
    coutLigne
  };
}

function pickDishForDay(
  candidates: Array<{ dish: ValidatedDish; lignes: Omit<MenuLine, "id" | "jour">[]; cout: number; alertes: string[] }>,
  jour: number,
  entree: PlanInput
) {
  const selectedDishId = entree.platsChoisis?.[jour];
  const selected = selectedDishId ? candidates.find((candidate) => candidate.dish.id === selectedDishId) : undefined;
  if (selected) {
    return selected;
  }

  const budgetParRepas = entree.budgetTotal / Math.max(1, entree.dureeJours);
  const affordable = candidates.filter((candidate) => candidate.cout <= budgetParRepas);
  const pool = affordable.length > 0 ? affordable : candidates;
  return pool[(jour - 1) % pool.length];
}

function buildMenuChoices(
  candidates: Array<{ dish: ValidatedDish; cout: number }>
): MenuChoice[] {
  return candidates.map((candidate) => ({
    id: candidate.dish.id,
    nom: candidate.dish.nom,
    coutJournalier: candidate.cout,
    budgetConseille: candidate.dish.budgetConseille
  }));
}

function portionForChild(aliment: Food, multiplier: number): number {
  if (aliment.role === "fruit" && aliment.unitePortion === "piece") {
    return 1;
  }
  if (aliment.unitePortion === "piece") {
    return aliment.portionEnfant;
  }
  return Math.round((aliment.portionEnfant * multiplier) / 5) * 5;
}

function hasRequiredDishLines(lignes: Omit<MenuLine, "id" | "jour">[]): boolean {
  const components = new Set(lignes.map((line) => line.component));
  return components.has("base") && components.has("proteine") && components.has("fruit");
}

function findBestFood(text: string, role: FoodRole, entree: PlanInput, reference: CantineReference): Food | undefined {
  const alternatives = splitAlternatives(text);
  for (const alternative of alternatives) {
    const candidates = findAllFoods(alternative, role, entree, reference);
    if (candidates[0]) {
      return candidates[0];
    }
  }
  return findAllFoods(text, role, entree, reference)[0];
}

function findAllFoods(text: string, role: FoodRole, entree: PlanInput, reference: CantineReference): Food[] {
  const normalizedText = normalizeText(text);
  const parts = splitFoodParts(text);
  const foods = reference.foods.filter((food) => foodMatchesConstraints(food, role, entree));
  const matches = foods.filter((food) => {
    const normalizedName = normalizeText(food.nom);
    return foodNameMatches(normalizedText, parts, normalizedName);
  });

  return Array.from(new Map(matches.map((food) => [food.id, food])).values()).sort(
    (a, b) => a.prioriteCout - b.prioriteCout || a.prixEstime - b.prixEstime
  );
}

function foodNameMatches(normalizedText: string, parts: string[], normalizedName: string): boolean {
  if (!normalizedText || !normalizedName) {
    return false;
  }
  if (normalizedText === normalizedName || parts.includes(normalizedName)) {
    return true;
  }

  const nameTokens = tokenSet(normalizedName);
  return parts.some((part) => {
    if (part === normalizedName) {
      return true;
    }
    const partTokens = tokenSet(part);
    return partTokens.size > 0 && Array.from(partTokens).every((token) => nameTokens.has(token));
  });
}

function tokenSet(value: string): Set<string> {
  return new Set(
    value
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 2 && token !== "de" && token !== "du" && token !== "la")
  );
}

function splitAlternatives(value: string): string[] {
  return value
    .split(/\s+ou\s+|\/|;/i)
    .map(cleanComponentText)
    .filter(Boolean);
}

function splitFoodParts(value: string): string[] {
  return value
    .split(/\s+ou\s+|\s+et\s+|\/|\+|,|;|\(|\)|dans|avec/i)
    .map(cleanComponentText)
    .filter((part) => part.length >= 2 && !["sauce", "jus", "legere", "leger", "frit", "frite", "dur", "dure"].includes(part));
}

function cleanComponentText(value: string): string {
  return normalizeText(value)
    .replace(/\b(sauce|jus|frit|frite|dur|dure|leger|legere|dans|avec|preparation)\b/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function foodMatchesConstraints(food: Food, role: FoodRole, entree: PlanInput): boolean {
  if (!food.actif || food.role !== role) return false;
  if (entree.saison !== "Aucune" && food.saison !== "Toute saison" && food.saison !== entree.saison) return false;
  if (entree.contraintes.includes("sans porc") && food.tags.includes("porc")) return false;
  if (entree.contraintes.includes("sans poisson") && food.tags.includes("poisson")) return false;
  if (entree.contraintes.includes("allergie arachide") && food.tags.includes("arachide")) return false;
  if (entree.contraintes.includes("vegetarien") && food.typeProteine === "Animale") return false;
  return true;
}

function dishMatchesConstraints(dish: ValidatedDish, entree: PlanInput): boolean {
  const text = normalizeText(`${dish.nom} ${dish.base} ${dish.sauce} ${dish.proteineVisible} ${dish.apportVegetal} ${dish.fruit}`);
  if (entree.contraintes.includes("sans porc") && text.includes("porc")) return false;
  if (entree.contraintes.includes("sans poisson") && (text.includes("poisson") || text.includes("sardine") || text.includes("tilapia"))) return false;
  if (entree.contraintes.includes("allergie arachide") && text.includes("arachide")) return false;
  if (entree.contraintes.includes("vegetarien") && dish.typeProteine === "Animale") return false;
  return true;
}

function isValidatedDish(dish: ValidatedDish): boolean {
  const status = normalizeText(dish.statut);
  return status.includes("valide") && !status.includes("a valider");
}

function buildShoppingList(lignes: MenuLine[]): ShoppingItem[] {
  const map = new Map<string, ShoppingItem>();
  lignes.forEach((line) => {
    const current =
      map.get(line.alimentId) ??
      ({
        aliment: line.aliment,
        role: line.role,
        quantiteTotale: 0,
        quantiteAchat: 0,
        surplus: 0,
        coutTotal: 0
      } satisfies ShoppingItem);

    current.quantiteTotale = roundQuantity(current.quantiteTotale + line.quantiteTotale);
    map.set(line.alimentId, current);
  });

  return Array.from(map.values())
    .map((item) => {
      const quantiteAchat =
        Math.ceil(item.quantiteTotale / item.aliment.quantiteParVente) * item.aliment.quantiteParVente;
      return {
        ...item,
        quantiteAchat: roundQuantity(quantiteAchat),
        surplus: roundQuantity(quantiteAchat - item.quantiteTotale),
        coutTotal: roundMoney((quantiteAchat / item.aliment.quantiteParVente) * item.aliment.prixEstime)
      };
    })
    .sort((a, b) => a.role.localeCompare(b.role) || a.aliment.nom.localeCompare(b.aliment.nom));
}

function buildVerificationChecks(
  entree: PlanInput,
  jours: DayMenu[],
  coutTotal: number,
  reference: CantineReference
): VerificationCheck[] {
  const missingDays = entree.dureeJours - jours.length;
  const allValid = jours.every((jour) => isValidatedDish(jour.plat));
  const allProteins = jours.every((jour) => jour.lignes.some((line) => line.component === "proteine"));
  const allFruits = jours.every((jour) => jour.lignes.some((line) => line.component === "fruit"));
  const allEnergy = jours.every((jour) => jour.lignes.some((line) => line.component === "base"));
  const allVegetal = jours.every((jour) => jour.lignes.some((line) => line.component === "vegetal"));
  const budgetStatus: Status =
    coutTotal <= entree.budgetTotal ? "Conforme" : coutTotal <= entree.budgetTotal * 1.05 ? "Attention" : "Non conforme";

  return [
    {
      code: "PV-01",
      libelle: "Plats valides",
      statut: allValid && missingDays === 0 ? "Conforme" : "Non conforme",
      detail:
        missingDays === 0
          ? `Tous les menus proviennent de Plats_Valides (${reference.dishes.filter(isValidatedDish).length} plats disponibles).`
          : `${missingDays} jour(s) sans plat valide disponible.`
    },
    {
      code: "RM-01",
      libelle: "Base energetique",
      statut: allEnergy ? "Conforme" : "Non conforme",
      detail: allEnergy ? "Chaque plat a une base energetique identifiee." : "Une base energetique manque."
    },
    {
      code: "RM-02",
      libelle: "Proteine visible",
      statut: allProteins ? "Conforme" : "Non conforme",
      detail: allProteins ? "Chaque plat garde une proteine visible." : "Une proteine visible manque."
    },
    {
      code: "RM-03",
      libelle: "Fruit",
      statut: allFruits ? "Conforme" : "Non conforme",
      detail: allFruits ? "Chaque jour contient le fruit indique dans le plat valide." : "Un fruit manque."
    },
    {
      code: "RM-04",
      libelle: "Apport vegetal",
      statut: allVegetal ? "Conforme" : "Attention",
      detail: allVegetal ? "L'apport vegetal est rattache au plat valide." : "Un apport vegetal doit etre verifie."
    },
    {
      code: "RM-05",
      libelle: "Budget",
      statut: budgetStatus,
      detail:
        budgetStatus === "Conforme"
          ? "Le cout calcule reste dans l'enveloppe saisie."
          : "Le cout calcule depasse le budget saisi."
    }
  ];
}

function buildExplanations(
  entree: PlanInput,
  jours: DayMenu[],
  coutTotal: number,
  ecartBudget: number,
  statut: Status,
  reference: CantineReference
): string[] {
  const contraintesText = entree.contraintes.length > 0 ? entree.contraintes.join(", ") : "aucune contrainte alimentaire";
  return [
    `Generation limitee aux plats marques Valide dans ${reference.sourceName}.`,
    `Contraintes appliquees: ${contraintesText}; saison: ${entree.saison}.`,
    `Les couts viennent de Base_Aliments: prix de reference, portion enfant et quantite par vente.`,
    ecartBudget >= 0
      ? `Le menu conserve une marge de ${formatCurrency(ecartBudget)} sur le budget.`
      : `Le menu depasse le budget de ${formatCurrency(Math.abs(ecartBudget))}.`,
    statut === "Conforme"
      ? `${jours.length} jour(s) generes sans inventer de plat hors reference.`
      : "Une verification humaine est necessaire avant validation terrain."
  ];
}

function normalizeInput(entree: PlanInput): PlanInput {
  return {
    ...entree,
    nombreEnfants: Math.max(1, Math.round(entree.nombreEnfants || 1)),
    budgetTotal: Math.max(0, Math.round(entree.budgetTotal || 0)),
    dureeJours: Math.min(30, Math.max(1, Math.round(entree.dureeJours || 1)))
  };
}

function textCell(row: RawRow, labels: string[]): string {
  const normalizedLabels = labels.map(normalizeText);
  const entries = Object.entries(row);
  const exactEntry = entries.find(([key]) => normalizedLabels.includes(normalizeText(key)));
  const fallbackEntry = entries.find(([key]) => {
    const normalizedKey = normalizeText(key);
    return normalizedLabels.some((label) => normalizedKey.includes(label));
  });
  const value = (exactEntry ?? fallbackEntry)?.[1];
  return value === undefined || value === null ? "" : String(value).trim();
}

function numberCell(row: RawRow, labels: string[]): number {
  return parseNumber(textCell(row, labels));
}

function parseNumber(value: string): number {
  const match = value.replace(/\s/g, "").replace(",", ".").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function parseSaleQuantity(value: string, uniteAchat: string, unitePortion: PortionUnit): number {
  const quantity = parseNumber(value) || 1;
  const text = normalizeText(`${value} ${uniteAchat}`);
  if (text.includes("kg") || (unitePortion === "g" && normalizeText(uniteAchat).includes("kg"))) return quantity * 1000;
  if (text.includes("lot de")) return quantity;
  if (text.includes("g") && !text.includes("kg")) return quantity;
  return quantity;
}

function mapFoodRole(group: string, roleText: string): FoodRole {
  const normalizedGroup = normalizeText(group);
  const normalizedRole = normalizeText(roleText);
  if (normalizedGroup.includes("fruit")) return "fruit";
  if (normalizedGroup.includes("proteine")) return "proteine";
  if (normalizedGroup.includes("energetique")) return "energetique";
  if (normalizedGroup.includes("legume")) return "vegetal";
  if (normalizedRole.includes("fruit")) return "fruit";
  if (normalizedRole.includes("proteine")) return "proteine";
  if (normalizedRole.includes("energie") || normalizedRole.includes("glucide")) return "energetique";
  if (normalizedRole.includes("legume") || normalizedRole.includes("feuille")) return "vegetal";
  return "autre";
}

function mapSeason(value: string): FoodSeason {
  const normalized = normalizeText(value);
  if (normalized.includes("seche")) return "Seche";
  if (normalized.includes("pluie")) return "Pluies";
  return "Toute saison";
}

function mapPortionUnit(value: string): PortionUnit {
  const normalized = normalizeText(value);
  return normalized.includes("g") && !normalized.includes("piece") ? "g" : "piece";
}

function mapProteinType(value: string, name: string, group: string): Food["typeProteine"] {
  const normalized = normalizeText(`${value} ${name} ${group}`);
  if (normalized.includes("vegetale") || normalized.includes("soja") || normalized.includes("haricot") || normalized.includes("niebe")) {
    return "Vegetale";
  }
  if (
    normalized.includes("animale") ||
    normalized.includes("poisson") ||
    normalized.includes("poulet") ||
    normalized.includes("viande") ||
    normalized.includes("oeuf") ||
    normalized.includes("lait") ||
    normalized.includes("dinde") ||
    normalized.includes("sardine")
  ) {
    return "Animale";
  }
  return null;
}

function mapCostPriority(value: string): number {
  const normalized = normalizeText(value);
  if (normalized.includes("faible")) return 1;
  if (normalized.includes("moyen")) return 3;
  if (normalized.includes("eleve")) return 5;
  return Math.min(5, Math.max(1, parseNumber(value) || 3));
}

function mapBudgetRank(value: string): number {
  return mapCostPriority(value);
}

function summarizeStatus(statuses: Status[]): Status {
  if (statuses.includes("Non conforme")) return "Non conforme";
  if (statuses.includes("Attention")) return "Attention";
  return "Conforme";
}

function roundMoney(value: number): number {
  return Math.round(value);
}

function roundQuantity(value: number): number {
  return Math.round(value * 100) / 100;
}

function trimNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function formatUnitLabel(label: string, quantity: number): string {
  const clean = label.trim() || "unite";
  const normalized = normalizeText(clean);
  if (quantity <= 1 || normalized === "kg" || normalized === "g") {
    return clean;
  }
  if (normalized.startsWith("lot de")) {
    return clean.replace(/^lot\b/i, "lots");
  }
  return clean.endsWith("s") ? clean : `${clean}s`;
}

function uniqueSlug(value: string, ids: Map<string, number>): string {
  const base = slugify(value);
  const count = ids.get(base) ?? 0;
  ids.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}

function slugify(value: string): string {
  return normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/[_()]/g, " ")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}
