import rawDefaultReference from "@/data/cantine-reference.json";

export type TargetGroup = "maternelle" | "ciCp" | "ce1Ce2" | "cm1Cm2" | "adulte";
export type MonthKey =
  | "janvier" | "fevrier" | "mars" | "avril" | "mai" | "juin"
  | "juillet" | "aout" | "septembre" | "octobre" | "novembre" | "decembre";
export type FoodSeason = "Seche" | "Pluies" | "Toute saison";
export type FoodRole = "energetique" | "proteine" | "fruit" | "vegetal" | "autre";
export type DishComponent = "base" | "sauce" | "proteine" | "vegetal" | "gouter";
export type MenuService = "repas" | "gouter";
export type Status = "Conforme" | "Attention" | "Non conforme";
export type PortionUnit = "g" | "piece";
export type RawRow = Record<string, string | number | null | undefined>;

export type PortionDisplay = {
  quantitesParCible: Record<TargetGroup, number>;
  uniteLabel: string;
};

export type PlanInput = {
  effectifs: Record<TargetGroup, number>;
  budgetTotal: number;
  dureeJours: number;
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
  componentPortions: {
    base: PortionDisplay;
    proteine: PortionDisplay;
    vegetal: PortionDisplay;
  };
};

export type ValidatedSnack = {
  id: string;
  nom: string;
  aliments: string;
  prixParPersonne: number;
  portions: Record<TargetGroup, number>;
  unitePortionLabel: string;
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
  portionAffichee?: PortionDisplay;
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

type ResolvedDish = {
  dish: ValidatedDish;
  lignes: Omit<MenuLine, "id" | "jour">[];
  cout: number;
  alertes: string[];
};

type ResolvedSnack = {
  snack: ValidatedSnack;
  lignes: Omit<MenuLine, "id" | "jour">[];
  cout: number;
  alertes: string[];
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

export const targetGroups: {
  key: TargetGroup;
  label: string;
  ages: string;
  kind: "enfant" | "adulte";
}[] = [
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

const dayLabels = ["LUNDI", "MARDI", "JEUDI", "VENDREDI"];

function emptyPortions(): Record<TargetGroup, number> {
  return {
    maternelle: 0,
    ciCp: 0,
    ce1Ce2: 0,
    cm1Cm2: 0,
    adulte: 0
  };
}

const rawDefault = rawDefaultReference as RawCantineReference;

const fallbackMultipliers: Record<TargetGroup, number> = {
  maternelle: 0.75,
  ciCp: 0.9,
  ce1Ce2: 1,
  cm1Cm2: 1.15,
  adulte: 1.35
};

export const defaultCantineReference = normalizeCantineReference(rawDefault);

export function planningDayLabel(jour: number): string {
  return dayLabels[(Math.max(1, jour) - 1) % dayLabels.length];
}

export function normalizeCantineReference(
  raw: RawCantineReference | CantineReference
): CantineReference {
  const normalized = raw as CantineReference;
  if (normalized.foods?.[0]?.nom && normalized.dishes?.[0]?.nom) {
    return normalized;
  }
  const source = raw as RawCantineReference;
  const ids = new Map<string, number>();
  return {
    sourceName: raw.sourceName || "Base Cantine Intelligente",
    importedAt: raw.importedAt || new Date().toISOString(),
    foods: (source.foods ?? [])
      .map((row) => normalizeFood(row, ids))
      .filter((food): food is Food => Boolean(food)),
    dishes: (source.dishes ?? [])
      .map((row, index) => normalizeDish(row, index))
      .filter((dish): dish is ValidatedDish => Boolean(dish)),
    snacks: (source.snacks ?? [])
      .map((row, index) => normalizeSnack(row, index))
      .filter((snack): snack is ValidatedSnack => Boolean(snack)),
    avoid: source.avoid ?? [],
    rules: source.rules ?? [],
    sources: source.sources ?? []
  };
}

export function generateMenu(
  entree: PlanInput,
  reference: CantineReference = defaultCantineReference
): MenuResult {
  const normalized = normalizeInput(entree);
  const resolvedDishes = reference.dishes
    .filter(isValidatedDish)
    .filter((dish) => !dishHasFruit(dish, reference))
    .map((dish) => resolveDish(dish, normalized, reference));
  const completeDishes = resolvedDishes.filter((item) =>
    hasRequiredDishLines(item.lignes)
  );
  const snackCandidates = reference.snacks
    .filter(isValidatedSnack)
    .map((snack) => resolveSnack(snack, normalized));
  const jours: DayMenu[] = [];

  for (let jour = 1; jour <= normalized.dureeJours; jour += 1) {
    const picked = pickDish(resolvedDishes, completeDishes, normalized, jour);
    if (!picked) continue;
    const pickedSnack = pickSnack(snackCandidates, normalized, jour);
    const mealLines = picked.lignes.map((line) => ({
      ...line,
      id: `${jour}-repas-${line.component}-${line.alimentId}`,
      jour
    }));
    const daySnack = pickedSnack
      ? buildDaySnack(pickedSnack, jour)
      : undefined;
    const lines = daySnack ? [...mealLines, ...daySnack.lignes] : mealLines;
    const cost = roundMoney(lines.reduce((sum, line) => sum + line.coutLigne, 0));
    jours.push({
      jour,
      plat: picked.dish,
      gouter: daySnack,
      lignes: lines,
      coutJournalier: cost,
      statut: summarizeStatus([
        picked.alertes.length ? "Attention" : "Conforme",
        daySnack?.statut ?? "Conforme"
      ]),
      alertes: [...picked.alertes, ...(daySnack?.alertes ?? [])]
    });
  }

  return rebuildMenuResult(
    normalized,
    jours,
    reference,
    buildDishChoices(completeDishes.length ? completeDishes : resolvedDishes),
    buildSnackChoices(snackCandidates)
  );
}

function buildDaySnack(snack: ResolvedSnack, jour: number): DaySnack {
  return {
    gouter: snack.snack,
    lignes: snack.lignes.map((line) => ({
      ...line,
      id: `${jour}-gouter-${line.alimentId}`,
      jour
    })),
    coutGouter: snack.cout,
    statut: snack.alertes.length ? "Attention" : "Conforme",
    alertes: snack.alertes
  };
}

export function rebuildMenuResult(
  entree: PlanInput,
  jours: DayMenu[],
  reference: CantineReference = defaultCantineReference,
  menusDisponibles: MenuChoice[] = [],
  goutersDisponibles: MenuChoice[] = []
): MenuResult {
  const normalized = normalizeInput(entree);
  const lignes = jours.flatMap((jour) => jour.lignes);
  const listeAchats = buildShoppingList(lignes);
  const coutTotal = roundMoney(
    listeAchats.reduce((sum, item) => sum + item.coutTotal, 0)
  );
  const ecartBudget = roundMoney(normalized.budgetTotal - coutTotal);
  const verifications = buildChecks(normalized, jours, coutTotal, reference);
  const statut = summarizeStatus(verifications.map((check) => check.statut));
  const children = totalChildren(normalized);
  const people = totalPeople(normalized);

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
    coutParEnfant: children ? roundMoney(coutTotal / children) : 0,
    coutParPersonne: people ? roundMoney(coutTotal / people) : 0,
    utilisationBudget: normalized.budgetTotal
      ? Math.round((coutTotal / normalized.budgetTotal) * 100)
      : 0,
    genereLe: new Date().toISOString(),
    explications: buildExplanations(
      normalized,
      jours,
      ecartBudget,
      statut,
      reference
    ),
    reference: {
      sourceName: reference.sourceName,
      importedAt: reference.importedAt,
      platsValides: reference.dishes.filter(isValidatedDish).length,
      goutersValides: reference.snacks.filter(isValidatedSnack).length,
      alimentsActifs: reference.foods.filter((food) => food.actif).length
    }
  };
}

function normalizeFood(row: RawRow, ids: Map<string, number>): Food | undefined {
  const nom = textCell(row, ["Aliment"]);
  if (!nom) return undefined;
  const groupe = textCell(row, ["Groupe alimentaire"]) || "Non classe";
  const roleText = textCell(row, ["Role nutritionnel"]);
  const role = mapFoodRole(groupe, roleText);
  const uniteAchat = textCell(row, ["Unite achat"]) || "unite";
  const unitePortionLabel = textCell(row, ["Unite portion"]) || uniteAchat;
  const unitePortion = mapPortionUnit(unitePortionLabel);
  const portions = targetGroups.reduce(
    (acc, target) => ({ ...acc, [target.key]: portionCell(row, target.key, "") }),
    emptyPortions()
  );
  const portionEnfant =
    portions.ce1Ce2 ||
    portions.ciCp ||
    portions.maternelle ||
    numberCell(row, ["Portion standard enfant", "Portion par enfant"]);
  const vente = textCell(row, ["Quantite par vente"]) || `1 ${uniteAchat}`;
  const dispo = textCell(row, [
    "Disponibilite",
    "Mois d'abondance",
    "Mois",
    "Saison"
  ]) || "Toute saison";
  const typeProteine = mapProteinType(
    textCell(row, ["Type proteine"]),
    nom,
    groupe
  );

  return {
    id: uniqueSlug(nom, ids),
    nom,
    groupeAlimentaire: groupe,
    role,
    saison: mapSeason(textCell(row, ["Saison"])),
    uniteAchat,
    unitePortion,
    unitePortionLabel,
    prixEstime: numberCell(row, [
      "Prix estime",
      "Prix Mois d'abondance",
      "Prix Mois de soudure",
      "Prix periode d'abondance"
    ]),
    portionEnfant,
    portions,
    minimumEnfant: unitePortion === "piece"
      ? Math.max(1, portionEnfant || 1)
      : Math.max(1, Math.round((portionEnfant || 1) * 0.75)),
    modeVente: textCell(row, ["Mode achat"]) || uniteAchat,
    quantiteParVente: parseSaleQuantity(vente, uniteAchat, unitePortion),
    quantiteParVenteLabel: vente,
    disponibiliteMois: mapAvailabilityMonths(dispo),
    disponibiliteLabel: dispo,
    prioriteCout: mapCostPriority(textCell(row, ["Niveau de cout"])),
    typeProteine,
    categorieCulinaire: textCell(row, ["Categorie culinaire"]) || groupe,
    conseils: textCell(row, ["Conseils d'utilisation"]),
    actif: role !== "autre",
    tags: []
  };
}

function normalizeDish(row: RawRow, index: number): ValidatedDish | undefined {
  const nom = textCell(row, ["Plat valide"]);
  if (!nom) return undefined;
  const typeText = normalizeText(textCell(row, ["Type proteine"]));
  const typeProteine = typeText.includes("vegetale")
    ? "Vegetale"
    : typeText.includes("animale")
      ? "Animale"
      : typeText
        ? "Mixte"
        : null;
  return {
    id: `${slugify(nom)}-${index + 1}`,
    nom,
    base: textCell(row, ["Base"]),
    sauce: textCell(row, ["Sauce preparation", "Sauce"]),
    proteineVisible: textCell(row, ["Proteine"]),
    typeProteine,
    apportVegetal: textCell(row, ["Legumes", "Apport vegetal"]),
    fruit: textCell(row, ["Fruit"]),
    budgetConseille: textCell(row, ["Budget conseille", "Budget"]),
    budgetRank: mapBudgetRank(textCell(row, ["Budget conseille", "Budget"])),
    statut: textCell(row, ["Statut"]) || "Valide",
    remarques: textCell(row, ["Remarques terrain", "Remarques"]),
    componentPortions: {
      base: portionProfile(row, ""),
      vegetal: portionProfile(row, "2"),
      proteine: portionProfile(row, "3")
    }
  };
}

function normalizeSnack(row: RawRow, index: number): ValidatedSnack | undefined {
  const nom = textCell(row, ["Gouter", "Snack", "Collation", "Nom"]);
  if (!nom) return undefined;
  const composition = [
    textCell(row, ["Composition du gouter fruit", "Fruit", "Fruits"]),
    textCell(row, ["Composition du gouter legumes", "Legumes"]),
    textCell(row, ["Composition", "Aliments", "Ingredients"])
  ].flatMap(splitFoodParts).filter(Boolean);
  const rawPortions = targetGroups.reduce(
    (acc, target) => ({ ...acc, [target.key]: portionCell(row, target.key, "") }),
    emptyPortions()
  );
  const portions = Object.values(rawPortions).some(Boolean)
    ? rawPortions
    : targetGroups.reduce(
        (acc, target) => ({ ...acc, [target.key]: 1 }),
        emptyPortions()
      );
  return {
    id: `${slugify(nom)}-${index + 1}`,
    nom,
    aliments: Array.from(new Set(composition)).join(" / ") || nom,
    prixParPersonne: numberCell(row, [
      "Prix FCFA enfant",
      "Prix par enfant",
      "Prix par personne",
      "Prix gouter",
      "Prix estime",
      "Prix"
    ]),
    portions,
    unitePortionLabel: textCell(row, ["Unite portion", "Unite"]) || "portion",
    budgetConseille: textCell(row, ["Budget conseille", "Budget"]),
    budgetRank: mapBudgetRank(textCell(row, ["Budget conseille", "Budget"])),
    statut: textCell(row, ["Statut"]) || "Valide",
    remarques: textCell(row, ["Remarques terrain", "Remarques"])
  };
}

function resolveDish(
  dish: ValidatedDish,
  entree: PlanInput,
  reference: CantineReference
): ResolvedDish {
  const lines: Omit<MenuLine, "id" | "jour">[] = [];
  const add = (
    component: DishComponent,
    source: string,
    role: FoodRole,
    display: PortionDisplay
  ) => {
    if (!source.trim()) return;
    const food = findBestFood(source, role, entree, reference)
      ?? syntheticFood(source, role, display.uniteLabel);
    lines.push(buildLine(dish.id, "repas", component, source, food, display, entree));
  };

  add("base", dish.base || dish.nom, "energetique", dish.componentPortions.base);
  add("proteine", dish.proteineVisible || dish.nom, "proteine", dish.componentPortions.proteine);
  const vegetalSource = dish.apportVegetal || dish.sauce;
  const vegetables = findAllFoods(vegetalSource, "vegetal", entree, reference).slice(0, 2);
  if (vegetables.length) {
    vegetables.forEach((food) => {
      lines.push(buildLine(
        dish.id,
        "repas",
        "vegetal",
        vegetalSource,
        food,
        dish.componentPortions.vegetal,
        entree
      ));
    });
  } else {
    add("vegetal", vegetalSource, "vegetal", dish.componentPortions.vegetal);
  }

  return {
    dish,
    lignes: lines,
    cout: sumCost(lines),
    alertes: hasRequiredDishLines(lines) ? [] : [`Repas incomplet: ${dish.nom}`]
  };
}

function resolveSnack(snack: ValidatedSnack, entree: PlanInput): ResolvedSnack {
  const display: PortionDisplay = {
    quantitesParCible: snack.portions,
    uniteLabel: snack.unitePortionLabel || "portion"
  };
  const lines = [
    buildLine(
      snack.id,
      "gouter",
      "gouter",
      snack.aliments || snack.nom,
      syntheticSnackFood(snack),
      display,
      entree
    )
  ];
  return { snack, lignes: lines, cout: sumCost(lines), alertes: [] };
}

function buildLine(
  dishId: string,
  service: MenuService,
  component: DishComponent,
  sourceText: string,
  food: Food,
  portionAffichee: PortionDisplay,
  entree: PlanInput
): Omit<MenuLine, "id" | "jour"> {
  const quantitesParCible = targetGroups.reduce((acc, target) => {
    const configured = portionAffichee.quantitesParCible[target.key];
    const foodPortion = food.portions[target.key];
    return {
      ...acc,
      [target.key]: configured || foodPortion || fallbackPortion(food, target.key)
    };
  }, emptyPortions());
  const quantiteTotale = targetGroups.reduce(
    (sum, target) => sum + quantitesParCible[target.key] * (entree.effectifs[target.key] || 0),
    0
  );
  const quantiteAchat = food.quantiteParVente > 0
    ? Math.ceil(quantiteTotale / food.quantiteParVente) * food.quantiteParVente
    : quantiteTotale;
  return {
    dishId,
    service,
    component,
    componentLabel: componentLabels[component],
    sourceText,
    alimentId: food.id,
    aliment: food,
    role: food.role,
    quantiteParEnfant: quantitesParCible.ce1Ce2 || quantitesParCible.ciCp || quantitesParCible.maternelle,
    quantitesParCible,
    portionAffichee,
    quantiteTotale: roundQuantity(quantiteTotale),
    quantiteAchat: roundQuantity(quantiteAchat),
    surplus: roundQuantity(quantiteAchat - quantiteTotale),
    coutLigne: roundMoney(food.quantiteParVente
      ? (quantiteAchat / food.quantiteParVente) * food.prixEstime
      : 0)
  };
}
