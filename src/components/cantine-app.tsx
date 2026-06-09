"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChefHat,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Leaf,
  PackageCheck,
  Printer,
  RefreshCw,
  Replace,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
  Users,
  WalletCards,
  XCircle,
  type LucideIcon
} from "lucide-react";
import {
  constraints,
  createMenuLine,
  foods,
  formatCurrency,
  formatPortion,
  formatPurchaseQuantity,
  generateMenu,
  getReplacementOptions,
  rebuildMenuResult,
  roleLabels
} from "@/lib/cantine-engine";
import type { Constraint, Food, FoodRole, MenuLine, PlanInput, Status } from "@/lib/cantine-engine";

type Tab = "planification" | "menu" | "achats" | "rapport" | "admin";

type ReplacementNote = {
  titre: string;
  detail: string;
  statut: Status;
};

type FoodImportCache = {
  fileName: string;
  importedAt: string;
  foods: Food[];
};

type ImportedFood = Food & {
  rawCompatible: string;
};

const initialInput: PlanInput = {
  nombreEnfants: 120,
  trancheAge: "6-10 ans",
  budgetTotal: 210000,
  dureeJours: 5,
  contraintes: ["sans porc"],
  saison: "Aucune"
};

const FOOD_CACHE_KEY = "cantine-intelligente-food-base-v1";

const tabs: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "planification", label: "Planification", icon: SlidersHorizontal },
  { id: "menu", label: "Menu genere", icon: ChefHat },
  { id: "achats", label: "Achats", icon: PackageCheck },
  { id: "rapport", label: "Rapport", icon: ClipboardList },
  { id: "admin", label: "Admin", icon: ShieldCheck }
];

const roleClasses: Record<FoodRole, string> = {
  energetique: "border-orange-200 bg-orange-50 text-orange-800",
  proteine: "border-emerald-200 bg-emerald-50 text-emerald-800",
  fruit: "border-sky-200 bg-sky-50 text-sky-800",
  vegetal: "border-lime-200 bg-lime-50 text-lime-800",
  autre: "border-slate-200 bg-slate-50 text-slate-700"
};

const statusClasses: Record<Status, string> = {
  Conforme: "border-green-200 bg-green-50 text-green-700",
  Attention: "border-amber-200 bg-amber-50 text-amber-700",
  "Non conforme": "border-red-200 bg-red-50 text-red-700"
};

