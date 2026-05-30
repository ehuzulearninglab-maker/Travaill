import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock3 } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { listHistoriqueForUser } from "@/lib/storage";

export default async function HistoriquePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/connexion");
  }

  const entries = await listHistoriqueForUser(user.id);

  return (
    <div className="space-y-5">
      <section className="rounded-md border border-stone-100 bg-white p-5 shadow-doux">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-brun">Versions sauvegardées</p>
        <h1 className="mt-2 text-3xl font-black text-encre">Historique</h1>
        <p className="mt-2 text-brun">Consultez les anciennes versions enregistrées automatiquement.</p>
      </section>

      <section className="space-y-3">
        {entries.map((entry) => (
          <Link
            key={entry.id}
            href={`/fiches/${entry.fiche_id}`}
            className="flex flex-col gap-3 rounded-md border border-stone-100 bg-white p-4 shadow-doux transition hover:border-sauge md:flex-row md:items-center md:justify-between"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-ciel text-sauge">
                <Clock3 size={18} aria-hidden="true" />
              </span>
              <div>
                <p className="font-black text-encre">{entry.fiche?.titre ?? "Fiche supprimée"}</p>
                <p className="text-sm text-brun">Version {entry.version}</p>
              </div>
            </div>
            <p className="text-sm font-medium text-brun">
              {new Date(entry.date).toLocaleString("fr-FR", {
                dateStyle: "medium",
                timeStyle: "short"
              })}
            </p>
          </Link>
        ))}
      </section>

      {entries.length === 0 ? (
        <section className="rounded-xl border border-dashed border-stone-100 bg-white p-8 text-center shadow-doux">
          <p className="font-bold text-encre">Aucune version sauvegardée pour le moment.</p>
        </section>
      ) : null}
    </div>
  );
}
