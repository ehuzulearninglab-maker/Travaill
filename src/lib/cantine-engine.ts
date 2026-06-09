export type AgeRange = "3-6 ans" | "6-10 ans" | "10-15 ans";
export type Season = "Aucune" | "Seche" | "Pluies";
export type FoodSeason = "Seche" | "Pluies" | "Toute saison";
export type Constraint = "sans porc" | "vegetarien" | "allergie arachide" | "sans poisson";
export type FoodRole = "energetique" | "proteine" | "fruit" | "vegetal" | "autre";
export type Status = "Conforme" | "Attention" | "Non conforme";
export type PortionUnit = "g" | "piece";

export type PlanInput = {
  nombreEnfants: number;
  trancheAge: AgeRange;
  budgetTotal: number;
  dureeJours: number;
  contraintes: Constraint[];
  saison: Season;
};

export type Food = {
  id: string;
  nom: string;
  groupeAlimentaire: string;
  role: FoodRole;
  saison: FoodSeason;
  uniteAchat: string;
  unitePortion: PortionUnit;
  prixEstime: number;
  portionEnfant: number;
  minimumEnfant: number;
  modeVente: string;
  quantiteParVente: number;
  prioriteCout: number;
  typeProteine: "Animale" | "Vegetale" | null;
  categorieCulinaire: string;
  compatibleAvec: string[];
  complementProteique?: string;
  actif: boolean;
  tags: string[];
};

export type MenuLine = {
  id: string;
  jour: number;
  alimentId: string;
  aliment: Food;
  role: FoodRole;
  quantiteParEnfant: number;
  quantiteTotale: number;
  quantiteAchat: number;
  surplus: number;
  coutLigne: number;
  explication: string;
};

export type DayMenu = {
  jour: number;
  lignes: MenuLine[];
  coutJournalier: number;
  statut: Status;
};

export type VerificationCheck = {
  code: string;
  libelle: string;
  statut: Status;
  detail: string;
};

export type ShoppingItem = {
  aliment: Food;
  quantiteTotale: number;
  quantiteAchat: number;
  surplus: number;
  coutTotal: number;
};

export type MenuResult = {
  entree: PlanInput;
  lignes: MenuLine[];
  jours: DayMenu[];
  listeAchats: ShoppingItem[];
  verifications: VerificationCheck[];
  statut: Status;
  coutTotal: number;
  ecartBudget: number;
  coutParEnfant: number;
  utilisationBudget: number;
  genereLe: string;
  explications: string[];
};

export const roleLabels: Record<FoodRole, string> = {
  energetique: "Energie",
  proteine: "Proteine",
  fruit: "Fruit",
  vegetal: "Vegetal",
  autre: "Autre"
};

export const constraints: Constraint[] = ["sans porc", "vegetarien", "allergie arachide", "sans poisson"];

const ageMultipliers: Record<AgeRange, number> = {
  "3-6 ans": 0.75,
  "6-10 ans": 1,
  "10-15 ans": 1.25
};

const commonStapleCompat = [
  "riz-local",
  "mais-concasse",
  "igname",
  "gari",
  "haricot-niebe",
  "soja",
  "oeuf",
  "poisson-fume",
  "poulet-local",
  "arachide",
  "feuilles-amarante",
  "tomate",
  "gombo",
  "carotte",
  "chou",
  "banane",
  "orange",
  "mangue",
  "papaye"
];

