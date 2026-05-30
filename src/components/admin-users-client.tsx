"use client";

import { useMemo, useState } from "react";
import { ShieldCheck, UserCheck, UserMinus, UserRound } from "lucide-react";
import type { UserRole } from "@/lib/types";

type AdminUser = {
  id: string;
  nom: string;
  email: string;
  role: UserRole;
  date_creation: string;
};

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  enseignant: "Enseignant",
  suspendu: "Suspendu"
};

export function AdminUsersClient({ utilisateurs, currentUserId }: { utilisateurs: AdminUser[]; currentUserId: string }) {
  const [items, setItems] = useState(utilisateurs);
  const [savingId, setSavingId] = useState<string | null>(null);
  const counts = useMemo(
    () => ({
      total: items.length,
      admins: items.filter((user) => user.role === "admin").length,
      suspendus: items.filter((user) => user.role === "suspendu").length
    }),
    [items]
  );

  async function updateRole(id: string, role: UserRole) {
    setSavingId(id);
    const response = await fetch(`/api/admin/utilisateurs/${id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role })
    });
    setSavingId(null);

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      window.alert(data.message || "Impossible de modifier cet utilisateur.");
      return;
    }

    const data = (await response.json()) as { utilisateur: AdminUser };
    setItems((current) => current.map((user) => (user.id === id ? data.utilisateur : user)));
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-md border border-stone-100 bg-white p-4 shadow-doux">
          <UserRound className="mb-3 text-sauge" size={22} aria-hidden="true" />
          <p className="text-2xl font-black text-encre">{counts.total}</p>
          <p className="text-sm font-semibold text-brun">Comptes inscrits</p>
        </div>
        <div className="rounded-md border border-stone-100 bg-white p-4 shadow-doux">
          <ShieldCheck className="mb-3 text-sauge" size={22} aria-hidden="true" />
          <p className="text-2xl font-black text-encre">{counts.admins}</p>
          <p className="text-sm font-semibold text-brun">Administrateurs</p>
        </div>
        <div className="rounded-md border border-stone-100 bg-white p-4 shadow-doux">
          <UserMinus className="mb-3 text-red-700" size={22} aria-hidden="true" />
          <p className="text-2xl font-black text-encre">{counts.suspendus}</p>
          <p className="text-sm font-semibold text-brun">Comptes suspendus</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-stone-100 bg-white shadow-doux">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-ivoire text-xs uppercase tracking-[0.12em] text-brun">
              <tr>
                <th className="px-4 py-3">Utilisateur</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Creation</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {items.map((user) => (
                <tr key={user.id} className="align-top">
                  <td className="px-4 py-4">
                    <p className="font-black text-encre">{user.nom}</p>
                    <p className="mt-1 text-brun">{user.email}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-md px-2 py-1 text-xs font-bold ${
                        user.role === "suspendu"
                          ? "bg-red-50 text-red-700"
                          : user.role === "admin"
                            ? "bg-ciel text-sauge"
                            : "bg-ivoire text-brun"
                      }`}
                    >
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-brun">
                    {new Date(user.date_creation).toLocaleDateString("fr-FR", { dateStyle: "medium" })}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="bouton-secondaire px-3 py-1.5"
                        disabled={savingId === user.id || user.role === "enseignant"}
                        onClick={() => updateRole(user.id, "enseignant")}
                      >
                        <UserCheck size={15} aria-hidden="true" />
                        Accepter
                      </button>
                      <button
                        type="button"
                        className="bouton-danger px-3 py-1.5"
                        disabled={savingId === user.id || user.role === "suspendu" || user.id === currentUserId}
                        onClick={() => updateRole(user.id, "suspendu")}
                      >
                        <UserMinus size={15} aria-hidden="true" />
                        Suspendre
                      </button>
                      <button
                        type="button"
                        className="bouton-secondaire px-3 py-1.5"
                        disabled={savingId === user.id || user.role === "admin"}
                        onClick={() => updateRole(user.id, "admin")}
                      >
                        <ShieldCheck size={15} aria-hidden="true" />
                        Admin
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
