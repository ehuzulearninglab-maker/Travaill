import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Bot, CircleCheck, CircleOff } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { getAdminOverview, listImportActivities } from "@/lib/storage";

export default async function AdminGeminiPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/connexion");
  }
  if (user.role !== "admin") {
    redirect("/tableau-de-bord");
  }

  const [overview, activities] = await Promise.all([getAdminOverview(), listImportActivities(40)]);
  const geminiActive = Boolean(process.env.GEMINI_API_KEY);
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

  return (
    <div className="space-y-6">
      <section className="surface-premium p-6">
        <Link href="/admin" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-sauge">
          <ArrowLeft size={16} aria-hidden="true" />
          Retour admin
        </Link>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brun">Mise en forme IA</p>
            <h1 className="mt-2 text-3xl font-black text-encre">Suivi Gemini</h1>
            <p className="mt-2 max-w-2xl text-stone-600">
              Vérifiez l’activation, le modèle utilisé et les tokens consommés lors de la mise en forme des fiches.
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-bold ${
              geminiActive ? "bg-ciel text-sauge" : "bg-red-50 text-red-700"
            }`}
          >
            {geminiActive ? <CircleCheck size={17} aria-hidden="true" /> : <CircleOff size={17} aria-hidden="true" />}
            {geminiActive ? "Gemini actif" : "Clé absente"}
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-md border border-stone-200 bg-white p-5 shadow-doux">
          <Bot className="mb-4 text-sauge" size={24} aria-hidden="true" />
          <p className="text-lg font-black text-encre">{model}</p>
          <p className="mt-1 text-sm font-semibold text-stone-600">Modèle configuré</p>
        </article>
        <article className="rounded-md border border-stone-200 bg-white p-5 shadow-doux">
          <p className="text-3xl font-black text-encre">{overview.importsGemini}</p>
          <p className="mt-1 text-sm font-semibold text-stone-600">Imports traités par Gemini</p>
        </article>
        <article className="rounded-md border border-stone-200 bg-white p-5 shadow-doux">
          <p className="text-3xl font-black text-encre">{overview.tokensTotal}</p>
          <p className="mt-1 text-sm font-semibold text-stone-600">Tokens suivis</p>
        </article>
      </section>

      <section className="rounded-md border border-stone-200 bg-white p-5 shadow-doux">
        <h2 className="text-xl font-black text-encre">Historique des traitements</h2>
        <p className="mt-1 text-sm text-stone-600">
          La consommation est estimée à partir des tokens retournés par Gemini après chaque import.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-ivoire text-xs uppercase tracking-[0.12em] text-brun">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Modèle</th>
                <th className="px-4 py-3">Entrée</th>
                <th className="px-4 py-3">Sortie</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {activities.map((activity) => (
                <tr key={activity.id}>
                  <td className="px-4 py-3 text-stone-600">
                    {new Date(activity.date).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-3 font-bold text-encre">{activity.source === "gemini" ? "Gemini" : "Local"}</td>
                  <td className="px-4 py-3 text-stone-600">{activity.modele || model}</td>
                  <td className="px-4 py-3 text-stone-600">{activity.tokens_entree}</td>
                  <td className="px-4 py-3 text-stone-600">{activity.tokens_sortie}</td>
                  <td className="px-4 py-3 font-bold text-encre">{activity.tokens_total}</td>
                  <td className="max-w-xs px-4 py-3 text-stone-600">{activity.message || "Traitement terminé"}</td>
                </tr>
              ))}
              {activities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-stone-600">
                    Aucun traitement enregistré pour le moment.
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
