import { promises as fs } from "fs";
import path from "path";
import {
  defaultCantineReference,
  normalizeCantineReference,
  type CantineReference,
  type RawCantineReference
} from "@/lib/cantine-engine";

type PgPool = import("pg").Pool;
type PgRow = Record<string, unknown>;

export type CantineStorageMode = "postgres" | "local-file" | "memory" | "static";

export type CantineStorageStatus = {
  mode: CantineStorageMode;
  persistent: boolean;
  writable: boolean;
  label: string;
  warning?: string;
};

export type CantineReferenceBundle = {
  reference: CantineReference;
  status: CantineStorageStatus;
};

export type CantineSourceFile = {
  fileName: string;
  mimeType: string;
  data: Buffer;
  importedAt: string;
};

const ACTIVE_REFERENCE_ID = "active";
const DATA_FILE = path.join(process.cwd(), "data", "cantine-reference-active.json");

const globalForCantine = globalThis as typeof globalThis & {
  cantinePool?: PgPool;
  cantinePostgresReady?: boolean;
  cantinePostgresDisabled?: boolean;
  cantinePostgresError?: string;
  cantinePostgresSource?: string;
  cantineMemoryReference?: RawCantineReference;
};

const POSTGRES_ENV_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "SUPABASE_DB_URL",
  "SUPABASE_POSTGRES_URL"
] as const;

function databaseConnectionCandidates(): { key: string; value: string }[] {
  const seen = new Set<string>();
  return POSTGRES_ENV_KEYS.flatMap((key) => {
    const value = process.env[key]?.trim();
    if (!value || !/^postgres(ql)?:\/\//i.test(value) || seen.has(value)) {
      return [];
    }
    seen.add(value);
    return [{ key, value }];
  });
}

function usePostgres(): boolean {
  return databaseConnectionCandidates().length > 0 && !globalForCantine.cantinePostgresDisabled;
}

function postgresConnectionStringForPool(connectionString: string): string {
  if (!connectionString || process.env.PGSSLMODE === "disable") {
    return connectionString;
  }

  try {
    const url = new URL(connectionString);
    ["sslmode", "sslcert", "sslkey", "sslrootcert"].forEach((param) => url.searchParams.delete(param));
    return url.toString();
  } catch {
    return connectionString;
  }
}

function isHostedProduction(): boolean {
  return Boolean(process.env.VERCEL);
}

export function getCantineReferenceWriteBlocker(): string | undefined {
  if (!isHostedProduction()) {
    return undefined;
  }

  if (databaseConnectionCandidates().length === 0) {
    return "Stockage persistant requis : ajoutez DATABASE_URL ou POSTGRES_URL dans Vercel avant d'importer un nouveau fichier Excel. Sans base PostgreSQL, Vercel ne peut pas conserver le fichier après rechargement.";
  }

  if (globalForCantine.cantinePostgresDisabled) {
    return `Stockage PostgreSQL indisponible : ${globalForCantine.cantinePostgresError || "connexion impossible"}. Corrigez la variable PostgreSQL dans Vercel puis redéployez.`;
  }

  return undefined;
}

async function createPool(connectionString: string): Promise<PgPool> {
  const { Pool } = await import("pg");
  return new Pool({
    connectionString: postgresConnectionStringForPool(connectionString),
    ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false }
  });
}

async function getPool(): Promise<PgPool> {
  if (globalForCantine.cantinePool) {
    return globalForCantine.cantinePool;
  }

  const candidate = databaseConnectionCandidates()[0];
  if (!candidate) {
    throw new Error("Aucune variable PostgreSQL valide n'est configurée.");
  }

  globalForCantine.cantinePool = await createPool(candidate.value);
  globalForCantine.cantinePostgresSource = candidate.key;
  return globalForCantine.cantinePool;
}

