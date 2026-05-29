import { cookies } from "next/headers";
import { SESSION_COOKIE, userFromToken } from "@/lib/auth";
import type { UserRecord } from "@/lib/types";

export async function getCurrentUser(): Promise<UserRecord | undefined> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return userFromToken(token);
}

export async function requireCurrentUser(): Promise<UserRecord> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Connexion requise.");
  }
  return user;
}

export async function requireAdminUser(): Promise<UserRecord> {
  const user = await requireCurrentUser();
  if (user.role !== "admin") {
    throw new Error("AccÃ¨s administrateur requis.");
  }
  return user;
}
