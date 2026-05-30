"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, FileText, Filter, PencilLine, Plus, Search, Trash2 } from "lucide-react";
import { cacheFiches, removeCachedFiche } from "@/lib/client-fiche-cache";
import { telechargerFiche } from "@/lib/client-download";
import type { FicheRecord } from "@/lib/types";

export function DashboardClient({ initialFiches }: { initialFiches: FicheRecord[] }) {
  const [fiches, setFiches] = useState(initialFiches);
  const [query, setQuery] = useState("");
  const [classe, setClasse] = useState("Toutes");
  const [creating, setCreating] = useState(false);

  const classes = useMemo(
    () => ["Toutes", ...Array.from(new Set(fiches.map((fiche) => fiche.classe).filter(Boolean)))],
    [fiches]
  );

  const filtered = fiches.filter((fiche) => {
    const text = `${fiche.titre} ${fiche.matiere} ${fiche.classe}`.toLowerCase();
    const matchesQuery = text.includes(query.toLowerCase());
    const matchesClass = classe === "Toutes" || fiche.classe === classe;
    return matchesQuery && matchesClass;
  });

  async function refresh() {
    const response = await fetch("/api/fiches");
    if (response.ok) {
      const data = (await response.json()) as { fiches: FicheRecord[] };
      setFiches(data.fiches);
    }
  }

  useEffect(() => {
    const timer = window.setInterval(refresh, 7000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    cacheFiches(fiches);
  }, [fiches]);

  async function createFiche() {
    setCreating(true);
    const response = await fetch("/api/fiches", { method: "POST" });
    setCreating(false);
    if (response.ok) {
      await refresh();
    }
  }

  async function deleteFiche(id: string) {
    const confirmed = window.confirm("Supprimer définitivement cette fiche ?");
    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/fiches/${id}`, { method: "DELETE" });
    if (response.ok || response.status === 404) {
      removeCachedFiche(id);
      setFiches((current) => current.filter((fiche) => fiche.id !== id));
      return;
    }

    window.alert("La fiche n'a pas pu être supprimée. Veuillez réessayer.");
  }

  return (
    <div className="space-y-6">
      <section className="surface-premium p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brun">Espace enseignant</p>
            <h1 className="mt-2 text-3xl font-black text-encre">Tableau de bord</h1>
            <p className="mt-2 max-w-2xl text-brun">
              Retrouvez les fiches reçues depuis votre GPT, corrigez-les et exportez-les dans un format prêt à partager.
            </p>
          </div>
          <button type="button" onClick={createFiche} className="bouton-primaire" disabled={creating}>
            <Plus size={17} aria-hidden="true" />
            {creating ? "Création..." : "Nouvelle fiche"}
          </button>
        </div>
      </section>

      <section className="surface-premium p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <label className="relative block">
            <span className="sr-only">Rechercher</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brun" size={18} />
            <input
              className="champ pl-10"
              placeholder="Rechercher une matière, une classe, un titre..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <label className="relative block">
            <span className="sr-only">Filtrer par classe</span>
            <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brun" size={18} />
            <select className="champ pl-10" value={classe} onChange={(event) => setClasse(event.target.value)}>
              {classes.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <button type="button" onClick={refresh} className="bouton-secondaire">
            Actualiser
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((fiche) => (
          <article key={fiche.id} className="carte-fiche">
            <div className="mb-4 flex items-start justify-between gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-ciel text-sauge">
                <FileText size={19} aria-hidden="true" />
              </span>
              <span className="rounded-lg bg-ivoire px-2 py-1 text-xs font-bold text-brun">{fiche.classe}</span>
            </div>
            <h2 className="text-lg font-black leading-snug text-encre">{fiche.titre}</h2>
            <p className="mt-1 text-sm font-semibold text-sauge">{fiche.matiere}</p>
            <p className="mt-3 text-sm text-brun">
              Modifiée le{" "}
              {new Date(fiche.date_modification).toLocaleDateString("fr-FR", {
                dateStyle: "medium"
              })}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/fiches/${fiche.id}`} className="bouton-primaire">
                <PencilLine size={16} aria-hidden="true" />
                Ouvrir
              </Link>
              <button
                type="button"
                onClick={() => {
                  telechargerFiche(fiche, "pdf").catch(() => {
                    window.alert("Le PDF n'a pas pu être généré. Veuillez réessayer.");
                  });
                }}
                className="bouton-secondaire"
              >
                <Download size={16} aria-hidden="true" />
                PDF
              </button>
              <button type="button" onClick={() => deleteFiche(fiche.id)} className="bouton-danger">
                <Trash2 size={16} aria-hidden="true" />
                Supprimer
              </button>
            </div>
          </article>
        ))}
      </section>

      {filtered.length === 0 ? (
        <section className="rounded-xl border border-dashed border-stone-100 bg-white p-8 text-center shadow-doux">
          <p className="font-bold text-encre">Aucune fiche ne correspond à votre recherche.</p>
          <p className="mt-2 text-sm text-brun">Modifiez les filtres ou créez une nouvelle fiche.</p>
        </section>
      ) : null}
    </div>
  );
}
