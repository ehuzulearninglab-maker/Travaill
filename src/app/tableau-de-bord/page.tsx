import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard-client";
import { getCurrentUser } from "@/lib/current-user";
import { listFiches } from "@/lib/storage";

export default async function TableauDeBordPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/connexion");
  }

  const fiches = await listFiches(user.id);

  return <DashboardClient initialFiches={fiches} />;
}
