import { notFound, redirect } from "next/navigation";
import { FicheWorkspace } from "@/components/fiche-workspace";
import { getCurrentUser } from "@/lib/current-user";
import { getFiche, listHistorique } from "@/lib/storage";

export default async function FichePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/connexion");
  }

  const { id } = await params;
  const fiche = await getFiche(id, user.id);
  if (!fiche) {
    notFound();
  }

  const historique = await listHistorique(id, user.id);
  return <FicheWorkspace fiche={fiche} historique={historique} />;
}
