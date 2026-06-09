"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ChefHat,
  Database,
  FileSpreadsheet,
  Home,
  LogOut,
  Search,
  ShieldCheck,
  Upload,
  type LucideIcon
} from "lucide-react";
import { formatPortion, formatUnitPrice, roleLabels } from "@/lib/cantine-engine";
import type { CantineReference, FoodRole } from "@/lib/cantine-engine";
import type { CantineStorageStatus } from "@/lib/cantine-storage";

type ApiReferenceResponse = {
  succes?: boolean;
  reference?: CantineReference;
  status?: CantineStorageStatus;
  message?: string;
};

const roleClasses: Record<FoodRole, string> = {
  energetique: "border-orange-200 bg-orange-50 text-orange-800",
  proteine: "border-emerald-200 bg-emerald-50 text-emerald-800",
  fruit: "border-sky-200 bg-sky-50 text-sky-800",
  vegetal: "border-lime-200 bg-lime-50 text-lime-800",
  autre: "border-slate-200 bg-slate-50 text-slate-700"
};

export function CantineAdminClient({
  authenticated,
  passwordConfigured,
  initialReference,
  initialStatus
}: {
  authenticated: boolean;
  passwordConfigured: boolean;
  initialReference: CantineReference;
  initialStatus: CantineStorageStatus;
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(authenticated);
  const [reference, setReference] = useState(initialReference);
  const [status, setStatus] = useState(initialStatus);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<FoodRole | "Tous">("Tous");

  const filteredFoods = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return reference.foods.filter((food) => {
      const matchesRole = role === "Tous" || food.role === role;
      const matchesSearch =
        needle.length === 0 ||
        `${food.nom} ${food.groupeAlimentaire} ${food.categorieCulinaire}`.toLowerCase().includes(needle);
      return matchesRole && matchesSearch;
    });
  }, [reference.foods, role, search]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(undefined);

    const response = await fetch("/api/cantine/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    setBusy(false);

    if (!response.ok) {
      setMessage(data.message || "Connexion impossible.");
      return;
    }

    setPassword("");
    setIsAuthenticated(true);
    router.refresh();
  }

  async function logout() {
    await fetch("/api/cantine/admin/logout", { method: "POST" });
    setIsAuthenticated(false);
    router.refresh();
  }

  async function uploadReference(file: File | undefined) {
    if (!file) {
      return;
    }

    setBusy(true);
    setMessage(undefined);
    const formData = new FormData();
    formData.set("file", file);

    const response = await fetch("/api/cantine/reference", {
      method: "POST",
      body: formData
    });
    const data = (await response.json().catch(() => ({}))) as ApiReferenceResponse;
    setBusy(false);

    if (!response.ok || !data.reference || !data.status) {
      setMessage(data.message || "Import impossible.");
      return;
    }

    setReference(data.reference);
    setStatus(data.status);
    setMessage(data.message || "Base de reference mise a jour.");
    router.refresh();
  }

  if (!isAuthenticated) {
    return (
      <section className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white">
            <ShieldCheck size={22} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Acces protege</p>
            <h1 className="mt-1 text-2xl font-black text-slate-950">Administration Cantine</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Cet espace sert uniquement a mettre a jour le fichier de reference utilise par tous les utilisateurs.
            </p>
          </div>
        </div>

        <form className="mt-6 space-y-4" onSubmit={login}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">Mot de passe admin</span>
            <input
              className="champ"
              type="password"
              value={password}
              disabled={!passwordConfigured || busy}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <button type="submit" className="bouton-primaire w-full" disabled={!passwordConfigured || busy}>
            <ShieldCheck size={17} aria-hidden="true" />
            Se connecter
          </button>
        </form>

        {!passwordConfigured ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
            Ajoutez la variable `CANTINE_ADMIN_PASSWORD` dans Vercel pour activer cet espace.
          </div>
        ) : null}

        {message ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            {message}
          </div>
        ) : null}

        <Link href="/" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#1B6CA8]">
          <Home size={16} aria-hidden="true" />
          Retour a l'application
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Administration</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">Reference alimentaire</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Une seule base active alimente la planification, la generation de menus et la liste des achats.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/" className="bouton-secondaire">
              <Home size={17} aria-hidden="true" />
              Application
            </Link>
            <button type="button" onClick={logout} className="bouton-secondaire">
              <LogOut size={17} aria-hidden="true" />
              Deconnexion
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetric icon={FileSpreadsheet} label="Source active" value={reference.sourceName} detail={formatDate(reference.importedAt)} />
        <AdminMetric
          icon={ChefHat}
          label="Plats valides"
          value={String(reference.dishes.filter((dish) => isValidatedStatus(dish.statut)).length)}
          detail="Feuille Plats_Validés"
        />
        <AdminMetric
          icon={Database}
          label="Stockage"
          value={status.label}
          detail={status.persistent ? "Persistant" : "Temporaire"}
        />
        <AdminMetric
          icon={ShieldCheck}
          label="Acces"
          value="Admin protege"
          detail="Lien separe de l'espace utilisateur"
        />
      </section>

      {status.warning ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
          {status.warning}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-bold text-slate-700 shadow-sm">
          {message}
        </div>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Mettre a jour le fichier</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Le fichier doit contenir `Base_Aliments` et `Plats_Validés`. Apres validation, il devient la reference active.
          </p>

          <label className="mt-5 flex min-h-[132px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-sm font-bold text-slate-600 transition hover:border-[#1B6CA8] hover:bg-blue-50">
            <Upload size={24} aria-hidden="true" />
            <span className="mt-2">{busy ? "Import en cours..." : "Selectionner un fichier Excel"}</span>
            <input
              className="sr-only"
              type="file"
              accept=".xlsx,.xls"
              disabled={busy}
              onChange={(event) => {
                uploadReference(event.target.files?.[0]).catch(() => setMessage("Import impossible."));
                event.currentTarget.value = "";
              }}
            />
          </label>

          <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            <p>
              <span className="font-bold text-slate-800">Aliments actifs :</span>{" "}
              {reference.foods.filter((food) => food.actif).length}
            </p>
            <p>
              <span className="font-bold text-slate-800">Plats valides :</span>{" "}
              {reference.dishes.filter((dish) => isValidatedStatus(dish.statut)).length}
            </p>
            <p>
              <span className="font-bold text-slate-800">Dernier import :</span> {formatDate(reference.importedAt)}
            </p>
          </div>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-[1fr_220px]">
            <label className="relative block">
              <span className="sr-only">Rechercher un aliment</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                className="champ pl-10"
                placeholder="Rechercher un aliment"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <select className="champ" value={role} onChange={(event) => setRole(event.target.value as FoodRole | "Tous")}>
              <option>Tous</option>
              <option value="energetique">Energie</option>
              <option value="proteine">Proteine</option>
              <option value="fruit">Fruit</option>
              <option value="vegetal">Vegetal</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Aliment</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Saison</th>
                  <th className="px-4 py-3">Prix reference</th>
                  <th className="px-4 py-3">Portion enfant</th>
                  <th className="px-4 py-3">Unite achat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFoods.map((food) => (
                  <tr key={food.id}>
                    <td className="px-4 py-3 font-bold text-slate-950">{food.nom}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-lg border px-2 py-1 text-xs font-black ${roleClasses[food.role]}`}>
                        {roleLabels[food.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{food.saison}</td>
                    <td className="px-4 py-3 font-bold text-slate-700">{formatUnitPrice(food)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatPortion(food, food.portionEnfant)}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {food.uniteAchat}
                      <span className="block text-xs text-slate-500">{food.quantiteParVenteLabel}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </div>
  );
}

function AdminMetric({
  icon: Icon,
  label,
  value,
  detail
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
          <p className="mt-2 line-clamp-2 text-lg font-black text-slate-950">{value}</p>
        </div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-green-200 bg-green-50 text-green-700">
          <Icon size={18} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-sm font-medium leading-5 text-slate-600">{detail}</p>
    </article>
  );
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

function isValidatedStatus(status: string): boolean {
  const normalized = status
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return normalized.includes("valide") && !normalized.includes("a valider");
}
