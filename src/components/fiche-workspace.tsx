"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock3, Download, FileDown, PencilLine, Printer, Save, TableProperties, Trash2 } from "lucide-react";
import { FicheCanevas } from "@/components/fiche-canevas";
import { FicheEditor } from "@/components/fiche-editor";
import { cacheFiche, removeCachedFiche } from "@/lib/client-fiche-cache";
import { telechargerFiche } from "@/lib/client-download";
import type { FicheContenu, FicheRecord, HistoriqueRecord } from "@/lib/types";

type Onglet = "apercu" | "edition" | "historique";

export function FicheWorkspace({
  fiche,
  historique
}: {
  fiche: FicheRecord;
  historique: HistoriqueRecord[];
}) {
  const router = useRouter();
  const [contenu, setContenu] = useState<FicheContenu>(fiche.contenu_json);
  const [onglet, setOnglet] = useState<Onglet>("apercu");
  const [historyItems, setHistoryItems] = useState(historique);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const firstRun = useRef(true);
  const currentFiche: FicheRecord = { ...fiche, contenu_json: contenu };

  async function deleteCurrentFiche() {
    const confirmed = window.confirm("Supprimer définitivement cette fiche ?");
    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/fiches/${fiche.id}`, { method: "DELETE" });
    if (response.ok || response.status === 404) {
      removeCachedFiche(fiche.id);
      router.push("/tableau-de-bord");
      router.refresh();
      return;
    }

    window.alert("La fiche n'a pas pu être supprimée. Veuillez réessayer.");
  }

  useEffect(() => {
    cacheFiche({ ...fiche, contenu_json: contenu });
  }, [contenu, fiche]);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    setSaving(true);
    const timeout = window.setTimeout(async () => {
      const response = await fetch(`/api/fiches/${fiche.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenu_json: contenu })
      });

      if (response.ok) {
        setSavedAt(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
        const historyResponse = await fetch(`/api/fiches/${fiche.id}/historique`);
        if (historyResponse.ok) {
          const data = (await historyResponse.json()) as { historique: HistoriqueRecord[] };
          setHistoryItems(data.historique);
        }
      }
      setSaving(false);
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [contenu, fiche.id]);

  const onglets = [
    { key: "apercu" as const, label: "Aperçu", icon: TableProperties },
    { key: "edition" as const, label: "Édition", icon: PencilLine },
    { key: "historique" as const, label: "Historique", icon: Clock3 }
  ];

  return (
    <div className="space-y-5">
      <div className="no-print rounded-xl border border-stone-100 bg-white p-5 shadow-doux">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/tableau-de-bord" className="text-sm font-semibold text-sauge hover:underline">
              Retour au tableau de bord
            </Link>
            <h1 className="mt-2 text-2xl font-black text-encre">{fiche.titre}</h1>
            <p className="text-sm text-brun">
              {fiche.matiere} · {fiche.classe}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                telechargerFiche(currentFiche, "pdf").catch(() => {
                  window.alert("Le PDF n'a pas pu être généré. Veuillez réessayer.");
                });
              }}
              className="bouton-secondaire"
            >
              <FileDown size={16} aria-hidden="true" />
              PDF
            </button>
            <button
              type="button"
              onClick={() => {
                telechargerFiche(currentFiche, "word").catch(() => {
                  window.alert("Le document Word n'a pas pu être généré. Veuillez réessayer.");
                });
              }}
              className="bouton-secondaire"
            >
              <Download size={16} aria-hidden="true" />
              Word
            </button>
            <button type="button" onClick={() => window.print()} className="bouton-primaire">
              <Printer size={16} aria-hidden="true" />
              Imprimer
            </button>
            <button type="button" onClick={deleteCurrentFiche} className="bouton-danger">
              <Trash2 size={16} aria-hidden="true" />
              Supprimer
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-stone-100 pt-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {onglets.map((item) => {
              const Icon = item.icon;
              const active = onglet === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setOnglet(item.key)}
                  className={active ? "bouton-primaire" : "bouton-secondaire"}
                >
                  <Icon size={16} aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </div>

          <p className="inline-flex items-center gap-2 text-sm font-medium text-brun">
            <Save size={16} aria-hidden="true" />
            {saving ? "Sauvegarde en cours..." : savedAt ? `Sauvegardé à ${savedAt}` : "Sauvegarde automatique active"}
          </p>
        </div>
      </div>

      {onglet === "apercu" ? (
        <div className="zone-impression">
          <FicheCanevas contenu={contenu} />
        </div>
      ) : null}

      {onglet === "edition" ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,40%)_minmax(0,60%)]">
          <div className="min-w-0">
            <FicheEditor contenu={contenu} onChange={setContenu} />
          </div>
          <aside className="min-w-0 xl:sticky xl:top-28 xl:self-start">
            <div className="mb-3 rounded-xl border border-stone-100 bg-white px-4 py-3 shadow-doux">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-brun">Aperçu de la fiche</p>
            </div>
            <div className="zone-impression">
              <FicheCanevas contenu={contenu} />
            </div>
          </aside>
        </div>
      ) : null}

      {onglet === "historique" ? (
        <div className="rounded-xl border border-stone-100 bg-white p-5 shadow-doux">
          <h2 className="mb-4 text-lg font-black text-encre">Versions sauvegardées</h2>
          <div className="space-y-3">
            {historyItems.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-stone-100 bg-ivoire/70 p-4">
                <p className="font-bold text-encre">Version {entry.version}</p>
                <p className="text-sm text-brun">
                  {new Date(entry.date).toLocaleString("fr-FR", {
                    dateStyle: "medium",
                    timeStyle: "short"
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
