import { redirect } from "next/navigation";
import { ShieldCheck, UserRound } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { LogoutButton } from "@/components/logout-button";

export default async function ParametresPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/connexion");
  }

  return (
    <div className="space-y-5">
      <section className="rounded-md border border-stone-200 bg-white p-5 shadow-doux">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-brun">Compte</p>
        <h1 className="mt-2 text-3xl font-black text-encre">Paramètres</h1>
        <p className="mt-2 text-stone-600">Gérez votre profil et les règles de sécurité de la plateforme.</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-md border border-stone-200 bg-white p-5 shadow-doux">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-ciel text-sauge">
              <UserRound size={18} aria-hidden="true" />
            </span>
            <h2 className="text-xl font-black text-encre">Profil</h2>
          </div>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="font-bold text-stone-700">Nom</dt>
              <dd className="text-stone-600">{user.nom}</dd>
            </div>
            <div>
              <dt className="font-bold text-stone-700">Courriel</dt>
              <dd className="text-stone-600">{user.email}</dd>
            </div>
          </dl>
          <div className="mt-5">
            <LogoutButton />
          </div>
        </article>

        <article className="rounded-md border border-stone-200 bg-white p-5 shadow-doux">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-sauge text-white">
              <ShieldCheck size={18} aria-hidden="true" />
            </span>
            <h2 className="text-xl font-black text-encre">Sécurité</h2>
          </div>
          <p className="text-sm leading-6 text-stone-600">
            La réception des fiches est protégée par une clé secrète configurée côté serveur. Les comptes sont
            protégés par mot de passe et les accès aux fiches nécessitent une session active.
          </p>
        </article>
      </section>
    </div>
  );
}