export const foods: Food[] = [
  {
    id: "riz-local",
    nom: "Riz local",
    groupeAlimentaire: "Cereales/Tubercules",
    role: "energetique",
    saison: "Toute saison",
    uniteAchat: "kg",
    unitePortion: "g",
    prixEstime: 650,
    portionEnfant: 120,
    minimumEnfant: 90,
    modeVente: "Vrac",
    quantiteParVente: 1000,
    prioriteCout: 1,
    typeProteine: null,
    categorieCulinaire: "Plat principal",
    compatibleAvec: commonStapleCompat,
    actif: true,
    tags: []
  },
  {
    id: "mais-concasse",
    nom: "Mais concasse",
    groupeAlimentaire: "Cereales/Tubercules",
    role: "energetique",
    saison: "Toute saison",
    uniteAchat: "kg",
    unitePortion: "g",
    prixEstime: 420,
    portionEnfant: 130,
    minimumEnfant: 95,
    modeVente: "Vrac",
    quantiteParVente: 1000,
    prioriteCout: 1,
    typeProteine: null,
    categorieCulinaire: "Bouillie/plat principal",
    compatibleAvec: commonStapleCompat,
    actif: true,
    tags: []
  },
  {
    id: "igname",
    nom: "Igname",
    groupeAlimentaire: "Cereales/Tubercules",
    role: "energetique",
    saison: "Pluies",
    uniteAchat: "kg",
    unitePortion: "g",
    prixEstime: 500,
    portionEnfant: 180,
    minimumEnfant: 130,
    modeVente: "Vrac",
    quantiteParVente: 1000,
    prioriteCout: 2,
    typeProteine: null,
    categorieCulinaire: "Accompagnement",
    compatibleAvec: commonStapleCompat,
    actif: true,
    tags: []
  },
  {
    id: "gari",
    nom: "Gari",
    groupeAlimentaire: "Cereales/Tubercules",
    role: "energetique",
    saison: "Seche",
    uniteAchat: "kg",
    unitePortion: "g",
    prixEstime: 480,
    portionEnfant: 115,
    minimumEnfant: 85,
    modeVente: "Vrac",
    quantiteParVente: 1000,
    prioriteCout: 2,
    typeProteine: null,
    categorieCulinaire: "Accompagnement",
    compatibleAvec: commonStapleCompat,
    actif: true,
    tags: []
  },
  {
    id: "haricot-niebe",
    nom: "Haricot niebe",
    groupeAlimentaire: "Proteines",
    role: "proteine",
    saison: "Toute saison",
    uniteAchat: "kg",
    unitePortion: "g",
    prixEstime: 900,
    portionEnfant: 70,
    minimumEnfant: 50,
    modeVente: "Vrac",
    quantiteParVente: 1000,
    prioriteCout: 1,
    typeProteine: "Vegetale",
    categorieCulinaire: "Sauce/legumineuse",
    compatibleAvec: commonStapleCompat,
    complementProteique: "Mais concasse",
    actif: true,
    tags: ["vegetarien"]
  },
  {
    id: "soja",
    nom: "Soja grille",
    groupeAlimentaire: "Proteines",
    role: "proteine",
    saison: "Toute saison",
    uniteAchat: "kg",
    unitePortion: "g",
    prixEstime: 1500,
    portionEnfant: 60,
    minimumEnfant: 45,
    modeVente: "Vrac",
    quantiteParVente: 1000,
    prioriteCout: 2,
    typeProteine: "Vegetale",
    categorieCulinaire: "Complement proteique",
    compatibleAvec: commonStapleCompat,
    actif: true,
    tags: ["vegetarien"]
  },
  {
    id: "oeuf",
    nom: "Oeuf",
    groupeAlimentaire: "Proteines",
    role: "proteine",
    saison: "Toute saison",
    uniteAchat: "plateau de 30",
    unitePortion: "piece",
    prixEstime: 2500,
    portionEnfant: 1,
    minimumEnfant: 1,
    modeVente: "Pre-emballe",
    quantiteParVente: 30,
    prioriteCout: 3,
    typeProteine: "Animale",
    categorieCulinaire: "Proteine visible",
    compatibleAvec: commonStapleCompat,
    actif: true,
    tags: []
  },
  {
    id: "poisson-fume",
    nom: "Poisson fume",
    groupeAlimentaire: "Proteines",
    role: "proteine",
    saison: "Toute saison",
    uniteAchat: "kg",
    unitePortion: "g",
    prixEstime: 6000,
    portionEnfant: 35,
    minimumEnfant: 25,
    modeVente: "Vrac",
    quantiteParVente: 1000,
    prioriteCout: 4,
    typeProteine: "Animale",
    categorieCulinaire: "Sauce",
    compatibleAvec: commonStapleCompat,
    actif: true,
    tags: ["poisson"]
  },
  {
    id: "poulet-local",
    nom: "Poulet local",
    groupeAlimentaire: "Proteines",
    role: "proteine",
    saison: "Toute saison",
    uniteAchat: "kg",
    unitePortion: "g",
    prixEstime: 3500,
    portionEnfant: 45,
    minimumEnfant: 30,
    modeVente: "Vrac",
    quantiteParVente: 1000,
    prioriteCout: 5,
    typeProteine: "Animale",
    categorieCulinaire: "Sauce",
    compatibleAvec: commonStapleCompat,
    actif: true,
    tags: ["viande"]
  },
  {
    id: "arachide",
    nom: "Pate d'arachide",
    groupeAlimentaire: "Proteines",
    role: "proteine",
    saison: "Toute saison",
    uniteAchat: "kg",
    unitePortion: "g",
    prixEstime: 1800,
    portionEnfant: 30,
    minimumEnfant: 20,
    modeVente: "Vrac",
    quantiteParVente: 1000,
    prioriteCout: 2,
    typeProteine: "Vegetale",
    categorieCulinaire: "Sauce",
    compatibleAvec: commonStapleCompat,
    actif: true,
    tags: ["arachide", "vegetarien"]
  },
  {
    id: "banane",
    nom: "Banane",
    groupeAlimentaire: "Fruits",
    role: "fruit",
    saison: "Toute saison",
    uniteAchat: "piece",
    unitePortion: "piece",
    prixEstime: 75,
    portionEnfant: 1,
    minimumEnfant: 1,
    modeVente: "Unitaire",
    quantiteParVente: 1,
    prioriteCout: 1,
    typeProteine: null,
    categorieCulinaire: "Dessert",
    compatibleAvec: commonStapleCompat,
    actif: true,
    tags: []
  },
  {
    id: "orange",
    nom: "Orange",
    groupeAlimentaire: "Fruits",
    role: "fruit",
    saison: "Seche",
    uniteAchat: "piece",
    unitePortion: "piece",
    prixEstime: 100,
    portionEnfant: 1,
    minimumEnfant: 1,
    modeVente: "Unitaire",
    quantiteParVente: 1,
    prioriteCout: 2,
    typeProteine: null,
    categorieCulinaire: "Dessert",
    compatibleAvec: commonStapleCompat,
    actif: true,
    tags: []
  },
  {
    id: "mangue",
    nom: "Mangue",
    groupeAlimentaire: "Fruits",
    role: "fruit",
    saison: "Seche",
    uniteAchat: "piece",
    unitePortion: "piece",
    prixEstime: 60,
    portionEnfant: 1,
    minimumEnfant: 1,
    modeVente: "Unitaire",
    quantiteParVente: 1,
    prioriteCout: 1,
    typeProteine: null,
    categorieCulinaire: "Dessert",
    compatibleAvec: commonStapleCompat,
    actif: true,
    tags: []
  },
  {
    id: "papaye",
    nom: "Papaye",
    groupeAlimentaire: "Fruits",
    role: "fruit",
    saison: "Pluies",
    uniteAchat: "piece",
    unitePortion: "piece",
    prixEstime: 150,
    portionEnfant: 0.5,
    minimumEnfant: 0.5,
    modeVente: "Unitaire",
    quantiteParVente: 1,
    prioriteCout: 2,
    typeProteine: null,
    categorieCulinaire: "Dessert",
    compatibleAvec: commonStapleCompat,
    actif: true,
    tags: []
  },
  {
    id: "feuilles-amarante",
    nom: "Feuilles d'amarante",
    groupeAlimentaire: "Legumes/Feuilles",
    role: "vegetal",
    saison: "Toute saison",
    uniteAchat: "kg",
    unitePortion: "g",
    prixEstime: 500,
    portionEnfant: 45,
    minimumEnfant: 25,
    modeVente: "Botte/kg",
    quantiteParVente: 1000,
    prioriteCout: 1,
    typeProteine: null,
    categorieCulinaire: "Sauce feuille",
    compatibleAvec: commonStapleCompat,
    actif: true,
    tags: []
  },
  {
    id: "tomate",
    nom: "Tomate",
    groupeAlimentaire: "Legumes/Feuilles",
    role: "vegetal",
    saison: "Toute saison",
    uniteAchat: "kg",
    unitePortion: "g",
    prixEstime: 800,
    portionEnfant: 35,
    minimumEnfant: 20,
    modeVente: "Vrac",
    quantiteParVente: 1000,
    prioriteCout: 2,
    typeProteine: null,
    categorieCulinaire: "Sauce",
    compatibleAvec: commonStapleCompat,
    actif: true,
    tags: []
  },
  {
    id: "gombo",
    nom: "Gombo",
    groupeAlimentaire: "Legumes/Feuilles",
    role: "vegetal",
    saison: "Pluies",
    uniteAchat: "kg",
    unitePortion: "g",
    prixEstime: 700,
    portionEnfant: 35,
    minimumEnfant: 20,
    modeVente: "Vrac",
    quantiteParVente: 1000,
    prioriteCout: 2,
    typeProteine: null,
    categorieCulinaire: "Sauce",
    compatibleAvec: commonStapleCompat,
    actif: true,
    tags: []
  },
  {
    id: "carotte",
    nom: "Carotte",
    groupeAlimentaire: "Legumes/Feuilles",
    role: "vegetal",
    saison: "Seche",
    uniteAchat: "kg",
    unitePortion: "g",
    prixEstime: 900,
    portionEnfant: 30,
    minimumEnfant: 20,
    modeVente: "Vrac",
    quantiteParVente: 1000,
    prioriteCout: 3,
    typeProteine: null,
    categorieCulinaire: "Crudite/sauce",
    compatibleAvec: commonStapleCompat,
    actif: true,
    tags: []
  },
  {
    id: "chou",
    nom: "Chou",
    groupeAlimentaire: "Legumes/Feuilles",
    role: "vegetal",
    saison: "Toute saison",
    uniteAchat: "kg",
    unitePortion: "g",
    prixEstime: 600,
    portionEnfant: 40,
    minimumEnfant: 25,
    modeVente: "Vrac",
    quantiteParVente: 1000,
    prioriteCout: 2,
    typeProteine: null,
    categorieCulinaire: "Legume d'accompagnement",
    compatibleAvec: commonStapleCompat,
    actif: true,
    tags: []
  }
];

