import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const CANTINE_ADMIN_COOKIE = "cantine_admin_session";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 10;

function adminPassword(): string | undefined {
  const password = process.env.CANTINE_ADMIN_PASSWORD || process.env.IMPORT_SECRET_KEY;
  return password?.trim() || undefined;
}

function authSecret(): string {
  return process.env.AUTH_SECRET || adminPassword() || "cantine-admin-local-secret";
}

function base64Url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string): string {
  return createHmac("sha256", authSecret()).update(payload).digest("base64url");
}

export function isCantineAdminPasswordConfigured(): boolean {
  return Boolean(adminPassword());
}

export async function verifyCantineAdminPassword(password: string): Promise<boolean> {
  const expected = adminPassword();
  if (!expected) {
    return false;
  }

  const actualBuffer = Buffer.from(password);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function createCantineAdminSession(): string {
  const payload = base64Url(
    JSON.stringify({
      sub: "cantine-admin",
      exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS
    })
  );
  return `${payload}.${sign(payload)}`;
}

export function verifyCantineAdminSession(token: string | undefined): boolean {
  if (!token || !token.includes(".")) {
    return false;
  }

  const [payload, signature] = token.split(".");
  const expected = sign(payload);
  if (
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return false;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      sub?: string;
      exp?: number;
    };
    return decoded.sub === "cantine-admin" && Boolean(decoded.exp && decoded.exp >= Math.floor(Date.now() / 1000));
  } catch {
    return false;
  }
}

export async function isCantineAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyCantineAdminSession(cookieStore.get(CANTINE_ADMIN_COOKIE)?.value);
}

export const cantineAdminSessionMaxAge = SESSION_MAX_AGE_SECONDS;