async function ensurePostgresTable(): Promise<boolean> {
  if (globalForCantine.cantinePostgresDisabled) {
    return false;
  }
  if (globalForCantine.cantinePostgresReady) {
    return true;
  }

  const errors: string[] = [];
  for (const candidate of databaseConnectionCandidates()) {
    let pool: PgPool | undefined;
    try {
      pool = await createPool(candidate.value);
      await pool.query(
        "create table if not exists cantine_references (id text primary key, source_name text not null, imported_at timestamptz not null default now(), data jsonb not null)"
      );
      await pool.query("alter table cantine_references add column if not exists source_file bytea");
      await pool.query("alter table cantine_references add column if not exists source_mime text");
      globalForCantine.cantinePool = pool;
      globalForCantine.cantinePostgresReady = true;
      globalForCantine.cantinePostgresDisabled = false;
      globalForCantine.cantinePostgresError = undefined;
      globalForCantine.cantinePostgresSource = candidate.key;
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${candidate.key}: ${message}`);
      await pool?.end().catch(() => undefined);
    }
  }

  globalForCantine.cantinePostgresDisabled = true;
  globalForCantine.cantinePostgresError = errors.join(" | ");
  return false;
}

function asIso(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value || new Date().toISOString());
}

function asRawReference(value: unknown): RawCantineReference {
  if (typeof value === "string") {
    return JSON.parse(value) as RawCantineReference;
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as RawCantineReference;
  }
  return {};
}

function postgresStatus(): CantineStorageStatus {
  return {
    mode: "postgres",
    persistent: true,
    writable: true,
    label: globalForCantine.cantinePostgresSource
      ? `PostgreSQL (${globalForCantine.cantinePostgresSource})`
      : "PostgreSQL"
  };
}

function localFileStatus(): CantineStorageStatus {
  const onVercel = isHostedProduction();
  return {
    mode: "local-file",
    persistent: !onVercel,
    writable: !onVercel,
    label: onVercel ? "Fichier temporaire Vercel" : "Fichier local",
    warning: onVercel
      ? getCantineReferenceWriteBlocker()
      : undefined
  };
}

function memoryStatus(): CantineStorageStatus {
  return {
    mode: "memory",
    persistent: false,
    writable: false,
    label: "Mémoire serveur temporaire",
    warning: getCantineReferenceWriteBlocker() || "Configurez DATABASE_URL ou POSTGRES_URL pour conserver les futurs imports en production."
  };
}

function staticStatus(): CantineStorageStatus {
  const writeBlocker = getCantineReferenceWriteBlocker();
  return {
    mode: "static",
    persistent: true,
    writable: !writeBlocker,
    label: "Référence incluse dans l'application",
    warning: writeBlocker
  };
}

function defaultReferenceIsNewerThan(importedAt: unknown): boolean {
  const storedTime = Date.parse(asIso(importedAt));
  const defaultTime = Date.parse(defaultCantineReference.importedAt);
  if (!Number.isFinite(storedTime) || !Number.isFinite(defaultTime)) {
    return false;
  }
  return defaultTime > storedTime;
}

export async function getCantineReferenceBundle(): Promise<CantineReferenceBundle> {
  if (usePostgres() && (await ensurePostgresTable())) {
    const pool = await getPool();
    const result = await pool.query("select * from cantine_references where id = $1 limit 1", [ACTIVE_REFERENCE_ID]);
    const row = result.rows[0] as PgRow | undefined;
    if (row) {
      if (defaultReferenceIsNewerThan(row.imported_at)) {
        return {
          reference: defaultCantineReference,
          status: postgresStatus()
        };
      }

      const raw = asRawReference(row.data);
      return {
        reference: normalizeCantineReference({
          ...raw,
          sourceName: String(row.source_name || raw.sourceName || "Reference cantine"),
          importedAt: asIso(row.imported_at || raw.importedAt)
        }),
        status: postgresStatus()
      };
    }
  }

  if (globalForCantine.cantineMemoryReference) {
    return {
      reference: normalizeCantineReference(globalForCantine.cantineMemoryReference),
      status: memoryStatus()
    };
  }

  try {
    const raw = JSON.parse(await fs.readFile(DATA_FILE, "utf8")) as RawCantineReference;
    return {
      reference: normalizeCantineReference(raw),
      status: localFileStatus()
    };
  } catch {
    return {
      reference: defaultCantineReference,
      status: staticStatus()
    };
  }
}

export async function getActiveCantineReference(): Promise<CantineReference> {
  return (await getCantineReferenceBundle()).reference;
}

export async function getCantineStorageStatus(): Promise<CantineStorageStatus> {
  return (await getCantineReferenceBundle()).status;
}

function asBuffer(value: unknown): Buffer | undefined {
  if (Buffer.isBuffer(value)) {
    return value;
  }
  if (value instanceof Uint8Array) {
    return Buffer.from(value);
  }
  return undefined;
}

export async function getActiveCantineSourceFile(): Promise<CantineSourceFile | undefined> {
  if (!(usePostgres() && (await ensurePostgresTable()))) {
    return undefined;
  }

  const pool = await getPool();
  const result = await pool.query(
    "select source_name, source_mime, source_file, imported_at from cantine_references where id = $1 limit 1",
    [ACTIVE_REFERENCE_ID]
  );
  const row = result.rows[0] as PgRow | undefined;
  const data = asBuffer(row?.source_file);

  if (!row || !data || data.byteLength === 0) {
    return undefined;
  }

  return {
    fileName: String(row.source_name || "reference-cantine.xlsx"),
    mimeType: String(row.source_mime || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
    data,
    importedAt: asIso(row.imported_at)
  };
}

export async function saveActiveCantineReference(
  raw: RawCantineReference,
  sourceName: string,
  sourceFile?: { data: Buffer; mimeType: string }
): Promise<CantineReferenceBundle> {
  const writeBlocker = getCantineReferenceWriteBlocker();
  if (writeBlocker) {
    throw new Error(writeBlocker);
  }

  const stored: RawCantineReference = {
    ...raw,
    sourceName,
    importedAt: new Date().toISOString()
  };

  if (usePostgres() && (await ensurePostgresTable())) {
    const pool = await getPool();
    await pool.query(
      `insert into cantine_references (id, source_name, imported_at, data, source_file, source_mime)
       values ($1, $2, $3, $4::jsonb, $5, $6)
       on conflict (id) do update
       set source_name = excluded.source_name,
           imported_at = excluded.imported_at,
           data = excluded.data,
           source_file = excluded.source_file,
           source_mime = excluded.source_mime`,
      [
        ACTIVE_REFERENCE_ID,
        stored.sourceName,
        stored.importedAt,
        JSON.stringify(stored),
        sourceFile?.data || null,
        sourceFile?.mimeType || null
      ]
    );
    return {
      reference: normalizeCantineReference(stored),
      status: postgresStatus()
    };
  }

  const postConnectBlocker = getCantineReferenceWriteBlocker();
  if (postConnectBlocker) {
    throw new Error(postConnectBlocker);
  }

  globalForCantine.cantineMemoryReference = stored;

  try {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, `${JSON.stringify(stored, null, 2)}\n`, "utf8");
    return {
      reference: normalizeCantineReference(stored),
      status: localFileStatus()
    };
  } catch {
    return {
      reference: normalizeCantineReference(stored),
      status: memoryStatus()
    };
  }
}
