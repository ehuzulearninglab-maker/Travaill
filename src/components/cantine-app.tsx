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
  constraints,
  formatCurrency,
  formatPortion,
  formatPurchaseQuantity,
  formatUnitPrice,
  generateMenu,
  roleLabels
} from "@/lib/cantine-engine";
import type { CantineReference, Constraint, FoodRole, PlanInput, Status } from "@/lib/cantine-engine";

type Tab = "planification" | "menu" | "achats" | "rapport";

const initialInput: PlanInput = {
  nombreEnfants: 120,
  trancheAge: "6-10 ans",
  budgetTotal: 210000,
  dureeJours: 5,
  contraintes: ["sans porc"],
  saison: "Aucune"
};

const tabs: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "planification", label: "Planification", icon: SlidersHorizontal },
  { id: "menu", label: "Menu genere", icon: ChefHat },
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

const statusClasses: Record<Status, string> = {
  Conforme: "border-green-200 bg-green-50 text-green-700",
  Attention: "border-amber-200 bg-amber-50 text-amber-700",
  "Non conforme": "border-red-200 bg-red-50 text-red-700"
};

export function CantineApp({ initialReference }: { initialReference: CantineReference }) {
  const [input, setInput] = useState<PlanInput>(initialInput);
  const [activeTab, setActiveTab] = useState<Tab>("planification");
  const result = useMemo(() => generateMenu(input, initialReference), [input, initialReference]);
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

  function openTab(tab: Tab) {
    setActiveTab(tab);
    window.history.replaceState(null, "", `#${tab}`);
  }

  function generateAndOpenMenu() {
    openTab("menu");
  }

  function downloadCsv() {
    const header = [
      "Jour",
      "Plat valide",
      "Composant",
      "Reference fichier",
      "Aliment retenu",
      "Quantite par enfant",
      "Quantite totale",
      "Prix reference",
      "A acheter",
      "Cout"
    ];
    const rows = result.lignes.map((line) => [
      line.jour,
      result.jours.find((jour) => jour.jour === line.jour)?.plat.nom ?? "",
      componentLabels[line.component],
      line.sourceText,
      line.aliment.nom,
      formatPortion(line.aliment, line.quantiteParEnfant),
      formatPortion(line.aliment, line.quantiteTotale),
      formatUnitPrice(line.aliment),
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
              Menus proposes uniquement a partir des plats valides et des prix de reference du fichier alimentaire charge.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
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
              generateAndOpenMenu();
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
                  openTab("planification");
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

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="mt-1 text-[#1B6CA8]" size={22} aria-hidden="true" />
                <div>
                  <h3 className="text-lg font-black text-slate-950">Base de reference</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {result.reference.sourceName} - {result.reference.platsValides} plats valides,{" "}
                    {result.reference.alimentsActifs} aliments actifs.
                  </p>
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    Derniere base: {formatDateTime(result.reference.importedAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
              Les menus generes sont des propositions d'aide a la decision. Les couts et portions doivent rester
              verifies avant utilisation terrain.
            </div>
          </aside>
        </section>
      ) : null}

      {activeTab === "menu" ? (
        <section id="menu" className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Menu genere</h2>
              <p className="mt-1 text-sm text-slate-500">
                Generation du {formatDateTime(result.genereLe)} depuis les plats valides du fichier.
              </p>
            </div>
            <StatusBadge status={result.statut} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {result.jours.map((day) => (
              <article key={day.jour} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
                  <div>
                    <p className="text-sm font-black text-slate-500">Jour {day.jour}</p>
                    <h3 className="mt-1 text-xl font-black text-slate-950">{day.plat.nom}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-600">{formatCurrency(day.coutJournalier)}</p>
                  </div>
                  <StatusBadge status={day.statut} compact />
                </div>

                <div className="divide-y divide-slate-100">
                  {day.lignes.map((line) => (
                    <div key={line.id} className="grid gap-3 p-4 sm:grid-cols-[120px_1fr_auto] sm:items-center">
                      <span className={`inline-flex w-fit rounded-lg border px-2 py-1 text-xs font-black ${roleClasses[line.role]}`}>
                        {line.componentLabel}
                      </span>
                      <div>
                        <p className="font-black text-slate-950">{line.aliment.nom}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Reference plat: {line.sourceText || line.aliment.nom}
                        </p>
                      </div>
                      <div className="text-left text-sm sm:text-right">
                        <p className="font-bold text-slate-700">{formatPortion(line.aliment, line.quantiteParEnfant)} / enfant</p>
                        <p className="mt-1 font-black text-slate-950">{formatCurrency(line.coutLigne)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {day.alertes.length > 0 ? (
                  <div className="border-t border-amber-100 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
                    {day.alertes.join(" ")}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "achats" ? (
        <section id="achats" className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Liste des achats</h2>
              <p className="mt-1 text-sm text-slate-500">
                Quantites agregees apres arrondi selon l'unite d'achat du fichier.
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
                  <th className="px-5 py-3">Prix reference</th>
                  <th className="px-5 py-3">Unite achat</th>
                  <th className="px-5 py-3">Cout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.listeAchats.map((item) => (
                  <tr key={item.aliment.id}>
                    <td className="px-5 py-3 font-bold text-slate-950">{item.aliment.nom}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-lg border px-2 py-1 text-xs font-black ${roleClasses[item.role]}`}>
                        {roleLabels[item.role]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{formatPortion(item.aliment, item.quantiteTotale)}</td>
                    <td className="px-5 py-3 font-bold text-slate-700">{formatPurchaseQuantity(item.aliment, item.quantiteAchat)}</td>
                    <td className="px-5 py-3 text-slate-600">{formatPortion(item.aliment, item.surplus)}</td>
                    <td className="px-5 py-3 font-bold text-slate-700">{formatUnitPrice(item.aliment)}</td>
                    <td className="px-5 py-3 text-slate-600">
                      <span className="font-bold text-slate-700">{item.aliment.uniteAchat}</span>
                      <span className="block text-xs text-slate-500">{item.aliment.quantiteParVenteLabel}</span>
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
                <h3 className="text-lg font-black text-slate-950">Couverture nutritionnelle</h3>
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

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

function csvCell(value: string | number): string {
  const text = String(value).replace(/"/g, '""');
  return `"${text}"`;
}
