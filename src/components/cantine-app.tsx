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
  SlidersHorizontal,
  Users,
  WalletCards,
  XCircle,
  type LucideIcon
} from "lucide-react";
import {
  componentLabels,
  formatCurrency,
  formatPortion,
  formatPurchaseQuantity,
  formatUnitPrice,
  generateMenu,
  monthOptions,
  planningDayLabel,
  roleLabels,
  targetGroups,
  totalAdults,
  totalChildren,
  totalPeople
} from "@/lib/cantine-engine";
import type {
  CantineReference,
  DayMenu,
  FoodRole,
  MenuLine,
  MonthKey,
  PlanInput,
  Status,
  TargetGroup
} from "@/lib/cantine-engine";

type Tab = "planification" | "menu" | "achats" | "rapport";

const initialInput: PlanInput = {
  effectifs: {
    maternelle: 0,
    ciCp: 0,
    ce1Ce2: 0,
    cm1Cm2: 0,
    adulte: 0
  },
  budgetTotal: 0,
  dureeJours: 0,
  moisDisponibilite: monthOptions.map((month) => month.key)
};

const tabs: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "planification", label: "Planification", icon: SlidersHorizontal },
  { id: "menu", label: "Menu généré", icon: ChefHat },
  { id: "achats", label: "Achats", icon: PackageCheck },
  { id: "rapport", label: "Rapport", icon: ClipboardList }
];

const roleClasses: Record<FoodRole, string> = {
  energetique: "border-orange-200 bg-orange-50 text-orange-800",
  proteine: "border-emerald-200 bg-emerald-50 text-emerald-800",
  fruit: "border-sky-200 bg-sky-50 text-sky-800",
  vegetal: "border-lime-200 bg-lime-50 text-lime-800",
  autre: "border-slate-200 bg-slate-50 text-slate-700"
};
const snackClass = "border-amber-200 bg-amber-50 text-amber-800";

const statusClasses: Record<Status, string> = {
  Conforme: "border-green-200 bg-green-50 text-green-700",
  Attention: "border-amber-200 bg-amber-50 text-amber-700",
  "Non conforme": "border-red-200 bg-red-50 text-red-700"
};

const portionDiagramItems: { component: MenuLine["component"]; label: string; color: string }[] = [
  { component: "base", label: "Féculent", color: "#fb923c" },
  { component: "proteine", label: "Protéine", color: "#34d399" },
  { component: "vegetal", label: "Légume", color: "#a3e635" },
  { component: "gouter", label: "Goûter", color: "#f59e0b" }
];

