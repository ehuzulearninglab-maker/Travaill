import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { getUserByEmail, getUserById } from "@/lib/storage";
import type { UserRecord } from "@/lib/types";

const scrypt = promisify(scryptCallback);
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

export const SESSION_COOKIE = "session_fiches";

function getAuthSecret(): string {
  return process.env.AUTH_SECRET || "secret-local-a-remplacer";
}

function base64Url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, keyHex] = stored.split(":");
  if (!salt || !keyHex) {
    return false;
  }

  const key = (await scrypt(password, salt, 64)) as Buffer;
  const storedKey = Buffer.from(keyHex, "hex");
  return storedKey.length === key.length && timingSafeEqual(storedKey, key);
}

export async function verifyCredentials(email: string, password: string): Promise<UserRecord | undefined> {
  const user = await getUserByEmail(email);
  if (!user || user.role === "suspendu") {
    return undefined;
  }

  const valid = await verifyPassword(password, user.mot_de_passe);
  return valid ? user : undefined;
}

export function createSessionToken(user: Pick<UserRecord, "id" | "nom" | "email" | "role">): string {
  const payload = base64Url(
    JSON.stringify({
      sub: user.id,
      nom: user.nom,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS
    })
  );
  const signature = createHmac("sha256", getAuthSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined):
  | {
      userId: string;
      user?: Pick<UserRecord, "id" | "nom" | "email" | "role">;
    }
  | undefined {
  if (!token || !token.includes(".")) {
    return undefined;
  }

  const [payload, signature] = token.split(".");
  const expected = createHmac("sha256", getAuthSecret()).update(payload).digest("base64url");
  const valid =
    signature.length === expected.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

  if (!valid) {
    return undefined;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      sub?: string;
      exp?: number;
      nom?: string;
      email?: string;
      role?: UserRecord["role"];
    };
    if (!decoded.sub || !decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
      return undefined;
    }
    return {
      userId: decoded.sub,
      user:
        decoded.nom && decoded.email && decoded.role
          ? {
              id: decoded.sub,
              nom: decoded.nom,
              email: decoded.email,
              role: decoded.role
            }
          : undefined
    };
  } catch {
    return undefined;
  }
}

export async function userFromToken(token: string | undefined): Promise<UserRecord | undefined> {
  const session = verifySessionToken(token);
  if (!session) {
    return undefined;
  }

  const user = await getUserById(session.userId);
  if (user) {
    return user.role === "suspendu" ? undefined : user;
  }

  if (!session.user || session.user.role === "suspendu") {
    return undefined;
  }

  return {
    ...session.user,
    mot_de_passe: "",
    date_creation: new Date(0).toISOString()
  };
}

export const sessionMaxAge = SESSION_MAX_AGE_SECONDS;