export function CantineApp() {
  const [input, setInput] = useState<PlanInput>(initialInput);
  const [result, setResult] = useState(() => generateMenu(initialInput));
  const [foodBase, setFoodBase] = useState<Food[]>(foods);
  const [foodSource, setFoodSource] = useState("Base locale de demonstration");
  const [activeTab, setActiveTab] = useState<Tab>("planification");
  const [replacementNote, setReplacementNote] = useState<ReplacementNote | undefined>();
  const [adminSearch, setAdminSearch] = useState("");
  const [adminRole, setAdminRole] = useState<FoodRole | "Tous">("Tous");
  const [importReport, setImportReport] = useState("Aucun fichier importe dans cette session.");
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    function syncHash() {
      const hash = window.location.hash.replace("#", "");
      if (tabs.some((tab) => tab.id === hash)) {
        setActiveTab(hash as Tab);
      }
    }

    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => {
    try {
      const cached = window.localStorage.getItem(FOOD_CACHE_KEY);
      if (!cached) {
        return;
      }

      const parsed = JSON.parse(cached) as FoodImportCache;
      if (!Array.isArray(parsed.foods) || parsed.foods.length === 0) {
        return;
      }

      setFoodBase(parsed.foods);
      setFoodSource(`Base importee: ${parsed.fileName}`);
      setImportReport(
        `${parsed.fileName} charge depuis ce navigateur (${parsed.foods.filter((food) => food.actif).length} aliments utilisables).`
      );
      setResult(generateMenu(initialInput, parsed.foods));
    } catch {
      window.localStorage.removeItem(FOOD_CACHE_KEY);
    }
  }, []);

  const filteredFoods = useMemo(() => {
    const search = adminSearch.trim().toLowerCase();
    return foodBase.filter((food) => {
      const matchesRole = adminRole === "Tous" || food.role === adminRole;
      const matchesSearch =
        search.length === 0 ||
        `${food.nom} ${food.groupeAlimentaire} ${food.categorieCulinaire}`.toLowerCase().includes(search);
      return matchesRole && matchesSearch;
    });
  }, [adminRole, adminSearch, foodBase]);

  const budgetBarClass =
    result.statut === "Non conforme"
      ? "bg-red-600"
      : result.statut === "Attention"
        ? "bg-amber-500"
        : "bg-green-600";

  function updateInput<K extends keyof PlanInput>(key: K, value: PlanInput[K]) {
    setInput((current) => ({
      ...current,
      [key]: value
    }));
  }

  function toggleConstraint(constraint: Constraint) {
    setInput((current) => ({
      ...current,
      contraintes: current.contraintes.includes(constraint)
        ? current.contraintes.filter((item) => item !== constraint)
        : [...current.contraintes, constraint]
    }));
  }

  function regenerate() {
    const nextResult = generateMenu(input, foodBase);
    setResult(nextResult);
    setReplacementNote(undefined);
    setActiveTab("menu");
    window.history.replaceState(null, "", "#menu");
  }

  function openTab(tab: Tab) {
    setActiveTab(tab);
    window.history.replaceState(null, "", `#${tab}`);
  }

  function replaceFood(line: MenuLine, foodId: string) {
    const nextFood = foodBase.find((food) => food.id === foodId);
    if (!nextFood || nextFood.id === line.alimentId) {
      return;
    }

    const nextLine = createMenuLine(result.entree, line.jour, line.role, nextFood);
    const nextLines = result.lignes.map((item) => (item.id === line.id ? nextLine : item));
    const nextResult = rebuildMenuResult(result.entree, nextLines);
    const diff = nextLine.coutLigne - line.coutLigne;
    const direction = diff > 0 ? "augmente" : diff < 0 ? "reduit" : "ne change pas";

    setResult(nextResult);
    setReplacementNote({
      titre: `${line.aliment.nom} -> ${nextFood.nom}`,
      detail:
        diff === 0
          ? "Le cout de cette ligne reste stable et les controles sont recalcules."
          : `Le remplacement ${direction} le cout de la ligne de ${formatCurrency(Math.abs(diff))}.`,
      statut: nextResult.statut
    });
  }

  function downloadCsv() {
    const header = [
      "Jour",
      "Role nutritionnel",
      "Aliment",
      "Quantite par enfant",
      "Quantite totale",
      "Quantite achat",
      "Cout ligne"
    ];
    const rows = result.lignes.map((line) => [
      line.jour,
      roleLabels[line.role],
      line.aliment.nom,
      formatPortion(line.aliment, line.quantiteParEnfant),
      formatPortion(line.aliment, line.quantiteTotale),
      formatPurchaseQuantity(line.aliment, line.quantiteAchat),
      line.coutLigne
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(";")).join("\n");
    const blob = new Blob([String.fromCharCode(0xfeff), csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cantine-intelligente-menu-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(file: File | undefined) {
    if (!file) {
      setImportReport("Aucun fichier selectionne.");
      return;
    }

    const isSpreadsheet = /\.(xlsx|xls|csv)$/i.test(file.name);
    if (!isSpreadsheet) {
      setImportReport(`${file.name} refuse: format attendu .xlsx, .xls ou .csv.`);
      return;
    }

    setImporting(true);
    try {
      const importedFoods = await readFoodsFromSpreadsheet(file);
      const usable = importedFoods.filter((food) => food.actif);
      if (usable.filter((food) => food.role === "energetique").length === 0) {
        throw new Error("aucun aliment energetique utilisable n'a ete trouve.");
      }
      if (usable.filter((food) => food.role === "proteine").length === 0) {
        throw new Error("aucune proteine utilisable n'a ete trouvee.");
      }
      if (usable.filter((food) => food.role === "fruit").length === 0) {
        throw new Error("aucun fruit utilisable n'a ete trouve.");
      }
      if (usable.filter((food) => food.role === "vegetal").length === 0) {
        throw new Error("aucun legume utilisable n'a ete trouve.");
      }

      const importedAt = new Date().toISOString();
      window.localStorage.setItem(
        FOOD_CACHE_KEY,
        JSON.stringify({
          fileName: file.name,
          importedAt,
          foods: importedFoods
        } satisfies FoodImportCache)
      );

      setFoodBase(importedFoods);
      setFoodSource(`Base importee: ${file.name}`);
      setImportReport(
        `${file.name} importe: ${usable.length} aliments utilisables sur ${importedFoods.length} lignes de Base_Aliments.`
      );
      setResult(generateMenu(input, importedFoods));
      setReplacementNote(undefined);
    } catch (error) {
      setImportReport(`Import impossible: ${error instanceof Error ? error.message : "format non reconnu."}`);
    } finally {
      setImporting(false);
    }
  }

  function restoreDemoBase() {
    window.localStorage.removeItem(FOOD_CACHE_KEY);
    setFoodBase(foods);
    setFoodSource("Base locale de demonstration");
    setImportReport("Base de demonstration restauree.");
    setResult(generateMenu(input, foods));
    setReplacementNote(undefined);
  }

  return (
    <div className="space-y-6">
      <section className="border-b border-slate-200 pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Planification alimentaire scolaire
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950 sm:text-4xl">
              Cantine Intelligente
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Proposition d'aide a la decision basee sur une base alimentaire locale, un budget saisi et des regles
              nutritionnelles explicites.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={downloadCsv} className="bouton-secondaire" title="Exporter le menu en CSV">
              <Download size={17} aria-hidden="true" />
              CSV
            </button>
            <button type="button" onClick={() => window.print()} className="bouton-secondaire" title="Imprimer">
              <Printer size={17} aria-hidden="true" />
              PDF
            </button>
            <button type="button" onClick={regenerate} className="bouton-primaire" title="Generer un menu">
              <RefreshCw size={17} aria-hidden="true" />
              Generer
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Indicateurs principaux">
        <MetricCard
          icon={CheckCircle2}
          label="Conformite"
          value={result.statut}
          detail={`${result.verifications.filter((check) => check.statut === "Conforme").length}/${
            result.verifications.length
          } controles OK`}
          tone={result.statut}
        />
        <MetricCard
          icon={WalletCards}
          label="Budget utilise"
          value={`${result.utilisationBudget}%`}
          detail={`${formatCurrency(result.coutTotal)} sur ${formatCurrency(result.entree.budgetTotal)}`}
          tone={result.ecartBudget >= 0 ? "Conforme" : "Non conforme"}
        />
        <MetricCard
          icon={Users}
          label="Effectif"
          value={`${result.entree.nombreEnfants} enfants`}
          detail={`${result.entree.trancheAge}, ${result.entree.dureeJours} jours`}
          tone="Conforme"
        />
        <MetricCard
          icon={BarChart3}
          label="Cout par enfant"
          value={formatCurrency(result.coutParEnfant)}
          detail={result.ecartBudget >= 0 ? `Marge ${formatCurrency(result.ecartBudget)}` : `Depassement ${formatCurrency(Math.abs(result.ecartBudget))}`}
          tone={result.ecartBudget >= 0 ? "Conforme" : "Attention"}
        />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Vues de l'application">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => openTab(tab.id)}
                className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${
                  active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <Icon size={16} aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {activeTab === "planification" ? (
        <section id="planification" className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <form
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            onSubmit={(event) => {
              event.preventDefault();
              regenerate();
            }}
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-950">Contexte de planification</h2>
                <p className="mt-1 text-sm text-slate-500">Parametres obligatoires du menu.</p>
              </div>
              <ChefHat className="text-[#1B6CA8]" size={24} aria-hidden="true" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre d'enfants">
                <input
                  className="champ"
                  min={1}
                  type="number"
                  value={input.nombreEnfants}
                  onChange={(event) => updateInput("nombreEnfants", Number(event.target.value))}
                />
              </Field>

              <Field label="Tranche d'age">
                <select
                  className="champ"
                  value={input.trancheAge}
                  onChange={(event) => updateInput("trancheAge", event.target.value as PlanInput["trancheAge"])}
                >
                  <option>3-6 ans</option>
                  <option>6-10 ans</option>
                  <option>10-15 ans</option>
                </select>
              </Field>

              <Field label="Budget total">
                <input
                  className="champ"
                  min={0}
                  step={500}
                  type="number"
                  value={input.budgetTotal}
                  onChange={(event) => updateInput("budgetTotal", Number(event.target.value))}
                />
              </Field>

              <Field label="Duree du menu">
                <input
                  className="champ"
                  max={30}
                  min={1}
                  type="number"
                  value={input.dureeJours}
                  onChange={(event) => updateInput("dureeJours", Number(event.target.value))}
                />
              </Field>

              <Field label="Saison">
                <select
                  className="champ"
                  value={input.saison}
                  onChange={(event) => updateInput("saison", event.target.value as PlanInput["saison"])}
                >
                  <option>Aucune</option>
                  <option>Seche</option>
                  <option>Pluies</option>
                </select>
              </Field>
            </div>

            <fieldset className="mt-5">
              <legend className="mb-2 text-sm font-bold text-slate-700">Contraintes alimentaires</legend>
              <div className="flex flex-wrap gap-2">
                {constraints.map((constraint) => {
                  const checked = input.contraintes.includes(constraint);
                  return (
                    <label
                      key={constraint}
                      className={`inline-flex min-h-[40px] cursor-pointer items-center rounded-lg border px-3 py-2 text-sm font-bold transition ${
                        checked
                          ? "border-[#2E8B57] bg-green-50 text-[#246c45]"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <input
                        checked={checked}
                        className="sr-only"
                        type="checkbox"
                        onChange={() => toggleConstraint(constraint)}
                      />
                      {constraint}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="submit" className="bouton-primaire">
                <ChefHat size={17} aria-hidden="true" />
                Generer le menu
              </button>
              <button
                type="button"
                className="bouton-secondaire"
                onClick={() => {
                  setInput(initialInput);
                  const nextResult = generateMenu(initialInput, foodBase);
                  setResult(nextResult);
                  setReplacementNote(undefined);
                }}
              >
                <RefreshCw size={17} aria-hidden="true" />
                Reinitialiser
              </button>
            </div>
          </form>

          <aside className="space-y-5">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-black text-slate-950">Synthese courante</h2>
                <StatusBadge status={result.statut} />
              </div>
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-sm font-bold text-slate-700">
                  <span>Budget</span>
                  <span>{result.utilisationBudget}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${budgetBarClass}`}
                    style={{ width: `${Math.min(100, result.utilisationBudget)}%` }}
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="font-bold text-slate-500">Cout total</p>
                    <p className="mt-1 text-lg font-black text-slate-950">{formatCurrency(result.coutTotal)}</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-500">Ecart budget</p>
                    <p className={`mt-1 text-lg font-black ${result.ecartBudget >= 0 ? "text-green-700" : "text-red-700"}`}>
                      {formatCurrency(result.ecartBudget)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
              Les menus generes par Cantine Intelligente sont des propositions d'aide a la decision. Ils ne remplacent
              pas l'avis d'un nutritionniste qualifie.
            </div>
          </aside>
        </section>
      ) : null}

      {activeTab === "menu" ? (
        <section id="menu" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Menu genere</h2>
              <p className="mt-1 text-sm text-slate-500">
                Generation du {new Date(result.genereLe).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
            <StatusBadge status={result.statut} />
          </div>

          {replacementNote ? (
            <div className={`rounded-lg border p-4 text-sm ${statusClasses[replacementNote.statut]}`}>
              <div className="flex items-start gap-3">
                <Replace size={18} aria-hidden="true" />
                <div>
                  <p className="font-black">{replacementNote.titre}</p>
                  <p className="mt-1">{replacementNote.detail}</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-2">
            {result.jours.map((day) => (
              <article key={day.jour} className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                  <div>
                    <h3 className="font-black text-slate-950">Jour {day.jour}</h3>
                    <p className="text-sm font-semibold text-slate-500">{formatCurrency(day.coutJournalier)}</p>
                  </div>
                  <StatusBadge status={day.statut} compact />
                </div>

                <div className="divide-y divide-slate-100">
                  {day.lignes.map((line) => {
                    const options = getReplacementOptions(result.entree, line, result.lignes, foodBase);
                    return (
                      <div key={line.id} className="grid gap-3 px-4 py-3 md:grid-cols-[120px_minmax(0,1fr)_120px_110px] md:items-center">
                        <span className={`inline-flex w-fit rounded-lg border px-2.5 py-1 text-xs font-black ${roleClasses[line.role]}`}>
                          {roleLabels[line.role]}
                        </span>
                        <select
                          className="champ min-h-[40px] py-2"
                          value={line.alimentId}
                          onChange={(event) => replaceFood(line, event.target.value)}
                        >
                          {options.map((food) => (
                            <option key={food.id} value={food.id}>
                              {food.nom}
                            </option>
                          ))}
                        </select>
                        <span className="text-sm font-bold text-slate-600">{formatPortion(line.aliment, line.quantiteParEnfant)}</span>
                        <span className="text-sm font-black text-slate-950">{formatCurrency(line.coutLigne)}</span>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "achats" ? (
        <section id="achats" className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Liste des achats</h2>
              <p className="mt-1 text-sm text-slate-500">Quantites agregees pour le menu courant.</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-500">Total</p>
              <p className="text-xl font-black text-slate-950">{formatCurrency(result.coutTotal)}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-5 py-3">Aliment</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Besoin</th>
                  <th className="px-5 py-3">A acheter</th>
                  <th className="px-5 py-3">Surplus</th>
                  <th className="px-5 py-3">Cout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.listeAchats.map((item) => (
                  <tr key={item.aliment.id}>
                    <td className="px-5 py-3 font-bold text-slate-950">{item.aliment.nom}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-lg border px-2 py-1 text-xs font-black ${roleClasses[item.aliment.role]}`}>
                        {roleLabels[item.aliment.role]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{formatPortion(item.aliment, item.quantiteTotale)}</td>
                    <td className="px-5 py-3 font-bold text-slate-700">{formatPurchaseQuantity(item.aliment, item.quantiteAchat)}</td>
                    <td className="px-5 py-3 text-slate-600">{formatPortion(item.aliment, item.surplus)}</td>
                    <td className="px-5 py-3 font-black text-slate-950">{formatCurrency(item.coutTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activeTab === "rapport" ? (
        <section id="rapport" className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h2 className="text-2xl font-black text-slate-950">Rapport de verification</h2>
              <p className="mt-1 text-sm text-slate-500">Regles metier appliquees au menu courant.</p>
            </div>
            <div className="divide-y divide-slate-100">
              {result.verifications.map((check) => (
                <div key={check.code} className="grid gap-3 p-5 sm:grid-cols-[88px_1fr_auto] sm:items-center">
                  <span className="text-sm font-black text-slate-500">{check.code}</span>
                  <div>
                    <p className="font-black text-slate-950">{check.libelle}</p>
                    <p className="mt-1 text-sm text-slate-600">{check.detail}</p>
                  </div>
                  <StatusBadge status={check.statut} />
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <Leaf className="text-[#2E8B57]" size={22} aria-hidden="true" />
                <h3 className="text-lg font-black text-slate-950">Rapport nutritionnel</h3>
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                {(["energetique", "proteine", "fruit", "vegetal"] as FoodRole[]).map((role) => (
                  <div key={role} className="flex items-center justify-between gap-3">
                    <dt className="font-bold text-slate-600">{roleLabels[role]}</dt>
                    <dd className="font-black text-slate-950">
                      {result.lignes.filter((line) => line.role === role).length}/{result.entree.dureeJours}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black text-slate-950">Explicabilite</h3>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                {result.explications.map((explanation) => (
                  <li key={explanation} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 shrink-0 text-[#2E8B57]" size={16} aria-hidden="true" />
                    <span>{explanation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </section>
      ) : null}

      {activeTab === "admin" ? (
        <section id="admin" className="space-y-5">
          <div className="grid gap-3 md:grid-cols-3">
            <MetricCard
              icon={FileSpreadsheet}
              label="Aliments actifs"
              value={String(foodBase.filter((food) => food.actif).length)}
              detail={foodSource}
              tone="Conforme"
            />
            <MetricCard
              icon={Upload}
              label="Dernier import"
              value={foodSource.startsWith("Base importee") ? "Import OK" : "Session locale"}
              detail={importReport}
              tone="Attention"
            />
            <MetricCard icon={ShieldCheck} label="Roles" value="Admin / Utilisateur" detail="RBAC prevu sur les endpoints" tone="Conforme" />
          </div>

          <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">Import alimentaire</h2>
              <p className="mt-1 text-sm text-slate-500">Feuille lue en priorite: Base_Aliments.</p>
              <label className="mt-5 flex min-h-[132px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-sm font-bold text-slate-600 transition hover:border-[#1B6CA8] hover:bg-blue-50">
                <Upload size={24} aria-hidden="true" />
                <span className="mt-2">{importing ? "Import en cours..." : "Selectionner un fichier Excel ou CSV"}</span>
                <input
                  className="sr-only"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  disabled={importing}
                  onChange={(event) => {
                    handleImport(event.target.files?.[0]).catch(() => {
                      setImportReport("Import impossible: erreur inattendue.");
                    });
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-600">
                {importReport}
              </div>
              <button type="button" onClick={restoreDemoBase} className="bouton-secondaire mt-4 w-full">
                Restaurer la base demo
              </button>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-[1fr_220px]">
                <label className="relative block">
                  <span className="sr-only">Rechercher un aliment</span>
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    className="champ pl-10"
                    placeholder="Rechercher un aliment"
                    value={adminSearch}
                    onChange={(event) => setAdminSearch(event.target.value)}
                  />
                </label>
                <select
                  className="champ"
                  value={adminRole}
                  onChange={(event) => setAdminRole(event.target.value as FoodRole | "Tous")}
                >
                  <option>Tous</option>
                  <option value="energetique">Energie</option>
                  <option value="proteine">Proteine</option>
                  <option value="fruit">Fruit</option>
                  <option value="vegetal">Vegetal</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Aliment</th>
                      <th className="px-4 py-3">Groupe</th>
                      <th className="px-4 py-3">Saison</th>
                      <th className="px-4 py-3">Prix</th>
                      <th className="px-4 py-3">Portion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredFoods.map((food) => (
                      <tr key={food.id}>
                        <td className="px-4 py-3 font-bold text-slate-950">{food.nom}</td>
                        <td className="px-4 py-3 text-slate-600">{food.groupeAlimentaire}</td>
                        <td className="px-4 py-3 text-slate-600">{food.saison}</td>
                        <td className="px-4 py-3 font-bold text-slate-700">{formatCurrency(food.prixEstime)}</td>
                        <td className="px-4 py-3 text-slate-600">{formatPortion(food, food.portionEnfant)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone: Status;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
          <p className="mt-2 text-xl font-black text-slate-950">{value}</p>
        </div>
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border ${statusClasses[tone]}`}>
          <Icon size={18} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-sm font-medium leading-5 text-slate-600">{detail}</p>
    </article>
  );
}

function StatusBadge({ status, compact = false }: { status: Status; compact?: boolean }) {
  const Icon = status === "Conforme" ? CheckCircle2 : status === "Attention" ? AlertTriangle : XCircle;
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-black ${statusClasses[status]}`}
    >
      <Icon size={compact ? 14 : 15} aria-hidden="true" />
      {compact ? status.replace("Non conforme", "NC") : status}
    </span>
  );
}

async function readFoodsFromSpreadsheet(file: File): Promise<Food[]> {
  const XLSX = await import("xlsx");
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array" });
  const sheetName =
    workbook.SheetNames.find((name) => normalizeText(name) === "base aliments") ?? workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error("aucune feuille lisible dans le fichier.");
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  if (rows.length === 0) {
    throw new Error("la feuille Base_Aliments est vide.");
  }

  const ids = new Map<string, number>();
  const imported = rows
    .map((row) => normalizeImportedFood(row, ids))
    .filter((food): food is ImportedFood => Boolean(food));

  if (imported.length === 0) {
    throw new Error("aucune ligne alimentaire valide n'a ete trouvee.");
  }

  const coreIds = imported.filter((food) => food.actif).map((food) => food.id);
  const byId = new Map(imported.map((food) => [food.id, food]));

  return imported.map((food) => {
    const explicitCompat = splitList(food.rawCompatible)
      .map((name) => findCompatibleId(name, byId))
      .filter((id): id is string => Boolean(id));

    const compatibleAvec = Array.from(new Set([...explicitCompat, ...coreIds].filter((id) => id !== food.id)));
    const { rawCompatible: _rawCompatible, ...cleanFood } = food;
    return {
      ...cleanFood,
      compatibleAvec
    };
  });
}

function normalizeImportedFood(row: Record<string, unknown>, ids: Map<string, number>): ImportedFood | undefined {
  const nom = textCell(row, ["aliment"]);
  if (!nom) {
    return undefined;
  }

  const groupeAlimentaire = textCell(row, ["groupe alimentaire"]) || "Non classe";
  const roleText = textCell(row, ["role nutritionnel", "rôle nutritionnel"]);
  const role = mapFoodRole(groupeAlimentaire, roleText);
  const prixEstime = numberCell(row, ["prix estime fcfa", "prix estime", "prix estimé fcfa", "prix estimé"]);
  const portionEnfant = numberCell(row, ["portion standard enfant", "portion par enfant", "portion enfant"]);
  const uniteAchat = textCell(row, ["unite achat", "unité achat"]) || "unite";
  const unitePortionText = textCell(row, ["unite portion", "unité portion"]) || uniteAchat;
  const unitePortion = mapPortionUnit(unitePortionText);
  const quantiteParVente = parseSaleQuantity(
    textCell(row, ["quantite par vente", "quantité par vente"]),
    uniteAchat,
    unitePortion
  );
  const typeProteine = mapProteinType(textCell(row, ["type proteine", "type protéine"]), nom, groupeAlimentaire);
  const id = uniqueSlug(nom, ids);
  const prioriteCout = mapCostPriority(textCell(row, ["niveau de cout", "niveau de coût"]));
  const searchable = normalizeText(`${nom} ${groupeAlimentaire} ${roleText} ${typeProteine ?? ""}`);
  const tags = [
    searchable.includes("porc") ? "porc" : "",
    searchable.includes("poisson") ? "poisson" : "",
    searchable.includes("arachide") ? "arachide" : "",
    typeProteine === "Vegetale" ? "vegetarien" : ""
  ].filter(Boolean);

  return {
    id,
    nom,
    groupeAlimentaire,
    role,
    saison: mapSeason(textCell(row, ["saison"])),
    uniteAchat,
    unitePortion,
    prixEstime,
    portionEnfant,
    minimumEnfant: unitePortion === "piece" ? Math.max(0.5, portionEnfant) : Math.max(1, Math.round(portionEnfant * 0.75)),
    modeVente: textCell(row, ["mode achat", "mode dachat", "mode d’achat"]) || uniteAchat,
    quantiteParVente,
    prioriteCout,
    typeProteine,
    categorieCulinaire: textCell(row, ["categorie culinaire", "catégorie culinaire"]) || groupeAlimentaire,
    compatibleAvec: [],
    complementProteique: undefined,
    actif: role !== "autre" && prixEstime > 0 && portionEnfant > 0,
    tags,
    rawCompatible: textCell(row, ["compatible avec"])
  };
}

function textCell(row: Record<string, unknown>, labels: string[]): string {
  const entry = Object.entries(row).find(([key]) => {
    const normalizedKey = normalizeText(key);
    return labels.some((label) => normalizedKey === normalizeText(label) || normalizedKey.includes(normalizeText(label)));
  });

  const value = entry?.[1];
  return value === undefined || value === null ? "" : String(value).trim();
}

function numberCell(row: Record<string, unknown>, labels: string[]): number {
  return parseNumber(textCell(row, labels));
}

function parseNumber(value: string): number {
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  const match = normalized.match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function parseSaleQuantity(value: string, uniteAchat: string, unitePortion: "g" | "piece"): number {
  const quantity = parseNumber(value) || 1;
  const text = normalizeText(`${value} ${uniteAchat}`);

  if (text.includes("kg") || (unitePortion === "g" && normalizeText(uniteAchat).includes("kg"))) {
    return quantity * 1000;
  }

  if (text.includes("g") && !text.includes("kg")) {
    return quantity;
  }

  return quantity;
}

function mapFoodRole(group: string, roleText: string): FoodRole {
  const normalizedGroup = normalizeText(group);
  const normalizedRole = normalizeText(roleText);

  if (normalizedGroup.includes("fruit")) {
    return "fruit";
  }
  if (normalizedGroup.includes("proteine")) {
    return "proteine";
  }
  if (normalizedGroup.includes("energetique")) {
    return "energetique";
  }
  if (normalizedGroup.includes("legume")) {
    return "vegetal";
  }
  if (normalizedRole.includes("fruit")) {
    return "fruit";
  }
  if (normalizedRole.includes("proteine")) {
    return "proteine";
  }
  if (normalizedRole.includes("energie") || normalizedRole.includes("glucide")) {
    return "energetique";
  }
  if (normalizedRole.includes("legume") || normalizedRole.includes("feuille")) {
    return "vegetal";
  }

  return "autre";
}

function mapSeason(value: string): Food["saison"] {
  const normalized = normalizeText(value);
  if (normalized.includes("seche")) {
    return "Seche";
  }
  if (normalized.includes("pluie")) {
    return "Pluies";
  }
  return "Toute saison";
}

function mapPortionUnit(value: string): "g" | "piece" {
  const normalized = normalizeText(value);
  return normalized.includes("g") && !normalized.includes("piece") ? "g" : "piece";
}

function mapProteinType(value: string, name: string, group: string): Food["typeProteine"] {
  const normalized = normalizeText(`${value} ${name} ${group}`);
  if (normalized.includes("vegetale") || normalized.includes("soja") || normalized.includes("haricot")) {
    return "Vegetale";
  }
  if (
    normalized.includes("animale") ||
    normalized.includes("poisson") ||
    normalized.includes("poulet") ||
    normalized.includes("viande") ||
    normalized.includes("oeuf") ||
    normalized.includes("lait")
  ) {
    return "Animale";
  }
  return null;
}

function mapCostPriority(value: string): number {
  const normalized = normalizeText(value);
  if (normalized.includes("faible")) {
    return 1;
  }
  if (normalized.includes("moyen")) {
    return 3;
  }
  if (normalized.includes("eleve")) {
    return 5;
  }
  return Math.min(5, Math.max(1, parseNumber(value) || 3));
}

function findCompatibleId(name: string, foodsById: Map<string, ImportedFood>): string | undefined {
  const slug = slugify(name);
  if (foodsById.has(slug)) {
    return slug;
  }

  return Array.from(foodsById.values()).find((food) => {
    const foodName = normalizeText(food.nom);
    const compatibleName = normalizeText(name);
    return foodName.includes(compatibleName) || compatibleName.includes(foodName);
  })?.id;
}

function splitList(value: string): string[] {
  return value
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueSlug(value: string, ids: Map<string, number>): string {
  const base = slugify(value);
  const count = ids.get(base) ?? 0;
  ids.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}

function slugify(value: string): string {
  return normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "aliment";
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

function csvCell(value: string | number): string {
  const text = String(value).replace(/"/g, '""');
  return `"${text}"`;
}