export function CantineApp({ initialReference }: { initialReference: CantineReference }) {
  const [reference, setReference] = useState(initialReference);
  const [input, setInput] = useState<PlanInput>(initialInput);
  const [selectedDishes, setSelectedDishes] = useState<Record<number, string>>({});
  const [selectedSnacks, setSelectedSnacks] = useState<Record<number, string>>({});
  const [generationSeed, setGenerationSeed] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>("planification");
  const result = useMemo(
    () =>
      generateMenu(
        { ...input, generationSeed, platsChoisis: selectedDishes, goutersChoisis: selectedSnacks },
        reference
      ),
    [input, reference, generationSeed, selectedDishes, selectedSnacks]
  );
  const effectifEnfants = totalChildren(result.entree);
  const effectifAdultes = totalAdults(result.entree);
  const effectifTotal = totalPeople(result.entree);
  const budgetBarClass =
    result.statut === "Non conforme"
      ? "bg-red-600"
      : result.statut === "Attention"
        ? "bg-amber-500"
        : "bg-green-600";

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
    let cancelled = false;

    async function refreshReference() {
      try {
        const response = await fetch("/api/cantine/reference", { cache: "no-store" });
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as { reference?: CantineReference };
        if (!cancelled && data.reference) {
          setReference(data.reference);
          setSelectedDishes({});
          setSelectedSnacks({});
          setGenerationSeed((current) => current + 1);
        }
      } catch {
        // La reference fournie par le serveur reste utilisable si le rafraichissement echoue.
      }
    }

    void refreshReference();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateInput<K extends keyof PlanInput>(key: K, value: PlanInput[K]) {
    setInput((current) => ({
      ...current,
      [key]: value
    }));
  }

  function updateEffectif(target: TargetGroup, value: number) {
    setInput((current) => ({
      ...current,
      effectifs: {
        ...current.effectifs,
        [target]: Math.max(0, Math.round(value || 0))
      }
    }));
  }

  function toggleMonth(month: MonthKey) {
    setInput((current) => {
      const selected = current.moisDisponibilite.includes(month)
        ? current.moisDisponibilite.filter((item) => item !== month)
        : [...current.moisDisponibilite, month];
      return {
        ...current,
        moisDisponibilite: selected.length > 0 ? selected : [month]
      };
    });
  }

  function openTab(tab: Tab) {
    setActiveTab(tab);
    window.history.replaceState(null, "", `#${tab}`);
  }

  function generateAndOpenMenu() {
    setSelectedDishes({});
    setSelectedSnacks({});
    setGenerationSeed((current) => current + 1);
    openTab("menu");
  }

  function selectDishForDay(jour: number, dishId: string) {
    setSelectedDishes((current) => ({
      ...current,
      [jour]: dishId
    }));
  }

  function selectSnackForDay(jour: number, snackId: string) {
    setSelectedSnacks((current) => ({
      ...current,
      [jour]: snackId
    }));
  }

  function downloadCsv() {
    const header = ["Jour", "Plat valide", "Service", "Composant", "Aliment retenu", "Portions par cible"];
    const rows = result.lignes.map((line) => [
      planningDayLabel(line.jour),
      result.jours.find((jour) => jour.jour === line.jour)?.plat.nom ?? "",
      line.service === "gouter" ? "Goûter" : "Repas",
      componentLabels[line.component],
      line.aliment.nom,
      formatTargetPortions(line)
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

  return (
    <div className="space-y-6">
      <section className="border-b border-slate-200 pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Planifiez vos menus scolaires en quelques étapes simples : renseignez les effectifs, indiquez votre budget,
              choisissez la période disponible, puis générez automatiquement le menu, les achats et le rapport.
            </p>
          </div>
          <div className="no-print flex flex-wrap gap-2">
            <button type="button" onClick={downloadCsv} className="bouton-secondaire" title="Exporter le menu en CSV">
              <Download size={17} aria-hidden="true" />
              CSV
            </button>
            <button type="button" onClick={() => window.print()} className="bouton-secondaire" title="Imprimer en PDF">
              <Printer size={17} aria-hidden="true" />
              PDF
            </button>
            <button type="button" onClick={generateAndOpenMenu} className="bouton-primaire" title="Afficher le menu">
              <RefreshCw size={17} aria-hidden="true" />
              Générer
            </button>
          </div>
        </div>
      </section>

      <section className="no-print rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
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
        <section id="planification">
          <form
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            onSubmit={(event) => {
              event.preventDefault();
              generateAndOpenMenu();
            }}
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-950">Contexte de planification</h2>
                <p className="mt-1 text-sm text-slate-500">Effectifs, période, budget et disponibilité du menu.</p>
              </div>
              <ChefHat className="text-[#1B6CA8]" size={24} aria-hidden="true" />
            </div>

            <div className="space-y-6">
              <fieldset>
                <legend className="text-sm font-black uppercase tracking-[0.12em] text-slate-500">
                  Nombre d'enfants/adultes
                </legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {targetGroups.map((target) => (
                    <label key={target.key} className="block rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <span className="block text-sm font-black text-slate-950">{target.label}</span>
                      <span className="block text-xs font-semibold text-slate-500">{target.ages}</span>
                      <input
                        className="champ mt-3"
                        min={0}
                        type="number"
                        value={input.effectifs[target.key]}
                        onChange={(event) => updateEffectif(target.key, Number(event.target.value))}
                      />
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
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

                <Field label="Durée du menu">
                  <input
                    className="champ"
                    max={30}
                    min={0}
                    type="number"
                    value={input.dureeJours}
                    onChange={(event) => updateInput("dureeJours", Number(event.target.value))}
                  />
                </Field>
              </div>

              <fieldset>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-black uppercase tracking-[0.12em] text-slate-500">
                    Disponibilité
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="bouton-secondaire min-h-[36px] px-3 py-1 text-xs"
                      onClick={() => updateInput("moisDisponibilite", monthOptions.map((month) => month.key))}
                    >
                      Tous
                    </button>
                    <button
                      type="button"
                      className="bouton-secondaire min-h-[36px] px-3 py-1 text-xs"
                      onClick={() => updateInput("moisDisponibilite", [monthOptions[new Date().getMonth()].key])}
                    >
                      Mois actuel
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  {monthOptions.map((month) => {
                    const checked = input.moisDisponibilite.includes(month.key);
                    return (
                      <label
                        key={month.key}
                        className={`inline-flex min-h-[40px] cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm font-bold transition ${
                          checked
                            ? "border-[#1B6CA8] bg-blue-50 text-[#13527f]"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        <input
                          checked={checked}
                          className="sr-only"
                          type="checkbox"
                          onChange={() => toggleMonth(month.key)}
                        />
                        {month.label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="submit" className="bouton-primaire">
                <ChefHat size={17} aria-hidden="true" />
                Générer le menu
              </button>
              <button
                type="button"
                className="bouton-secondaire"
                onClick={() => {
                  setInput(initialInput);
                  setSelectedDishes({});
                  setSelectedSnacks({});
                  openTab("planification");
                }}
              >
                <RefreshCw size={17} aria-hidden="true" />
                Réinitialiser
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {activeTab === "menu" ? (
        <section id="menu" className="menu-print-area space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Menu généré</h2>
              <p className="mt-1 text-sm text-slate-500">
                Génération du {formatDateTime(result.genereLe)} depuis les plats validés du fichier.
              </p>
            </div>
          </div>

          {result.jours.length === 0 ? (
            <EmptyState
              title="Aucun menu généré"
              detail="Renseignez au moins un effectif et une durée supérieure à 0, puis cliquez sur Générer le menu."
            />
          ) : (
          <div className="menu-day-grid grid gap-4 lg:grid-cols-2">
            {result.jours.map((day) => {
              const mealLines = day.lignes.filter((line) => line.service === "repas");
              const selectedTargetGroups = targetGroups.filter((target) => result.entree.effectifs[target.key] > 0);

              return (
                <article key={day.jour} className="menu-day-card overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-slate-500">{planningDayLabel(day.jour)}</p>
                      <h3 className="mt-1 text-xl font-black text-slate-950">{day.plat.nom}</h3>
                      <label className="menu-edit-control mt-4 block max-w-xl">
                        <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                          Changer le repas du jour
                        </span>
                        <select
                          className="champ"
                          value={day.plat.id}
                          onChange={(event) => selectDishForDay(day.jour, event.target.value)}
                        >
                          {result.menusDisponibles.map((menu) => (
                            <option key={menu.id} value={menu.id}>
                              {menu.nom}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>

                  <MenuIngredientSummary lines={mealLines} />

                  <div className="border-t border-slate-100 bg-slate-50 p-4">
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Goûter proposé</p>
                        <h4 className="mt-1 text-lg font-black text-slate-950">{day.gouter?.gouter.nom ?? "Aucun goûter disponible"}</h4>
                      </div>
                    </div>

                    {result.goutersDisponibles.length > 0 ? (
                      <label className="menu-edit-control mt-3 block">
                        <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                          Changer le goûter
                        </span>
                        <select
                          className="champ"
                          value={day.gouter?.gouter.id ?? ""}
                          onChange={(event) => selectSnackForDay(day.jour, event.target.value)}
                        >
                          {result.goutersDisponibles.map((gouter) => (
                            <option key={gouter.id} value={gouter.id}>
                              {gouter.nom}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                  </div>

                  <PortionDiagrams day={day} targets={selectedTargetGroups} />

                </article>
              );
            })}
          </div>
          )}
        </section>
      ) : null}

      {activeTab === "achats" ? (
        <section id="achats" className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Liste des achats</h2>
              <p className="mt-1 text-sm text-slate-500">
                Quantités agrégées après arrondi selon l'unité d'achat du fichier.
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Total</p>
              <p className="text-xl font-black text-slate-950">{formatCurrency(result.coutTotal)}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-5 py-3">Aliment</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Besoin</th>
                  <th className="px-5 py-3">A acheter</th>
                  <th className="px-5 py-3">Surplus</th>
                  <th className="px-5 py-3">Prix référence</th>
                  <th className="px-5 py-3">Unité achat</th>
                  <th className="px-5 py-3">Coût</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.listeAchats.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center font-semibold text-slate-500">
                      Aucun achat à afficher pour le moment. Générez un menu avec une durée supérieure à 0.
                    </td>
                  </tr>
                ) : null}
                {result.listeAchats.map((item) => (
                  <tr key={item.aliment.id}>
                    <td className="px-5 py-3 font-bold text-slate-950">{item.aliment.nom}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-lg border px-2 py-1 text-xs font-black ${foodRoleClass(item.aliment)}`}>
                        {foodRoleLabel(item.aliment)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{formatPortion(item.aliment, item.quantiteTotale)}</td>
                    <td className="px-5 py-3 font-bold text-slate-700">{formatPurchaseQuantity(item.aliment, item.quantiteAchat)}</td>
                    <td className="px-5 py-3 text-slate-600">{formatPortion(item.aliment, item.surplus)}</td>
                    <td className="px-5 py-3 font-bold text-slate-700">{formatUnitPrice(item.aliment)}</td>
                    <td className="px-5 py-3 text-slate-600">
                      <span className="font-bold text-slate-700">{item.aliment.uniteAchat}</span>
                      <span className="block text-xs text-slate-500">Contenu : {item.aliment.quantiteParVenteLabel}</span>
                    </td>
                    <td className="px-5 py-3 font-black text-slate-950">{formatCurrency(item.coutTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activeTab === "rapport" ? (
        <section id="rapport" className="space-y-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Indicateurs principaux">
            <MetricCard
              icon={CheckCircle2}
              label="Conformité"
              value={result.statut}
              detail={`${result.verifications.filter((check) => check.statut === "Conforme").length}/${
                result.verifications.length
              } contrôles OK`}
              tone={result.statut}
            />
            <MetricCard
              icon={WalletCards}
              label="Budget utilisé"
              value={`${result.utilisationBudget}%`}
              detail={`${formatCurrency(result.coutTotal)} sur ${formatCurrency(result.entree.budgetTotal)}`}
              tone={result.ecartBudget >= 0 ? "Conforme" : "Non conforme"}
            />
            <MetricCard
              icon={Users}
              label="Effectif"
              value={`${effectifEnfants} enfants`}
              detail={`${effectifAdultes} adultes, ${effectifTotal} personnes, ${result.entree.dureeJours} jours`}
              tone="Conforme"
            />
            <MetricCard
              icon={BarChart3}
              label="Coût par personne"
              value={formatCurrency(result.coutParPersonne)}
              detail={
                result.ecartBudget >= 0
                  ? `Marge ${formatCurrency(result.ecartBudget)}`
                  : `Dépassement ${formatCurrency(Math.abs(result.ecartBudget))}`
              }
              tone={result.ecartBudget >= 0 ? "Conforme" : "Attention"}
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
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
                <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="font-bold text-slate-500">Coût total</p>
                    <p className="mt-1 text-lg font-black text-slate-950">{formatCurrency(result.coutTotal)}</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-500">Ecart budget</p>
                    <p className={`mt-1 text-lg font-black ${result.ecartBudget >= 0 ? "text-green-700" : "text-red-700"}`}>
                      {formatCurrency(result.ecartBudget)}
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-500">Disponibilité</p>
                    <p className="mt-1 text-lg font-black text-slate-950">
                      {result.entree.moisDisponibilite.length === monthOptions.length
                        ? "12 mois"
                        : `${result.entree.moisDisponibilite.length} mois`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="mt-1 text-[#1B6CA8]" size={22} aria-hidden="true" />
                <div>
                  <h3 className="text-lg font-black text-slate-950">Base de référence</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {result.reference.sourceName} - {result.reference.platsValides} plats valides,{" "}
                    {result.reference.goutersValides} goûters, {result.reference.alimentsActifs} aliments actifs.
                  </p>
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    Dernière base: {formatDateTime(result.reference.importedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h2 className="text-2xl font-black text-slate-950">Rapport de vérification</h2>
              <p className="mt-1 text-sm text-slate-500">Règles métier appliquées au menu courant.</p>
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
                <h3 className="text-lg font-black text-slate-950">Couverture nutritionnelle</h3>
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                {(["energetique", "proteine", "vegetal"] as FoodRole[]).map((role) => (
                  <div key={role} className="flex items-center justify-between gap-3">
                    <dt className="font-bold text-slate-600">{roleLabels[role]}</dt>
                    <dd className="font-black text-slate-950">
                      {coverageDays(result.jours, role)}/{result.entree.dureeJours}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black text-slate-950">Explicabilité</h3>
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
          </div>
        </section>
      ) : null}
    </div>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
      <p className="text-lg font-black text-slate-950">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">{detail}</p>
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

function MenuIngredientSummary({ lines }: { lines: MenuLine[] }) {
  if (lines.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-slate-100 p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Composition du repas</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {lines.map((line) => (
          <span
            key={line.id}
            className={`inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-bold text-slate-800 ${foodRoleClass(
              line.aliment
            )}`}
          >
            <span className="text-xs font-black uppercase tracking-[0.08em]">{line.componentLabel}</span>
            <span className="text-slate-950">{line.aliment.nom}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

type PortionDiagramTarget = (typeof targetGroups)[number];

type PortionDiagramEntry = {
  label: string;
  color: string;
  value: number;
  unit: string;
};

function PortionDiagrams({ day, targets }: { day: DayMenu; targets: PortionDiagramTarget[] }) {
  const diagrams = targets
    .map((target) => ({
      target,
      entries: portionEntriesForTarget(day, target)
    }))
    .filter((diagram) => diagram.entries.length > 0);

  if (diagrams.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-slate-100 bg-slate-50/70 p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Portions individuelles</p>
      <div className="menu-portions-grid mt-3 grid gap-3 sm:grid-cols-2">
        {diagrams.map(({ target, entries }) => (
          <div key={target.key} className="menu-portion-card rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-3">
              <PortionDonut label={target.label} entries={entries} />
              <div className="min-w-0 flex-1 space-y-1.5">
                {entries.map((entry) => (
                  <div key={entry.label} className="flex items-start justify-between gap-2 text-xs">
                    <span className="flex min-w-0 items-center gap-2 font-bold text-slate-600">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="truncate">{entry.label}</span>
                    </span>
                    <span className="shrink-0 text-right font-black text-slate-950">
                      {formatDiagramPortion(entry.value, entry.unit)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PortionDonut({ label, entries }: { label: string; entries: PortionDiagramEntry[] }) {
  const segment = entries.length > 0 ? 100 / entries.length : 100;
  let offset = 0;

  return (
    <svg className="menu-portion-donut h-20 w-20 shrink-0" viewBox="0 0 80 80" role="img" aria-label={"Portions " + label}>
      <circle cx="40" cy="40" r="28" fill="white" stroke="#e2e8f0" strokeWidth="12" />
      {entries.map((entry) => {
        const currentOffset = offset;
        offset += segment;
        return (
          <circle
            key={entry.label}
            cx="40"
            cy="40"
            r="28"
            fill="none"
            stroke={entry.color}
            strokeWidth="12"
            pathLength={100}
            strokeDasharray={segment + " " + (100 - segment)}
            strokeDashoffset={-currentOffset}
            transform="rotate(-90 40 40)"
          />
        );
      })}
      <circle cx="40" cy="40" r="18" fill="white" stroke="#e2e8f0" strokeWidth="1" />
      <text x="40" y="43" textAnchor="middle" className="fill-slate-700 text-[9px] font-black uppercase">
        {label}
      </text>
    </svg>
  );
}

function portionEntriesForTarget(day: DayMenu, target: PortionDiagramTarget): PortionDiagramEntry[] {
  return portionDiagramItems
    .map((item) => {
      const lines = day.lignes.filter((candidate) =>
        item.component === "gouter"
          ? candidate.service === "gouter"
          : candidate.service === "repas" && candidate.component === item.component
      );
      if (lines.length === 0) {
        return undefined;
      }

      const displayLine = lines.find((line) => (line.portionAffichee?.quantitesParCible[target.key] ?? 0) > 0);
      const value = displayLine
        ? displayLine.portionAffichee?.quantitesParCible[target.key] ?? 0
        : lines.reduce((total, line) => total + (line.quantitesParCible[target.key] ?? 0), 0);
      if (value <= 0) {
        return undefined;
      }

      const lineForUnit = displayLine ?? lines[0];
      return {
        label: item.label,
        color: item.color,
        value,
        unit: lineForUnit.portionAffichee?.uniteLabel || lineForUnit.aliment.unitePortionLabel || lineForUnit.aliment.unitePortion
      };
    })
    .filter((entry): entry is PortionDiagramEntry => Boolean(entry));
}


function formatDiagramPortion(value: number, unit: string): string {
  const cleanUnit = unit.trim() || "portion";
  return `${trimDiagramNumber(value)} ${cleanUnit}`;
}

function trimDiagramNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function foodRoleClass(food: MenuLine["aliment"]): string {
  return food.groupeAlimentaire === "Goûter" ? snackClass : roleClasses[food.role];
}

function foodRoleLabel(food: MenuLine["aliment"]): string {
  return food.groupeAlimentaire === "Goûter" ? "Goûter" : roleLabels[food.role];
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

function formatTargetPortions(line: MenuLine): string {
  const parts = targetGroups
    .filter((target) => line.quantitesParCible[target.key] > 0)
    .map((target) => `${target.label}: ${formatPortion(line.aliment, line.quantitesParCible[target.key])}`);
  return parts.length > 0 ? parts.join(" | ") : "Portion par cible non renseignée";
}

function coverageDays(days: DayMenu[], role: FoodRole): number {
  return days.filter((day) =>
    day.lignes.some((line) =>
      line.service === "repas" &&
      (line.role === role ||
        (role === "energetique" && line.component === "base") ||
        (role === "proteine" && line.component === "proteine") ||
        (role === "vegetal" && line.component === "vegetal"))
    )
  ).length;
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

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

function csvCell(value: string | number): string {
  const text = String(value).replace(/"/g, '""');
  return `"${text}"`;
}
