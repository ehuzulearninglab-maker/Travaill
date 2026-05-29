import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { updateUserRole } from "@/lib/storage";
import type { UserRole } from "@/lib/types";

const ROLES: UserRole[] = ["admin", "enseignant", "suspendu"];

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ message: "Acces administrateur requis." }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as { role?: UserRole };
  if (!body.role || !ROLES.includes(body.role)) {
    return NextResponse.json({ message: "Role invalide." }, { status: 400 });
  }

  if (id === admin.id && body.role !== "admin") {
    return NextResponse.json({ message: "Vous ne pouvez pas retirer votre propre acces admin." }, { status: 400 });
  }

  const user = await updateUserRole(id, body.role);
  if (!user) {
    return NextResponse.json({ message: "Utilisateur introuvable." }, { status: 404 });
  }

  return NextResponse.json({ succes: true, utilisateur: user });
}
