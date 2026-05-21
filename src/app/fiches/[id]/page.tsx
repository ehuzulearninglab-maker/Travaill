import { redirect } from "next/navigation";
import { FichePageLoader } from "@/components/fiche-page-loader";
import { getCurrentUser } from "@/lib/current-user";
import { getFiche, listHistorique } from "@/lib/storage";

export default async function FichePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/connexion");
  }

  const { id } = await params;
  const fiche = await getFiche(id, user.id).catch(() => undefined);
  const historique = fiche ? await listHistorique(id, user.id).catch(() => []) : [];

  return <FichePageLoader id={id} initialFiche={fiche} initialHistorique={historique} />;
}