export function generateMenu(entree: PlanInput, foodBase: Food[] = foods): MenuResult {
  const normalized = normalizeInput(entree);
  const lignes: MenuLine[] = [];

  for (let jour = 1; jour <= normalized.dureeJours; jour += 1) {
    const selected: Food[] = [];

    (["energetique", "proteine", "fruit", "vegetal"] as FoodRole[]).forEach((role, roleIndex) => {
      const candidates = filterFoods(normalized, role, foodBase);
      const food = pickFood(candidates, selected, jour + roleIndex);
      if (!food) {
        return;
      }

      selected.push(food);
      lignes.push(createMenuLine(normalized, jour, role, food));
    });
  }

  return rebuildMenuResult(normalized, lignes);
}

export function rebuildMenuResult(entree: PlanInput, lignes: MenuLine[]): MenuResult {
  const normalized = normalizeInput(entree);
  const days: DayMenu[] = Array.from({ length: normalized.dureeJours }, (_, index) => {
    const jour = index + 1;
    const dayLines = lignes.filter((line) => line.jour === jour);
    const coutJournalier = roundMoney(dayLines.reduce((sum, line) => sum + line.coutLigne, 0));
    const dayChecks = evaluateDay(dayLines);
    const statut = summarizeStatus(dayChecks.map((check) => check.statut));
    return {
      jour,
      lignes: dayLines,
      coutJournalier,
      statut
    };
  });

  const coutTotal = roundMoney(lignes.reduce((sum, line) => sum + line.coutLigne, 0));
  const ecartBudget = roundMoney(normalized.budgetTotal - coutTotal);
  const utilisationBudget = normalized.budgetTotal > 0 ? Math.round((coutTotal / normalized.budgetTotal) * 100) : 0;
  const verifications = buildVerificationChecks(normalized, lignes, coutTotal);
  const statut = summarizeStatus(verifications.map((check) => check.statut));

  return {
    entree: normalized,
    lignes,
    jours: days,
    listeAchats: buildShoppingList(lignes),
    verifications,
    statut,
    coutTotal,
    ecartBudget,
    coutParEnfant: normalized.nombreEnfants > 0 ? roundMoney(coutTotal / normalized.nombreEnfants) : 0,
    utilisationBudget,
    genereLe: new Date().toISOString(),
    explications: buildExplanations(normalized, coutTotal, ecartBudget, statut)
  };
}

