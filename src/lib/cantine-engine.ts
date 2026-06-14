import rawDefaultReference from "@/data/cantine-reference.json";

export type TargetGroup = "maternelle" | "ciCp" | "ce1Ce2" | "cm1Cm2" | "adulte";
export type MonthKey =
  | "janvier"
  | "fevrier"
  | "mars"
  | "avril"
  | "mai"
  | "juin"
  | "juillet"
  | "aout"
  | "septembre"
  | "octobre"
  | "novembre"
  | "decembre";
export type FoodSeason = "Seche" | "Pluies" | "Toute saison";
export type FoodRole = "energetique" | "proteine" | "fruit" | "vegetal" | "autre";
export type DishComponent = "base" | "sauce" | "proteine" | "vegetal" | "gouter";
export type MenuService = "repas" | "gouter";
export type Status = "Conforme" | "Attention" | "Non conforme";
export type PortionUnit = "g" | "piece";

export type PlanInput = {
  effectifs: Record<TargetGroup, number>;
  budgetTotal: number;
  dureeJours: number;
  contraintesTexte: string;
  moisDisponibilite: MonthKey[];
  generationSeed?: number;
  platsChoisis?: Record<number, string>;
  goutersChoisis?: Record<number, string>;
};

export type RawCantineReference = {
  sourceName?: string;
  importedAt?: string;
  foods?: RawRow[];
  dishes?: RawRow[];
  snacks?: RawRow[];
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
  portions: Record<TargetGroup, number>;
  minimumEnfant: number;
  modeVente: string;
  quantiteParVente: number;
  quantiteParVenteLabel: string;
  disponibiliteMois: MonthKey[];
  disponibiliteLabel: string;
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

export type ValidatedSnack = {
  id: string;
  nom: string;
  aliments: string;
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
  snacks: ValidatedSnack[];
  avoid: RawRow[];
  rules: RawRow[];
  sources: RawRow[];
};

export type MenuLine = {
  id: string;
  jour: number;
  dishId: string;
  service: MenuService;
  component: DishComponent;
  componentLabel: string;
  sourceText: string;
  alimentId: string;
  aliment: Food;
  role: FoodRole;
  quantiteParEnfant: number;
  quantitesParCible: Record<TargetGroup, number>;
  quantiteTotale: number;
  quantiteAchat: number;
  surplus: number;
  coutLigne: number;
};

export type DaySnack = {
  gouter: ValidatedSnack;
  lignes: MenuLine[];
  coutGouter: number;
  statut: Status;
  alertes: string[];
};

export type DayMenu = {
  jour: number;
  plat: ValidatedDish;
  gouter?: DaySnack;
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
  goutersDisponibles: MenuChoice[];
  verifications: VerificationCheck[];
  statut: Status;
  coutTotal: number;
  ecartBudget: number;
  coutParEnfant: number;
  coutParPersonne: number;
  utilisationBudget: number;
  genereLe: string;
  explications: string[];
  reference: {
    sourceName: string;
    importedAt: string;
    platsValides: number;
    goutersValides: number;
    alimentsActifs: number;
  };
};

export const roleLabels: Record<FoodRole, string> = {
  energetique: "Feculent",
  proteine: "Proteine",
  fruit: "Fruit",
  vegetal: "Legume",
  autre: "Autre"
};

export const componentLabels: Record<DishComponent, string> = {
  base: "Base",
  sauce: "Sauce",
  proteine: "Proteine",
  vegetal: "Legume",
  gouter: "Gouter"
};

export const targetGroups: { key: TargetGroup; label: string; ages: string; kind: "enfant" | "adulte" }[] = [
  { key: "maternelle", label: "Maternelle", ages: "3-5 ans", kind: "enfant" },
  { key: "ciCp", label: "CI/CP", ages: "6-7 ans", kind: "enfant" },
  { key: "ce1Ce2", label: "CE1/CE2", ages: "8-9 ans", kind: "enfant" },
  { key: "cm1Cm2", label: "CM1/CM2", ages: "10-11 ans", kind: "enfant" },
  { key: "adulte", label: "Adulte", ages: "Encadrement", kind: "adulte" }
];

export const monthOptions: { key: MonthKey; label: string }[] = [
  { key: "janvier", label: "Janvier" },
  { key: "fevrier", label: "Fevrier" },
  { key: "mars", label: "Mars" },
  { key: "avril", label: "Avril" },
  { key: "mai", label: "Mai" },
  { key: "juin", label: "Juin" },
  { key: "juillet", label: "Juillet" },
  { key: "aout", label: "Aout" },
  { key: "septembre", label: "Septembre" },
  { key: "octobre", label: "Octobre" },
  { key: "novembre", label: "Novembre" },
  { key: "decembre", label: "Decembre" }
];

const fallbackPortionMultipliers: Record<TargetGroup, number> = {
  maternelle: 0.75,
  ciCp: 0.9,
  ce1Ce2: 1,
  cm1Cm2: 1.15,
  adulte: 1.35
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

  const snacks = (raw.snacks ?? [])
    .map((row, index) => normalizeSnack(row, index))
    .filter((snack): snack is ValidatedSnack => Boolean(snack));

  return {
    sourceName: raw.sourceName || "Base Cantine Intelligente",
    importedAt: raw.importedAt || new Date().toISOString(),
    foods,
    dishes,
    snacks,
    avoid: raw.avoid ?? [],
    rules: raw.rules ?? [],
    sources: raw.sources ?? []
  };
}

export function generateMenu(entree: PlanInput, reference: CantineReference = defaultCantineReference): MenuResult {
  const normalized = normalizeInput(entree);
  const resolvedDishes = reference.dishes
    .filter((dish) => isValidatedDish(dish))
    .filter((dish) => !dishContainsFruit(dish, reference))
    .filter((dish) => dishMatchesConstraints(dish, normalized))
    .map((dish) => {
      const resolved = resolveDish(dish, normalized, reference);
      return { dish, ...resolved };
    })
    .sort((a, b) => a.cout - b.cout || a.dish.budgetRank - b.dish.budgetRank || a.dish.nom.localeCompare(b.dish.nom));
  const completeDishes = resolvedDishes.filter((item) => hasRequiredDishLines(item.lignes));

  const snackCandidates = buildSnackCandidates(normalized, reference);
  const jours: DayMenu[] = [];
  for (let jour = 1; jour <= normalized.dureeJours; jour += 1) {
    const picked = pickDishForDay(resolvedDishes, completeDishes, jour, normalized);
    if (!picked) {
      continue;
    }

    const lignes = picked.lignes.map((line) => ({
      ...line,
      id: `${jour}-repas-${line.component}-${line.alimentId}`,
      jour
    }));
    const pickedSnack = pickSnackForDay(snackCandidates, jour, normalized);
    const gouter: DaySnack | undefined = pickedSnack
      ? {
          gouter: pickedSnack.snack,
          lignes: pickedSnack.lignes.map((line) => ({
            ...line,
            id: `${jour}-gouter-${line.alimentId}`,
            jour
          })),
          coutGouter: pickedSnack.cout,
          statut: pickedSnack.alertes.length > 0 ? "Attention" : "Conforme",
          alertes: pickedSnack.alertes
        }
      : undefined;
    const lignesJour = gouter ? [...lignes, ...gouter.lignes] : lignes;
    const coutJournalier = roundMoney(lignesJour.reduce((total, line) => total + line.coutLigne, 0));
    jours.push({
      jour,
      plat: picked.dish,
      gouter,
      lignes: lignesJour,
      coutJournalier,
      statut: summarizeStatus([
        picked.alertes.length > 0 ? "Attention" : "Conforme",
        gouter?.statut ?? "Conforme"
      ]),
      alertes: [...picked.alertes, ...(gouter?.alertes ?? [])]
    });
  }

  return rebuildMenuResult(normalized, jours, reference, buildMenuChoices(resolvedDishes), buildSnackChoices(snackCandidates));
}

export function rebuildMenuResult(
  entree: PlanInput,
  jours: DayMenu[],
  reference = defaultCantineReference,
  menusDisponibles: MenuChoice[] = [],
  goutersDisponibles: MenuChoice[] = []
): MenuResult {
  const normalized = normalizeInput(entree);
  const lignes = jours.flatMap((jour) => jour.lignes);
  const listeAchats = buildShoppingList(lignes);
  const coutTotal = roundMoney(listeAchats.reduce((total, item) => total + item.coutTotal, 0));
  const ecartBudget = roundMoney(normalized.budgetTotal - coutTotal);
  const verifications = buildVerificationChecks(normalized, jours, coutTotal, reference);
  const statut = summarizeStatus(verifications.map((check) => check.statut));
  const effectifTotal = totalPeople(normalized);
  const effectifEnfants = totalChildren(normalized);

  return {
    entree: normalized,
    jours,
    lignes,
    listeAchats,
    menusDisponibles,
    goutersDisponibles,
    verifications,
    statut,
    coutTotal,
    ecartBudget,
    coutParEnfant: effectifEnfants > 0 ? roundMoney(coutTotal / effectifEnfants) : 0,
    coutParPersonne: effectifTotal > 0 ? roundMoney(coutTotal / effectifTotal) : 0,
    utilisationBudget: normalized.budgetTotal > 0 ? Math.round((coutTotal / normalized.budgetTotal) * 100) : 0,
    genereLe: new Date().toISOString(),
    explications: buildExplanations(normalized, jours, coutTotal, ecartBudget, statut, reference),
    reference: {
      sourceName: reference.sourceName,
      importedAt: reference.importedAt,
      platsValides: reference.dishes.filter(isValidatedDish).length,
      goutersValides: reference.snacks.filter(isValidatedSnack).length,
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
  const prixAbondance = numberCell(row, ["Prix période d'abondance (FCFA)", "Prix periode d'abondance (FCFA)", "Prix abondance"]);
  const prixSoudure = numberCell(row, ["Prix période de soudure (FCFA)", "Prix periode de soudure (FCFA)", "Prix soudure"]);
  const prixEstime =
    numberCell(row, ["Prix estimé (FCFA)", "Prix estime (FCFA)", "Prix estimé", "Prix estime"]) ||
    prixAbondance ||
    prixSoudure;
  const portionEnfant = numberCell(row, ["Portion standard enfant", "Portion par enfant"]);
  const portions = targetGroups.reduce(
    (values, target) => ({
      ...values,
      [target.key]: numberCell(row, targetPortionLabels(target.key)) || 0
    }),
    {} as Record<TargetGroup, number>
  );
  const typeProteine = mapProteinType(textCell(row, ["Type protéine", "Type proteine"]), nom, groupeAlimentaire);
  const role = mapFoodRole(groupeAlimentaire, roleText);
  const searchable = normalizeText(`${nom} ${groupeAlimentaire} ${roleText} ${typeProteine ?? ""}`);
  const quantiteParVenteLabel = textCell(row, ["Quantité par vente", "Quantite par vente"]) || `1 ${uniteAchat}`;
  const disponibiliteLabel =
    textCell(row, ["Disponibilité", "Disponibilite", "Mois", "Période", "Periode", "Saison"]) || "Toute saison";

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
    portions,
    minimumEnfant: unitePortion === "piece" ? Math.max(0.25, portionEnfant) : Math.max(1, Math.round(portionEnfant * 0.75)),
    modeVente: textCell(row, ["Mode d’achat", "Mode d'achat", "Mode achat"]) || uniteAchat,
    quantiteParVente: parseSaleQuantity(quantiteParVenteLabel, uniteAchat, unitePortion),
    quantiteParVenteLabel,
    disponibiliteMois: mapAvailabilityMonths(disponibiliteLabel),
    disponibiliteLabel,
    prioriteCout: mapCostPriority(textCell(row, ["Niveau de coût", "Niveau de cout"])),
    typeProteine,
    categorieCulinaire: textCell(row, ["Catégorie culinaire", "Categorie culinaire"]) || groupeAlimentaire,
    conseils: textCell(row, ["Conseils d'utilisation"]),
    actif: role !== "autre" && (portionEnfant > 0 || Object.values(portions).some((portion) => portion > 0)),
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
    proteineVisible: textCell(row, ["Protéine", "Proteine", "Protéine visible", "Proteine visible"]),
    typeProteine: normalizeText(typeText).includes("vegetale")
      ? "Vegetale"
      : normalizeText(typeText).includes("animale")
        ? "Animale"
        : typeText
          ? "Mixte"
          : null,
    apportVegetal: textCell(row, ["Légumes", "Legumes", "Apport végétal", "Apport vegetal"]),
    fruit: textCell(row, ["Fruit"]),
    budgetConseille: textCell(row, ["Budget conseillé", "Budget conseille"]),
    budgetRank: mapBudgetRank(textCell(row, ["Budget conseillé", "Budget conseille"])),
    statut: textCell(row, ["Statut"]),
    remarques: textCell(row, ["Remarques terrain"])
  };
}

function normalizeSnack(row: RawRow, index: number): ValidatedSnack | undefined {
  const nom = textCell(row, [
    "Goûter validé",
    "Gouter valide",
    "Goûter",
    "Gouter",
    "Snack",
    "Collation",
    "Nom"
  ]);
  if (!nom) {
    return undefined;
  }

  const aliments =
    textCell(row, ["Aliments", "Aliment", "Composition", "Ingrédients", "Ingredients", "Fruit", "Légumes", "Legumes", "Base"]) ||
    nom;

  return {
    id: `${slugify(nom)}-${index + 1}`,
    nom,
    aliments,
    budgetConseille: textCell(row, ["Budget conseillé", "Budget conseille", "Budget"]),
    budgetRank: mapBudgetRank(textCell(row, ["Budget conseillé", "Budget conseille", "Budget"])),
    statut: textCell(row, ["Statut"]) || "Valide",
    remarques: textCell(row, ["Remarques terrain", "Remarques"])
  };
}

function resolveDish(dish: ValidatedDish, entree: PlanInput, reference: CantineReference) {
  const alertes: string[] = [];
  const lines: Omit<MenuLine, "id" | "jour">[] = [];

  const addFood = (component: DishComponent, sourceText: string, food: Food) => {
    lines.push(createMenuLine(entree, dish.id, "repas", component, sourceText, food));
  };

  const base = findBestFood(dish.base, "energetique", entree, reference);
  if (base) addFood("base", dish.base, base);
  else alertes.push(`Base non trouvee: ${dish.base}`);

  const proteineText = dish.proteineVisible || dish.nom;
  const proteine = findBestFood(proteineText, "proteine", entree, reference);
  if (proteine) addFood("proteine", proteineText, proteine);
  else alertes.push(`Proteine non trouvee: ${proteineText}`);

  const vegetalFoods = findAllFoods(`${dish.apportVegetal} ${dish.sauce}`, "vegetal", entree, reference).slice(0, 2);
  if (vegetalFoods.length > 0) {
    vegetalFoods.forEach((food) => addFood("vegetal", dish.apportVegetal || dish.sauce, food));
  } else {
    alertes.push(`Apport vegetal non trouve: ${dish.apportVegetal || dish.sauce}`);
  }

  return {
    lignes: lines,
    cout: roundMoney(lines.reduce((total, line) => total + line.coutLigne, 0)),
    alertes
  };
}

function createMenuLine(
  entree: PlanInput,
  dishId: string,
  service: MenuService,
  component: DishComponent,
  sourceText: string,
  aliment: Food
): Omit<MenuLine, "id" | "jour"> {
  const quantitesParCible = targetGroups.reduce((values, target) => {
    const effectif = entree.effectifs[target.key] ?? 0;
    return {
      ...values,
      [target.key]: effectif > 0 ? portionForTarget(aliment, target.key) : 0
    };
  }, {} as Record<TargetGroup, number>);
  const quantiteTotale = roundQuantity(
    targetGroups.reduce((total, target) => total + (entree.effectifs[target.key] ?? 0) * quantitesParCible[target.key], 0)
  );
  const effectifTotal = totalPeople(entree);
  const quantiteParEnfant = effectifTotal > 0 ? roundQuantity(quantiteTotale / effectifTotal) : 0;
  const quantiteAchat = Math.ceil(quantiteTotale / aliment.quantiteParVente) * aliment.quantiteParVente;
  const surplus = roundQuantity(quantiteAchat - quantiteTotale);
  const coutLigne = roundMoney((quantiteAchat / aliment.quantiteParVente) * aliment.prixEstime);

  return {
    dishId,
    service,
    component,
    componentLabel: componentLabels[component],
    sourceText,
    alimentId: aliment.id,
    aliment,
    role: aliment.role,
    quantiteParEnfant,
    quantitesParCible,
    quantiteTotale,
    quantiteAchat,
    surplus,
    coutLigne
  };
}

function resolveSnack(snack: ValidatedSnack, entree: PlanInput, reference: CantineReference) {
  const alertes: string[] = [];
  const foods = findSnackFoods(snack.aliments || snack.nom, entree, reference);
  const lignes = foods.map((food) => createMenuLine(entree, snack.id, "gouter", "gouter", snack.aliments || snack.nom, food));

  if (lignes.length === 0) {
    alertes.push(`Gouter non trouve: ${snack.nom}`);
  }

  return {
    snack,
    lignes,
    cout: roundMoney(lignes.reduce((total, line) => total + line.coutLigne, 0)),
    alertes
  };
}

function pickDishForDay(
  allCandidates: Array<{ dish: ValidatedDish; lignes: Omit<MenuLine, "id" | "jour">[]; cout: number; alertes: string[] }>,
  completeCandidates: Array<{ dish: ValidatedDish; lignes: Omit<MenuLine, "id" | "jour">[]; cout: number; alertes: string[] }>,
  jour: number,
  entree: PlanInput
) {
  const selectedDishId = entree.platsChoisis?.[jour];
  const selected = selectedDishId ? allCandidates.find((candidate) => candidate.dish.id === selectedDishId) : undefined;
  if (selected) {
    return selected;
  }

  const budgetParRepas = entree.budgetTotal / Math.max(1, entree.dureeJours);
  const sourcePool = completeCandidates.length > 0 ? completeCandidates : allCandidates;
  const affordable = sourcePool.filter((candidate) => candidate.cout <= budgetParRepas);
  const pool = affordable.length > 0 ? affordable : sourcePool;
  if (pool.length === 0) {
    return undefined;
  }
  const offset = Math.abs(Math.round(entree.generationSeed || 0));
  return pool[(jour - 1 + offset) % pool.length];
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

function buildSnackCandidates(entree: PlanInput, reference: CantineReference) {
  const sourceSnacks = reference.snacks.filter(isValidatedSnack);
  const snacks =
    sourceSnacks.length > 0
      ? sourceSnacks
      : reference.foods
          .filter((food) => food.actif && food.role === "fruit")
          .map((food, index) => ({
            id: `gouter-${food.id}`,
            nom: food.nom,
            aliments: food.nom,
            budgetConseille: "Reference fichier",
            budgetRank: food.prioriteCout || 3,
            statut: "Valide",
            remarques: index === 0 ? "Gouter derive des fruits disponibles." : ""
          }));

  return snacks
    .filter((snack) => snackMatchesConstraints(snack, entree))
    .map((snack) => resolveSnack(snack, entree, reference))
    .sort((a, b) => a.cout - b.cout || a.snack.budgetRank - b.snack.budgetRank || a.snack.nom.localeCompare(b.snack.nom));
}

function buildSnackChoices(candidates: Array<{ snack: ValidatedSnack; cout: number }>): MenuChoice[] {
  return candidates.map((candidate) => ({
    id: candidate.snack.id,
    nom: candidate.snack.nom,
    coutJournalier: candidate.cout,
    budgetConseille: candidate.snack.budgetConseille
  }));
}

function pickSnackForDay(
  candidates: Array<{ snack: ValidatedSnack; lignes: Omit<MenuLine, "id" | "jour">[]; cout: number; alertes: string[] }>,
  jour: number,
  entree: PlanInput
) {
  const selectedSnackId = entree.goutersChoisis?.[jour];
  const selected = selectedSnackId ? candidates.find((candidate) => candidate.snack.id === selectedSnackId) : undefined;
  if (selected) {
    return selected;
  }
  const usable = candidates.filter((candidate) => candidate.lignes.length > 0);
  const pool = usable.length > 0 ? usable : candidates;
  if (pool.length === 0) {
    return undefined;
  }
  const offset = Math.abs(Math.round(entree.generationSeed || 0));
  return pool[(jour - 1 + offset) % pool.length];
}

function portionForTarget(aliment: Food, target: TargetGroup): number {
  const configured = aliment.portions[target];
  if (configured > 0) {
    return configured;
  }
  if (aliment.role === "fruit" && aliment.unitePortion === "piece") {
    return 1;
  }
  if (aliment.unitePortion === "piece") {
    return aliment.portionEnfant || 1;
  }
  const fallback = aliment.portionEnfant || aliment.minimumEnfant || 1;
  return Math.round((fallback * fallbackPortionMultipliers[target]) / 5) * 5;
}

function hasRequiredDishLines(lignes: Omit<MenuLine, "id" | "jour">[]): boolean {
  const components = new Set(lignes.map((line) => line.component));
  return components.has("base") && components.has("proteine") && components.has("vegetal");
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

function findSnackFoods(text: string, entree: PlanInput, reference: CantineReference): Food[] {
  const normalizedText = normalizeText(text);
  const parts = splitFoodParts(text);
  const foods = reference.foods.filter((food) => foodMatchesBaseConstraints(food, entree));
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
  if (!foodMatchesBaseConstraints(food, entree) || food.role !== role) return false;
  return true;
}

function foodMatchesBaseConstraints(food: Food, entree: PlanInput): boolean {
  if (!food.actif) return false;
  if (!foodAvailableForMonths(food, entree.moisDisponibilite)) return false;
  if (constraintBlocksFood(food, entree)) return false;
  return true;
}

function dishMatchesConstraints(dish: ValidatedDish, entree: PlanInput): boolean {
  const text = normalizeText(`${dish.nom} ${dish.base} ${dish.sauce} ${dish.proteineVisible} ${dish.apportVegetal}`);
  if (constraintTextBlocksValue(text, entree.contraintesTexte)) return false;
  if (isVegetarianConstraint(entree.contraintesTexte) && dish.typeProteine === "Animale") return false;
  return true;
}

function snackMatchesConstraints(snack: ValidatedSnack, entree: PlanInput): boolean {
  const text = normalizeText(`${snack.nom} ${snack.aliments}`);
  return !constraintTextBlocksValue(text, entree.contraintesTexte);
}

function dishContainsFruit(dish: ValidatedDish, reference: CantineReference): boolean {
  const normalizedText = normalizeText(
    `${dish.nom} ${dish.base} ${dish.sauce} ${dish.proteineVisible} ${dish.apportVegetal} ${dish.fruit}`
  );
  if (!normalizedText) {
    return false;
  }
  if (dish.fruit.trim()) {
    return true;
  }
  if (/\bfruits?\b/.test(normalizedText)) {
    return true;
  }

  return reference.foods.some((food) => {
    if (!food.actif || food.role !== "fruit") {
      return false;
    }
    return textMentionsFood(normalizedText, normalizeText(food.nom));
  });
}

function textMentionsFood(normalizedText: string, normalizedFoodName: string): boolean {
  const tokens = Array.from(tokenSet(normalizedFoodName)).filter((token) => token !== "fruit" && token !== "fruits");
  if (tokens.length === 0) {
    return false;
  }
  return tokens.every((token) => new RegExp(`(^|\\s)${escapeRegExp(token)}(\\s|$)`).test(normalizedText));
}

function isValidatedDish(dish: ValidatedDish): boolean {
  const status = normalizeText(dish.statut);
  if (!status) {
    return true;
  }
  return status.includes("valide") && !status.includes("a valider");
}

function isValidatedSnack(snack: ValidatedSnack): boolean {
  const status = normalizeText(snack.statut || "valide");
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
  const hasGeneratedDays = jours.length > 0;
  const allProteins =
    hasGeneratedDays && jours.every((jour) => jour.lignes.some((line) => line.service === "repas" && line.component === "proteine"));
  const allEnergy =
    hasGeneratedDays && jours.every((jour) => jour.lignes.some((line) => line.service === "repas" && line.component === "base"));
  const allVegetal =
    hasGeneratedDays && jours.every((jour) => jour.lignes.some((line) => line.service === "repas" && line.component === "vegetal"));
  const allSnacks = hasGeneratedDays && jours.every((jour) => Boolean(jour.gouter));
  const foodsWithoutPrice = Array.from(
    new Map(
      jours
        .flatMap((jour) => jour.lignes)
        .filter((line) => line.aliment.prixEstime <= 0)
        .map((line) => [line.aliment.id, line.aliment])
    ).values()
  );
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
      libelle: "Feculents",
      statut: allEnergy ? "Conforme" : "Non conforme",
      detail: allEnergy ? "Chaque repas contient un feculent." : "Un feculent manque dans au moins un repas."
    },
    {
      code: "RM-02",
      libelle: "Proteines",
      statut: allProteins ? "Conforme" : "Non conforme",
      detail: allProteins ? "Chaque repas contient une proteine animale ou vegetale." : "Une proteine manque dans au moins un repas."
    },
    {
      code: "RM-03",
      libelle: "Legumes",
      statut: allVegetal ? "Conforme" : "Attention",
      detail: allVegetal ? "Chaque repas contient un apport en legumes." : "Un apport en legumes doit etre verifie."
    },
    {
      code: "GT-01",
      libelle: "Gouters",
      statut: allSnacks ? "Conforme" : "Attention",
      detail: allSnacks ? "Chaque jour contient un gouter issu de la reference." : "Aucun gouter disponible pour au moins un jour."
    },
    {
      code: "PX-01",
      libelle: "Prix de reference",
      statut: foodsWithoutPrice.length === 0 ? "Conforme" : "Attention",
      detail:
        foodsWithoutPrice.length === 0
          ? "Tous les aliments utilises ont un prix de reference."
          : `${foodsWithoutPrice.length} aliment(s) du menu ont un prix vide ou nul dans le fichier.`
    },
    {
      code: "RM-04",
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
  const contraintesText = entree.contraintesTexte.trim() || "aucune contrainte alimentaire";
  const moisText =
    entree.moisDisponibilite.length === monthOptions.length
      ? "tous les mois"
      : entree.moisDisponibilite.map((month) => monthOptions.find((item) => item.key === month)?.label ?? month).join(", ");
  return [
    `Generation limitee aux plats marques Valide dans ${reference.sourceName}.`,
    `Contraintes appliquees: ${contraintesText}; disponibilite: ${moisText}.`,
    `Les couts viennent de Base_Aliments: prix de reference, portions par cible et quantite par vente.`,
    `Les fruits sont reserves aux gouters; les repas principaux sont limites aux feculents, proteines et legumes du fichier.`,
    ecartBudget >= 0
      ? `Le menu conserve une marge de ${formatCurrency(ecartBudget)} sur le budget.`
      : `Le menu depasse le budget de ${formatCurrency(Math.abs(ecartBudget))}.`,
    statut === "Conforme"
      ? `${jours.length} jour(s) generes sans inventer de plat hors reference.`
      : "Une verification humaine est necessaire avant validation terrain."
  ];
}

function normalizeInput(entree: PlanInput): PlanInput {
  const legacy = entree as PlanInput & { nombreEnfants?: number };
  const fallbackEffectif = Math.max(0, Math.round(legacy.nombreEnfants || 0));
  const effectifs = targetGroups.reduce((values, target) => {
    const value = entree.effectifs?.[target.key] ?? (target.key === "ce1Ce2" ? fallbackEffectif : 0);
    return {
      ...values,
      [target.key]: Math.max(0, Math.round(value || 0))
    };
  }, {} as Record<TargetGroup, number>);
  const normalizedMonths = (entree.moisDisponibilite ?? [])
    .filter((month): month is MonthKey => monthOptions.some((option) => option.key === month));

  return {
    ...entree,
    effectifs,
    budgetTotal: Math.max(0, Math.round(entree.budgetTotal || 0)),
    dureeJours: Math.min(30, Math.max(1, Math.round(entree.dureeJours || 1))),
    contraintesTexte: entree.contraintesTexte || "",
    moisDisponibilite: normalizedMonths.length > 0 ? Array.from(new Set(normalizedMonths)) : monthOptions.map((month) => month.key)
  };
}

export function totalChildren(entree: PlanInput): number {
  return targetGroups
    .filter((target) => target.kind === "enfant")
    .reduce((total, target) => total + Math.max(0, Math.round(entree.effectifs?.[target.key] ?? 0)), 0);
}

export function totalAdults(entree: PlanInput): number {
  return Math.max(0, Math.round(entree.effectifs?.adulte ?? 0));
}

export function totalPeople(entree: PlanInput): number {
  return totalChildren(entree) + totalAdults(entree);
}

function targetPortionLabels(target: TargetGroup): string[] {
  const labels: Record<TargetGroup, string[]> = {
    maternelle: ["Maternelle", "Maternelle 3-5 ans", "Maternelle 3 5 ans"],
    ciCp: ["CI/CP", "CI CP", "CI-CP"],
    ce1Ce2: ["CE1/CE2", "CE1 CE2", "CE1-CE2"],
    cm1Cm2: ["CM1/CM2", "CM1 CM2", "CM1-CM2"],
    adulte: ["Adulte", "Adultes"]
  };
  return labels[target];
}

function foodAvailableForMonths(food: Food, selectedMonths: MonthKey[]): boolean {
  const months = selectedMonths.length > 0 ? selectedMonths : monthOptions.map((month) => month.key);
  return months.some((month) => food.disponibiliteMois.includes(month));
}

function mapAvailabilityMonths(value: string): MonthKey[] {
  const normalized = normalizeText(value);
  if (!normalized || normalized.includes("toute") || normalized.includes("annee") || normalized.includes("saison")) {
    if (!normalized.includes("seche") && !normalized.includes("pluie")) {
      return monthOptions.map((month) => month.key);
    }
  }

  const explicitMonths = monthOptions
    .filter((month) => normalized.includes(normalizeText(month.label)) || normalized.includes(month.key))
    .map((month) => month.key);
  if (explicitMonths.length > 0) {
    if (explicitMonths.length >= 2 && /\b(a|au|jusqua|jusqu au)\b|-/.test(normalized)) {
      return monthsBetween(explicitMonths[0], explicitMonths[explicitMonths.length - 1]);
    }
    return explicitMonths;
  }

  if (normalized.includes("seche")) {
    return ["novembre", "decembre", "janvier", "fevrier", "mars"];
  }
  if (normalized.includes("pluie")) {
    return ["avril", "mai", "juin", "juillet", "aout", "septembre", "octobre"];
  }

  return monthOptions.map((month) => month.key);
}

function monthsBetween(start: MonthKey, end: MonthKey): MonthKey[] {
  const months = monthOptions.map((month) => month.key);
  const startIndex = months.indexOf(start);
  const endIndex = months.indexOf(end);
  if (startIndex < 0 || endIndex < 0) {
    return months;
  }
  if (startIndex <= endIndex) {
    return months.slice(startIndex, endIndex + 1);
  }
  return [...months.slice(startIndex), ...months.slice(0, endIndex + 1)];
}

function constraintBlocksFood(food: Food, entree: PlanInput): boolean {
  const constraintsText = entree.contraintesTexte || "";
  if (constraintTextBlocksValue(normalizeText(`${food.nom} ${food.groupeAlimentaire} ${food.categorieCulinaire}`), constraintsText)) {
    return true;
  }
  if (isVegetarianConstraint(constraintsText) && food.typeProteine === "Animale") {
    return true;
  }
  return false;
}

function constraintTextBlocksValue(normalizedValue: string, constraintsText: string): boolean {
  const constraints = normalizeText(constraintsText);
  if (!constraints) {
    return false;
  }

  const negative = /\b(sans|allergie|interdit|interdits|eviter|evitez|pas de|ne pas)\b/.test(constraints);
  if (!negative && !isVegetarianConstraint(constraints)) {
    return false;
  }

  const blockedKeywords = ["porc", "poisson", "sardine", "tilapia", "arachide", "oeuf", "viande", "poulet", "lait"];
  if (blockedKeywords.some((keyword) => constraints.includes(keyword) && normalizedValue.includes(keyword))) {
    return true;
  }

  return normalizedValue
    .split(/\s+/)
    .filter((token) => token.length >= 4)
    .some((token) => constraints.includes(token) && negative);
}

function isVegetarianConstraint(value: string): boolean {
  const normalized = normalizeText(value);
  return normalized.includes("vegetarien") || normalized.includes("vegetalien") || normalized.includes("sans viande");
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
