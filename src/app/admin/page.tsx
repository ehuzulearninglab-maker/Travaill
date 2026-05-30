import Link from "next/link";
import { redirect } from "next/navigation";
import type { ComponentType } from "react";
import { FileText, Settings, ShieldCheck, UserRound } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { getAdminOverview, listImportActivities } from "@/lib/storage";

function StatCard({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: string | number;
  icon: ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;
}) {
  return (
    <article className="rounded-md border border-stone-100 bg-white p-5 shadow-doux">
      <Icon className="mb-4 text-sauge" size={24} aria-hidden={true} />
      <p className="text-3xl font-black text-encre">{value}</p>
      <p className="mt-1 text-sm font-semibold text-brun">{label}</p>
    </article>
  );
}

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/connexion");
  }
  if (user.role !== "admin") {
    redirect("/tableau-de-bord");
  }

  const [overview, activities] = await Promise.all([getAdminOverview(), listImportActivities(8)]);

  return (
    <div className="space-y-6">
      <section className="surface-premium p-6">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-brun">Administration</p>
        <h1 className="mt-2 text-3xl font-black text-encre">Pilotage de la plateforme</h1>
        <p className="mt-2 max-w-3xl text-brun">
          Suivez les comptes, les imports Gemini et les accès enseignants depuis un espace réservé aux administrateurs.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/admin/utilisateurs" className="bouton-primaire">
            <UserRound size={16} aria-hidden="true" />
            Utilisateurs
          </Link>
          <Link href="/admin/gemini" className="bouton-secondaire">
            <Settings size={16} aria-hidden="true" />
            Gemini
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Utilisateurs" value={overview.utilisateurs} icon={UserRound} />
        <StatCard label="Comptes suspendus" value={overview.suspendus} icon={ShieldCheck} />
        <StatCard label="Fiches enregistrées" value={overview.fiches} icon={FileText} />
        <StatCard label="Tokens Gemini suivis" value={overview.tokensTotal} icon={Settings} />
      </section>

      <section className="rounded-md border border-stone-100 bg-white p-5 shadow-doux">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-encre">Derniers imports</h2>
            <p className="text-sm text-brun">Aperçu rapide des traitements reçus par l’application.</p>
          </div>
          <Link href="/admin/gemini" className="bouton-secondaire">
            Voir le suivi
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-ivoire text-xs uppercase tracking-[0.12em] text-brun">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Tokens</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {activities.map((activity) => (
                <tr key={activity.id}>
                  <td className="px-4 py-3 text-brun">
                    {new Date(activity.date).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-3 font-bold text-encre">{activity.source === "gemini" ? "Gemini" : "Local"}</td>
                  <td className="px-4 py-3 text-brun">{activity.statut}</td>
                  <td className="px-4 py-3 text-brun">{activity.tokens_total}</td>
                </tr>
              ))}
              {activities.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-brun">
                    Aucun import suivi pour le moment.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