export function createMenuLine(entree: PlanInput, jour: number, role: FoodRole, aliment: Food): MenuLine {
  const multiplier = ageMultipliers[entree.trancheAge] ?? 1;
  const basePortion =
    aliment.unitePortion === "piece" ? aliment.portionEnfant : Math.round((aliment.portionEnfant * multiplier) / 5) * 5;
  const quantiteParEnfant = Math.max(aliment.minimumEnfant, basePortion);
  const quantiteTotale = roundQuantity(quantiteParEnfant * entree.nombreEnfants);
  const quantiteAchat = Math.ceil(quantiteTotale / aliment.quantiteParVente) * aliment.quantiteParVente;
  const surplus = roundQuantity(quantiteAchat - quantiteTotale);
  const coutLigne = roundMoney((quantiteAchat / aliment.quantiteParVente) * aliment.prixEstime);

  return {
    id: `${jour}-${role}`,
    jour,
    alimentId: aliment.id,
    aliment,
    role,
    quantiteParEnfant,
    quantiteTotale,
    quantiteAchat,
    surplus,
    coutLigne,
    explication: `${aliment.nom} couvre le role ${roleLabels[role].toLowerCase()} avec une priorite cout ${aliment.prioriteCout}/5.`
  };
}

export function getReplacementOptions(
  entree: PlanInput,
  line: MenuLine,
  allLines: MenuLine[],
  foodBase: Food[] = foods
): Food[] {
  const otherDayFoods = allLines
    .filter((item) => item.jour === line.jour && item.id !== line.id)
    .map((item) => item.aliment);

  return filterFoods(entree, line.role, foodBase).filter((food) => isCompatibleWithSelected(food, otherDayFoods));
}

