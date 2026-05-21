"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/deconnexion", { method: "POST" });
    router.push("/connexion");
    router.refresh();
  }

  return (
    <button type="button" onClick={logout} className="bouton-secondaire">
      <LogOut size={16} aria-hidden="true" />
      Se déconnecter
    </button>
  );
}
