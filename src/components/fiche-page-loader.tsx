"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FicheWorkspace } from "@/components/fiche-workspace";
import { cacheFiche, getCachedFiche } from "@/lib/client-fiche-cache";
import type { FicheRecord, HistoriqueRecord } from "@/lib/types";

export function FichePageLoader({
  id,
  initialFiche,
  initialHistorique
}: {
  id: string;
  initialFiche?: FicheRecord;
  initialHistorique: HistoriqueRecord[];
}) {
  const [fiche, setFiche] = useState<FicheRecord | undefined>(initialFiche);
  const [historique, setHistorique] = useState<HistoriqueRecord[]>(initialHistorique);
  const [loading, setLoading] = useState(!initialFiche);

  useEffect(() => {
    if (initialFiche) {
      cacheFiche(initialFiche);
    }

    const cached = getCachedFiche(id);
    if (!initialFiche && cached) {
      setFiche(cached);
      setLoading(false);
    }

    let cancelled = false;
    async function loadFreshFiche() {
      try {
        const response = await fetch(`/api/fiches/${id}`);
        if (response.ok) {
          const data = (await response.json()) as { fiche: FicheRecord };
          if (!cancelled) {
            setFiche(data.fiche);
            cacheFiche(data.fiche);
          }
        }

        const historyResponse = await fetch(`/api/fiches/${id}/historique`);
        if (historyResponse.ok) {
          const data = (await historyResponse.json()) as { historique: HistoriqueRecord[] };
          if (!cancelled) {
            setHistorique(data.historique);
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadFreshFiche();

    return () => {
      cancelled = true;
    };
  }, [id, initialFiche]);

  if (fiche) {
    return <FicheWorkspace fiche={fiche} historique={historique} />;
  }

  return (
    <section className="rounded-md border border-stone-100 bg-white p-6 shadow-doux">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-brun">Fiche introuvable</p>
      <h1 className="mt-2 text-2xl font-black text-encre">
        {loading ? "Chargement de la fiche..." : "Cette fiche n'est pas disponible sur cet appareil."}
      </h1>
      <p className="mt-3 max-w-2xl text-brun">
        Retournez au tableau de bord et cliquez sur Actualiser. Les fiches visibles y sont conservées pour pouvoir les
        ouvrir et les exporter même si l'hébergement gratuit redémarre une fonction.
      </p>
      <Link href="/tableau-de-bord" className="bouton-primaire mt-5 inline-flex">
        Retour au tableau de bord
      </Link>
    </section>
  );
}