export function filterFoods(entree: PlanInput, role?: FoodRole, foodBase: Food[] = foods): Food[] {
  return foodBase
    .filter((food) => {
      if (!food.actif) {
        return false;
      }

      if (role && food.role !== role) {
        return false;
      }

      if (entree.saison !== "Aucune" && food.saison !== "Toute saison" && food.saison !== entree.saison) {
        return false;
      }

      if (entree.contraintes.includes("sans porc") && food.tags.includes("porc")) {
        return false;
      }

      if (entree.contraintes.includes("sans poisson") && food.tags.includes("poisson")) {
        return false;
      }

      if (entree.contraintes.includes("allergie arachide") && food.tags.includes("arachide")) {
        return false;
      }

      if (entree.contraintes.includes("vegetarien") && food.typeProteine === "Animale") {
        return false;
      }

      return true;
    })
    .sort((a, b) => a.prioriteCout - b.prioriteCout || a.prixEstime - b.prixEstime);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
    style: "currency",
    currency: "XOF"
  }).format(value);
}

export function formatPortion(food: Food, quantity: number): string {
  if (food.unitePortion === "piece") {
    return `${trimNumber(quantity)} piece${quantity > 1 ? "s" : ""}`;
  }

  return `${trimNumber(quantity)} g`;
}

export function formatPurchaseQuantity(food: Food, quantity: number): string {
  if (food.uniteAchat === "kg") {
    return `${trimNumber(quantity / 1000)} kg`;
  }

  if (food.quantiteParVente > 1) {
    return `${trimNumber(quantity / food.quantiteParVente)} ${food.uniteAchat}`;
  }

  return `${trimNumber(quantity)} ${food.uniteAchat}${quantity > 1 && food.uniteAchat === "piece" ? "s" : ""}`;
}

function normalizeInput(entree: PlanInput): PlanInput {
  return {
    ...entree,
    nombreEnfants: Math.max(1, Math.round(entree.nombreEnfants || 1)),
    budgetTotal: Math.max(0, Math.round(entree.budgetTotal || 0)),
    dureeJours: Math.min(30, Math.max(1, Math.round(entree.dureeJours || 1)))
  };
}

function pickFood(candidates: Food[], selected: Food[], seed: number): Food | undefined {
  const compatible = candidates.filter((candidate) => isCompatibleWithSelected(candidate, selected));
  const pool = compatible.length > 0 ? compatible : candidates;
  if (pool.length === 0) {
    return undefined;
  }

  return pool[(seed - 1) % pool.length];
}

function isCompatibleWithSelected(food: Food, selected: Food[]): boolean {
  return selected.every(
    (otherFood) => food.compatibleAvec.includes(otherFood.id) || otherFood.compatibleAvec.includes(food.id)
  );
}

function evaluateDay(lignes: MenuLine[]): VerificationCheck[] {
  const hasRole = (role: FoodRole) => lignes.some((line) => line.role === role);
  const compatible = lignes.every((line, index) =>
    lignes.slice(index + 1).every((nextLine) => isCompatibleWithSelected(line.aliment, [nextLine.aliment]))
  );

  return [
    {
      code: "RM-01",
      libelle: "Aliment energetique",
      statut: hasRole("energetique") ? "Conforme" : "Non conforme",
      detail: hasRole("energetique") ? "Un aliment de base est present." : "Aucun aliment energetique n'a ete trouve."
    },
    {
      code: "RM-02",
      libelle: "Proteine visible",
      statut: hasRole("proteine") ? "Conforme" : "Non conforme",
      detail: hasRole("proteine") ? "Une source de proteine est incluse." : "Aucune proteine visible n'a ete trouvee."
    },
    {
      code: "RM-03",
      libelle: "Fruit obligatoire",
      statut: hasRole("fruit") ? "Conforme" : "Non conforme",
      detail: hasRole("fruit") ? "Une portion de fruit est planifiee." : "Aucun fruit n'a ete trouve."
    },
    {
      code: "RM-04",
      libelle: "Apport vegetal",
      statut: hasRole("vegetal") ? "Conforme" : "Attention",
      detail: hasRole("vegetal") ? "Un apport vegetal accompagne le repas." : "Ajouter un legume ou une feuille."
    },
    {
      code: "RM-05",
      libelle: "Compatibilite culinaire",
      statut: compatible ? "Conforme" : "Non conforme",
      detail: compatible ? "Les associations sont marquees compatibles." : "Une association culinaire doit etre verifiee."
    }
  ];
}

