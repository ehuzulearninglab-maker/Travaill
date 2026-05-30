import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, UserRound } from "lucide-react";
import { AdminUsersClient } from "@/components/admin-users-client";
import { getCurrentUser } from "@/lib/current-user";
import { listUsersForAdmin } from "@/lib/storage";

export default async function AdminUtilisateursPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/connexion");
  }
  if (user.role !== "admin") {
    redirect("/tableau-de-bord");
  }

  const utilisateurs = await listUsersForAdmin();

  return (
    <div className="space-y-6">
      <section className="surface-premium p-6">
        <Link href="/admin" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-sauge">
          <ArrowLeft size={16} aria-hidden="true" />
          Retour admin
        </Link>
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-md bg-sauge text-white">
            <UserRound size={24} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brun">Accès</p>
            <h1 className="mt-2 text-3xl font-black text-encre">Gestion des utilisateurs</h1>
            <p className="mt-2 max-w-2xl text-brun">
              Suspendez, réactivez ou promouvez les comptes. Les enseignants ne voient jamais cette section.
            </p>
          </div>
        </div>
      </section>

      <AdminUsersClient
        currentUserId={user.id}
        utilisateurs={utilisateurs.map((item) => ({
          id: item.id,
          nom: item.nom,
          email: item.email,
          role: item.role,
          date_creation: item.date_creation
        }))}
      />
    </div>
  );
}