function buildVerificationChecks(entree: PlanInput, lignes: MenuLine[], coutTotal: number): VerificationCheck[] {
  const dayChecks = Array.from({ length: entree.dureeJours }, (_, index) =>
    evaluateDay(lignes.filter((line) => line.jour === index + 1))
  ).flat();

  const everyCode = (code: string) => dayChecks.filter((check) => check.code === code);
  const byRule = ["RM-01", "RM-02", "RM-03", "RM-04", "RM-05"].map((code) => {
    const checks = everyCode(code);
    const template = checks[0];
    const status = summarizeStatus(checks.map((check) => check.statut));
    return {
      code,
      libelle: template?.libelle ?? code,
      statut: status,
      detail:
        status === "Conforme"
          ? `Regle respectee sur ${entree.dureeJours} jour${entree.dureeJours > 1 ? "s" : ""}.`
          : `Verification necessaire sur au moins un jour du menu.`
    };
  });

  const budgetStatus: Status =
    coutTotal <= entree.budgetTotal ? "Conforme" : coutTotal <= entree.budgetTotal * 1.05 ? "Attention" : "Non conforme";

  return [
    ...byRule,
    {
      code: "RM-06",
      libelle: "Budget",
      statut: budgetStatus,
      detail:
        budgetStatus === "Conforme"
          ? "Le cout calcule reste dans l'enveloppe saisie."
          : "Le cout calcule depasse le budget saisi."
    }
  ];
}

function buildShoppingList(lignes: MenuLine[]): ShoppingItem[] {
  const map = new Map<string, ShoppingItem>();

  lignes.forEach((line) => {
    const current =
      map.get(line.alimentId) ??
      ({
        aliment: line.aliment,
        quantiteTotale: 0,
        quantiteAchat: 0,
        surplus: 0,
        coutTotal: 0
      } satisfies ShoppingItem);

    current.quantiteTotale = roundQuantity(current.quantiteTotale + line.quantiteTotale);
    current.quantiteAchat = roundQuantity(current.quantiteAchat + line.quantiteAchat);
    current.surplus = roundQuantity(current.surplus + line.surplus);
    current.coutTotal = roundMoney(current.coutTotal + line.coutLigne);
    map.set(line.alimentId, current);
  });

  return Array.from(map.values()).sort((a, b) => a.aliment.role.localeCompare(b.aliment.role));
}

function summarizeStatus(statuses: Status[]): Status {
  if (statuses.includes("Non conforme")) {
    return "Non conforme";
  }

  if (statuses.includes("Attention")) {
    return "Attention";
  }

  return "Conforme";
}

function buildExplanations(entree: PlanInput, coutTotal: number, ecartBudget: number, statut: Status): string[] {
  const saisonText =
    entree.saison === "Aucune"
      ? "tous les aliments actifs, sans filtre saisonnier"
      : `les aliments actifs disponibles en saison ${entree.saison.toLowerCase()} ou toute saison`;
  const contraintesText =
    entree.contraintes.length > 0 ? entree.contraintes.join(", ") : "aucune contrainte alimentaire";

  return [
    `Selection basee sur ${saisonText}, avec ${contraintesText}.`,
    `Les quantites sont calculees par enfant puis arrondies a l'unite de vente disponible.`,
    ecartBudget >= 0
      ? `Le menu conserve une marge de ${formatCurrency(ecartBudget)} sur le budget.`
      : `Le menu depasse le budget de ${formatCurrency(Math.abs(ecartBudget))}; remplacer une proteine couteuse peut reduire l'ecart.`,
    statut === "Conforme"
      ? "Les controles obligatoires sont satisfaits pour la proposition courante."
      : "Une verification humaine reste necessaire avant validation terrain."
  ];
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
