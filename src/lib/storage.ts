import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { createEmptyFiche, inferFicheMeta } from "@/lib/fiche-utils";
import type {
  AppSettingsRecord,
  DatabaseShape,
  FicheContenu,
  FicheRecord,
  HistoriqueRecord,
  ImportActivityRecord,
  UserRecord,
  UserRole
} from "@/lib/types";

export const DEFAULT_USER_ID = "00000000-0000-4000-8000-000000000001";
const SAMPLE_FICHE_ID = "00000000-0000-4000-8000-000000000101";
const DATA_FILE = path.join(process.cwd(), "data", "database.json");

const DEMO_PASSWORD_HASH =
  "demo-sel-ehuzu-2026:9affe4211a76528b1592af0df028a06056b06f6e97bebbcec2d73a867fe8c56fcb55290a2e77e7d3c8b3ebe759827de7126e6362bbd5c9b1343a9b9d91718bf9";

const DEFAULT_ADMIN_EMAILS = ["enseignant@ehuzu.test"];
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";
const APP_SETTINGS_ID = "global";

type PgPool = import("pg").Pool;
type PgRow = Record<string, unknown>;

const globalForPg = globalThis as typeof globalThis & {
  fichesPool?: PgPool;
  fichesSeeded?: boolean;
  fichesPostgresDisabled?: boolean;
  fichesPostgresError?: string;
  fichesLocalDb?: DatabaseShape;
};

function nowIso(): string {
  return new Date().toISOString();
}

function usePostgres(): boolean {
  return Boolean(databaseConnectionString()) && !globalForPg.fichesPostgresDisabled;
}

function databaseConnectionString(): string | undefined {
  const candidate =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.SUPABASE_DB_URL ||
    process.env.SUPABASE_POSTGRES_URL;

  const value = candidate?.trim();
  if (!value || !/^postgres(ql)?:\/\//i.test(value)) {
    return undefined;
  }
  return value;
}

function postgresConnectionStringForPool(): string | undefined {
  const connectionString = databaseConnectionString();
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

async function getPool(): Promise<PgPool> {
  if (globalForPg.fichesPool) {
    return globalForPg.fichesPool;
  }

  const { Pool } = await import("pg");
  globalForPg.fichesPool = new Pool({
    connectionString: postgresConnectionStringForPool(),
    ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false }
  });
  return globalForPg.fichesPool;
}

function disablePostgres(error: unknown): void {
  globalForPg.fichesPostgresDisabled = true;
  globalForPg.fichesPostgresError = error instanceof Error ? error.message : String(error);
}

function asIso(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}

function asContent(value: unknown): FicheContenu {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as FicheContenu;
  }
  return {};
}

function adminEmails(): Set<string> {
  const emails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...DEFAULT_ADMIN_EMAILS, ...emails]);
}

function asUserRole(value: unknown, email?: string): UserRole {
  if (value === "admin" || value === "enseignant" || value === "suspendu") {
    return value;
  }
  return email && adminEmails().has(email.toLowerCase()) ? "admin" : "enseignant";
}

function toUser(row: PgRow): UserRecord {
  return {
    id: String(row.id),
    nom: String(row.nom),
    email: String(row.email),
    mot_de_passe: String(row.mot_de_passe),
    role: asUserRole(row.role, String(row.email)),
    date_creation: asIso(row.date_creation)
  };
}

function toFiche(row: PgRow): FicheRecord {
  return {
    id: String(row.id),
    utilisateur_id: String(row.utilisateur_id),
    titre: String(row.titre),
    matiere: String(row.matiere),
    classe: String(row.classe),
    contenu_json: asContent(row.contenu_json),
    date_creation: asIso(row.date_creation),
    date_modification: asIso(row.date_modification)
  };
}

function toHistorique(row: PgRow): HistoriqueRecord {
  return {
    id: String(row.id),
    fiche_id: String(row.fiche_id),
    version: Number(row.version),
    contenu: asContent(row.contenu),
    date: asIso(row.date)
  };
}

function toImportActivity(row: PgRow): ImportActivityRecord {
  return {
    id: String(row.id),
    utilisateur_id: String(row.utilisateur_id),
    fiche_id: row.fiche_id ? String(row.fiche_id) : undefined,
    source: row.source === "gemini" ? "gemini" : "local",
    statut: row.statut === "erreur" ? "erreur" : "succes",
    message: row.message ? String(row.message) : undefined,
    modele: row.modele ? String(row.modele) : undefined,
    tokens_entree: Number(row.tokens_entree ?? 0),
    tokens_sortie: Number(row.tokens_sortie ?? 0),
    tokens_total: Number(row.tokens_total ?? 0),
    date: asIso(row.date)
  };
}

function normalizeGeminiModel(value: unknown): string {
  const model = typeof value === "string" ? value.trim() : "";
  return model || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
}

function toAppSettings(row?: PgRow): AppSettingsRecord {
  return {
    gemini_api_key: row?.gemini_api_key ? String(row.gemini_api_key) : undefined,
    gemini_model: normalizeGeminiModel(row?.gemini_model),
    date_modification: row?.date_modification ? asIso(row.date_modification) : undefined
  };
}

function initialAppSettings(): AppSettingsRecord {
  return {
    gemini_model: normalizeGeminiModel(process.env.GEMINI_MODEL),
    date_modification: nowIso()
  };
}

function maskSecret(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const visible = value.slice(-4);
  return `**** ${visible}`;
}

function sampleFiche(): FicheContenu {
  return {
    fiche_de: "Mathématiques",
    dossier_ou_unite: "Nombres et calculs",
    san: "Résolution de problèmes de la vie courante",
    sequence: "Additionner des nombres entiers",
    date: "2026-05-21",
    cours: "CM1",
    fiche_no: "001",
    duree: "45 min",
    contenu_de_formation: "Addition de nombres entiers dans une situation concrète.",
    competences_disciplinaires:
      "Résoudre une situation-problème en utilisant correctement l’addition.",
    competences_transversales:
      "Communiquer avec clarté, coopérer dans un groupe et justifier sa démarche.",
    connaissances_et_techniques:
      "Sens de l’addition, alignement des chiffres, calcul posé, vérification du résultat.",
    strategie_objet_apprentissage:
      "Observation d’une situation, manipulation, recherche en groupe, mise en commun.",
    strategies_enseignement_apprentissage_evaluation:
      "Questionnement, travail individuel, échange entre pairs, correction collective.",
    materiel: "Ardoises, craies, tableau, étiquettes-nombres, cahiers d’activités.",
    deroulement: [
      {
        etape: "Mise en train",
        duree: "5 min",
        activites_enseignant: "Présente une situation simple liée au marché.",
        activites_apprenants: "Écoutent, reformulent et répondent oralement.",
        consignes: "Observez la situation et dites ce qu’il faut chercher.",
        resultats_attendus: "Les apprenants identifient l’opération à effectuer.",
        evaluation: "Réponses orales."
      },
      {
        etape: "Recherche",
        duree: "15 min",
        activites_enseignant: "Organise les groupes et accompagne les essais.",
        activites_apprenants: "Calculent, comparent leurs procédures et notent la réponse.",
        consignes: "Travaillez en groupe et expliquez votre démarche.",
        resultats_attendus: "Chaque groupe propose une méthode correcte.",
        evaluation: "Observation des productions."
      },
      {
        etape: "Structuration",
        duree: "15 min",
        activites_enseignant: "Fait mettre en commun et formalise la technique opératoire.",
        activites_apprenants: "Présentent, corrigent et recopient la trace écrite.",
        consignes: "Comparez les méthodes et retenez la règle.",
        resultats_attendus: "La technique de l’addition posée est stabilisée.",
        evaluation: "Exercice court au tableau."
      }
    ],
    resultats_attendus:
      "À la fin de la séance, l’apprenant résout correctement une addition de nombres entiers dans une situation-problème."
  };
}

function initialDatabase(): DatabaseShape {
  const date = nowIso();
  const contenu = sampleFiche();
  const meta = inferFicheMeta(contenu);
  const fiche: FicheRecord = {
    id: SAMPLE_FICHE_ID,
    utilisateur_id: DEFAULT_USER_ID,
    titre: meta.titre,
    matiere: meta.matiere,
    classe: meta.classe,
    contenu_json: contenu,
    date_creation: date,
    date_modification: date
  };

  return {
    utilisateurs: [
      {
        id: DEFAULT_USER_ID,
        nom: "Enseignant démonstration",
        email: "enseignant@ehuzu.test",
        mot_de_passe: DEMO_PASSWORD_HASH,
        role: "admin",
        date_creation: date
      }
    ],
    fiches: [fiche],
    historique: [
      {
        id: randomUUID(),
        fiche_id: fiche.id,
        version: 1,
        contenu,
        date
      }
    ],
    import_activites: [],
    parametres_app: initialAppSettings()
  };
}

async function ensurePostgresSeed(): Promise<boolean> {
  if (globalForPg.fichesPostgresDisabled) {
    return false;
  }

  if (globalForPg.fichesSeeded) {
    return true;
  }

  try {
  const pool = await getPool();
  await pool.query(`
    create table if not exists utilisateurs (
      id uuid primary key,
      nom text not null,
      email text not null unique,
      mot_de_passe text not null,
      role text not null default 'enseignant',
      date_creation timestamptz not null default now()
    )
  `);
  await pool.query("alter table utilisateurs add column if not exists role text not null default 'enseignant'");
  await pool.query(`
    create table if not exists fiches (
      id uuid primary key,
      utilisateur_id uuid not null references utilisateurs(id) on delete cascade,
      titre text not null,
      matiere text not null,
      classe text not null,
      contenu_json jsonb not null,
      date_creation timestamptz not null default now(),
      date_modification timestamptz not null default now()
    )
  `);
  await pool.query("create index if not exists fiches_utilisateur_date_idx on fiches (utilisateur_id, date_modification desc)");
  await pool.query(`
    create table if not exists historique (
      id uuid primary key,
      fiche_id uuid not null references fiches(id) on delete cascade,
      version integer not null,
      contenu jsonb not null,
      date timestamptz not null default now()
    )
  `);
  await pool.query("create unique index if not exists historique_fiche_version_idx on historique (fiche_id, version)");
  await pool.query(`
    create table if not exists import_activites (
      id uuid primary key,
      utilisateur_id uuid not null references utilisateurs(id) on delete cascade,
      fiche_id uuid references fiches(id) on delete set null,
      source text not null,
      statut text not null,
      message text,
      modele text,
      tokens_entree integer not null default 0,
      tokens_sortie integer not null default 0,
      tokens_total integer not null default 0,
      date timestamptz not null default now()
    )
  `);
  await pool.query("create index if not exists import_activites_date_idx on import_activites (date desc)");
  await pool.query("create index if not exists import_activites_user_date_idx on import_activites (utilisateur_id, date desc)");
  await pool.query(`
    create table if not exists parametres_app (
      id text primary key,
      gemini_api_key text,
      gemini_model text not null default 'gemini-2.5-flash-lite',
      date_modification timestamptz not null default now()
    )
  `);
  await pool.query(
    `insert into parametres_app (id, gemini_model, date_modification)
     values ($1, $2, now())
     on conflict (id) do nothing`,
    [APP_SETTINGS_ID, normalizeGeminiModel(process.env.GEMINI_MODEL)]
  );

  const db = initialDatabase();
  const user = db.utilisateurs[0];
  const fiche = db.fiches[0];
  const history = db.historique[0];

  await pool.query(
    `insert into utilisateurs (id, nom, email, mot_de_passe, role, date_creation)
     values ($1, $2, $3, $4, $5, $6)
     on conflict (id) do update set role = excluded.role`,
    [user.id, user.nom, user.email, user.mot_de_passe, user.role, user.date_creation]
  );

  for (const email of adminEmails()) {
    await pool.query("update utilisateurs set role = 'admin' where lower(email) = lower($1)", [email]);
  }

  await pool.query(
    `insert into fiches
      (id, utilisateur_id, titre, matiere, classe, contenu_json, date_creation, date_modification)
     values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
     on conflict (id) do nothing`,
    [
      fiche.id,
      fiche.utilisateur_id,
      fiche.titre,
      fiche.matiere,
      fiche.classe,
      JSON.stringify(fiche.contenu_json),
      fiche.date_creation,
      fiche.date_modification
    ]
  );

  await pool.query(
    `insert into historique (id, fiche_id, version, contenu, date)
     values ($1, $2, $3, $4::jsonb, $5)
     on conflict (fiche_id, version) do nothing`,
    [history.id, history.fiche_id, history.version, JSON.stringify(history.contenu), history.date]
  );

  globalForPg.fichesSeeded = true;
  return true;
  } catch (error) {
    disablePostgres(error);
    return false;
  }
}

async function readDatabase(): Promise<DatabaseShape> {
  if (globalForPg.fichesLocalDb) {
    return globalForPg.fichesLocalDb;
  }

  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const db = normalizeDatabase(JSON.parse(raw) as Partial<DatabaseShape>);
    globalForPg.fichesLocalDb = db;
    return db;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      const db = initialDatabase();
      globalForPg.fichesLocalDb = db;
      return db;
    }

    const db = initialDatabase();
    await writeDatabase(db);
    return db;
  }
}

function normalizeDatabase(db: Partial<DatabaseShape>): DatabaseShape {
  return {
    utilisateurs: (db.utilisateurs ?? []).map((user) => ({
      ...user,
      role: asUserRole(user.role, user.email)
    })) as UserRecord[],
    fiches: db.fiches ?? [],
    historique: db.historique ?? [],
    import_activites: db.import_activites ?? [],
    parametres_app: {
      ...initialAppSettings(),
      ...(db.parametres_app ?? {}),
      gemini_model: normalizeGeminiModel(db.parametres_app?.gemini_model)
    }
  };
}

async function writeDatabase(db: DatabaseShape): Promise<void> {
  globalForPg.fichesLocalDb = db;
  try {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, `${JSON.stringify(db, null, 2)}\n`, "utf8");
  } catch {
    // En hébergement serverless sans DATABASE_URL, le système de fichiers peut être en lecture seule.
    // On garde alors un stockage mémoire pour que l'application reste utilisable.
  }
}

export async function getUserByEmail(email: string): Promise<UserRecord | undefined> {
  if (usePostgres() && (await ensurePostgresSeed())) {
    const pool = await getPool();
    const result = await pool.query("select * from utilisateurs where lower(email) = lower($1) limit 1", [email]);
    return result.rows[0] ? toUser(result.rows[0]) : undefined;
  }

  const db = await readDatabase();
  return db.utilisateurs.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

export async function getUserById(id: string): Promise<UserRecord | undefined> {
  if (usePostgres() && (await ensurePostgresSeed())) {
    const pool = await getPool();
    const result = await pool.query("select * from utilisateurs where id = $1 limit 1", [id]);
    return result.rows[0] ? toUser(result.rows[0]) : undefined;
  }

  const db = await readDatabase();
  return db.utilisateurs.find((user) => user.id === id);
}

export async function createUser(input: {
  nom: string;
  email: string;
  mot_de_passe: string;
}): Promise<UserRecord> {
  if (usePostgres() && (await ensurePostgresSeed())) {
    const pool = await getPool();
    try {
      const role = asUserRole(undefined, input.email);
      const result = await pool.query(
        `insert into utilisateurs (id, nom, email, mot_de_passe, role, date_creation)
         values ($1, $2, lower($3), $4, $5, $6)
         returning *`,
        [randomUUID(), input.nom, input.email, input.mot_de_passe, role, nowIso()]
      );
      return toUser(result.rows[0]);
    } catch (error) {
      if ((error as { code?: string }).code === "23505") {
        throw new Error("Un compte existe déjà avec ce courriel.");
      }
      throw error;
    }
  }

  const db = await readDatabase();
  const existing = db.utilisateurs.find((user) => user.email.toLowerCase() === input.email.toLowerCase());
  if (existing) {
    throw new Error("Un compte existe déjà avec ce courriel.");
  }

  const user: UserRecord = {
    id: randomUUID(),
    nom: input.nom,
    email: input.email.toLowerCase(),
    mot_de_passe: input.mot_de_passe,
    role: asUserRole(undefined, input.email),
    date_creation: nowIso()
  };

  db.utilisateurs.push(user);
  await writeDatabase(db);
  return user;
}

export async function listFiches(userId: string): Promise<FicheRecord[]> {
  if (usePostgres() && (await ensurePostgresSeed())) {
    const pool = await getPool();
    const result = await pool.query(
      "select * from fiches where utilisateur_id = $1 order by date_modification desc",
      [userId]
    );
    return result.rows.map(toFiche);
  }

  const db = await readDatabase();
  return db.fiches
    .filter((fiche) => fiche.utilisateur_id === userId)
    .sort((a, b) => b.date_modification.localeCompare(a.date_modification));
}

export async function getFiche(id: string, userId: string): Promise<FicheRecord | undefined> {
  if (usePostgres() && (await ensurePostgresSeed())) {
    const pool = await getPool();
    const result = await pool.query("select * from fiches where id = $1 and utilisateur_id = $2 limit 1", [
      id,
      userId
    ]);
    return result.rows[0] ? toFiche(result.rows[0]) : undefined;
  }

  const db = await readDatabase();
  return db.fiches.find((fiche) => fiche.id === id && fiche.utilisateur_id === userId);
}

export async function createFiche(userId: string, contenu: FicheContenu = createEmptyFiche()): Promise<FicheRecord> {
  if (usePostgres() && (await ensurePostgresSeed())) {
    const pool = await getPool();
    const date = nowIso();
    const meta = inferFicheMeta(contenu);
    const id = randomUUID();
    const ficheResult = await pool.query(
      `insert into fiches
        (id, utilisateur_id, titre, matiere, classe, contenu_json, date_creation, date_modification)
       values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
       returning *`,
      [id, userId, meta.titre, meta.matiere, meta.classe, JSON.stringify(contenu), date, date]
    );

    await pool.query(
      `insert into historique (id, fiche_id, version, contenu, date)
       values ($1, $2, 1, $3::jsonb, $4)`,
      [randomUUID(), id, JSON.stringify(contenu), date]
    );

    return toFiche(ficheResult.rows[0]);
  }

  const db = await readDatabase();
  const date = nowIso();
  const meta = inferFicheMeta(contenu);
  const fiche: FicheRecord = {
    id: randomUUID(),
    utilisateur_id: userId,
    titre: meta.titre,
    matiere: meta.matiere,
    classe: meta.classe,
    contenu_json: contenu,
    date_creation: date,
    date_modification: date
  };

  db.fiches.push(fiche);
  db.historique.push({
    id: randomUUID(),
    fiche_id: fiche.id,
    version: 1,
    contenu,
    date
  });
  await writeDatabase(db);
  return fiche;
}

export async function importFiche(contenu: FicheContenu, userId = DEFAULT_USER_ID): Promise<FicheRecord> {
  return createFiche(userId, contenu);
}

export async function updateFiche(
  id: string,
  userId: string,
  contenu: FicheContenu
): Promise<FicheRecord | undefined> {
  if (usePostgres() && (await ensurePostgresSeed())) {
    const pool = await getPool();
    const current = await getFiche(id, userId);
    if (!current) {
      return undefined;
    }

    const date = nowIso();
    const meta = inferFicheMeta(contenu);
    const changed = JSON.stringify(current.contenu_json) !== JSON.stringify(contenu);
    const updated = await pool.query(
      `update fiches
       set titre = $1,
           matiere = $2,
           classe = $3,
           contenu_json = $4::jsonb,
           date_modification = $5
       where id = $6 and utilisateur_id = $7
       returning *`,
      [meta.titre, meta.matiere, meta.classe, JSON.stringify(contenu), date, id, userId]
    );

    if (changed) {
      const versionResult = await pool.query(
        "select coalesce(max(version), 0) + 1 as next_version from historique where fiche_id = $1",
        [id]
      );
      await pool.query(
        `insert into historique (id, fiche_id, version, contenu, date)
         values ($1, $2, $3, $4::jsonb, $5)`,
        [randomUUID(), id, Number(versionResult.rows[0].next_version), JSON.stringify(contenu), date]
      );
    }

    return updated.rows[0] ? toFiche(updated.rows[0]) : undefined;
  }

  const db = await readDatabase();
  const index = db.fiches.findIndex((fiche) => fiche.id === id && fiche.utilisateur_id === userId);
  if (index === -1) {
    return undefined;
  }

  const date = nowIso();
  const meta = inferFicheMeta(contenu);
  const fiche = db.fiches[index];
  const lastVersion = db.historique
    .filter((entry) => entry.fiche_id === id)
    .sort((a, b) => b.version - a.version)[0];

  const changed = JSON.stringify(fiche.contenu_json) !== JSON.stringify(contenu);
  const updated: FicheRecord = {
    ...fiche,
    titre: meta.titre,
    matiere: meta.matiere,
    classe: meta.classe,
    contenu_json: contenu,
    date_modification: date
  };

  db.fiches[index] = updated;

  if (changed) {
    db.historique.push({
      id: randomUUID(),
      fiche_id: id,
      version: (lastVersion?.version ?? 0) + 1,
      contenu,
      date
    });
  }

  await writeDatabase(db);
  return updated;
}

export async function deleteFiche(id: string, userId: string): Promise<boolean> {
  if (usePostgres() && (await ensurePostgresSeed())) {
    const pool = await getPool();
    const result = await pool.query("delete from fiches where id = $1 and utilisateur_id = $2 returning id", [
      id,
      userId
    ]);
    return (result.rowCount ?? 0) > 0;
  }

  const db = await readDatabase();
  const before = db.fiches.length;
  db.fiches = db.fiches.filter((fiche) => !(fiche.id === id && fiche.utilisateur_id === userId));
  if (db.fiches.length === before) {
    return false;
  }

  db.historique = db.historique.filter((entry) => entry.fiche_id !== id);
  await writeDatabase(db);
  return true;
}

export async function listUsersForAdmin(): Promise<UserRecord[]> {
  if (usePostgres() && (await ensurePostgresSeed())) {
    const pool = await getPool();
    const result = await pool.query("select * from utilisateurs order by date_creation desc");
    return result.rows.map(toUser);
  }

  const db = await readDatabase();
  return [...db.utilisateurs].sort((a, b) => b.date_creation.localeCompare(a.date_creation));
}

export async function updateUserRole(id: string, role: UserRole): Promise<UserRecord | undefined> {
  if (usePostgres() && (await ensurePostgresSeed())) {
    const pool = await getPool();
    const result = await pool.query("update utilisateurs set role = $1 where id = $2 returning *", [role, id]);
    return result.rows[0] ? toUser(result.rows[0]) : undefined;
  }

  const db = await readDatabase();
  const index = db.utilisateurs.findIndex((user) => user.id === id);
  if (index === -1) {
    return undefined;
  }

  db.utilisateurs[index] = { ...db.utilisateurs[index], role };
  await writeDatabase(db);
  return db.utilisateurs[index];
}

export async function getGeminiSettings(): Promise<AppSettingsRecord> {
  if (usePostgres() && (await ensurePostgresSeed())) {
    const pool = await getPool();
    const result = await pool.query("select * from parametres_app where id = $1 limit 1", [APP_SETTINGS_ID]);
    return toAppSettings(result.rows[0]);
  }

  const db = await readDatabase();
  return db.parametres_app;
}

export async function updateGeminiSettings(input: {
  gemini_api_key?: string;
  gemini_model?: string;
  effacer_cle?: boolean;
}): Promise<AppSettingsRecord> {
  const current = await getGeminiSettings();
  const next: AppSettingsRecord = {
    gemini_api_key: input.effacer_cle
      ? undefined
      : input.gemini_api_key !== undefined
        ? input.gemini_api_key.trim() || undefined
        : current.gemini_api_key,
    gemini_model: normalizeGeminiModel(input.gemini_model ?? current.gemini_model),
    date_modification: nowIso()
  };

  if (usePostgres() && (await ensurePostgresSeed())) {
    const pool = await getPool();
    const result = await pool.query(
      `insert into parametres_app (id, gemini_api_key, gemini_model, date_modification)
       values ($1, $2, $3, $4)
       on conflict (id) do update
       set gemini_api_key = excluded.gemini_api_key,
           gemini_model = excluded.gemini_model,
           date_modification = excluded.date_modification
       returning *`,
      [APP_SETTINGS_ID, next.gemini_api_key ?? null, next.gemini_model, next.date_modification]
    );
    return toAppSettings(result.rows[0]);
  }

  const db = await readDatabase();
  db.parametres_app = next;
  await writeDatabase(db);
  return next;
}

export async function getGeminiRuntimeConfig(): Promise<{
  apiKey?: string;
  model: string;
  source: "admin" | "environnement" | "absent";
}> {
  const settings = await getGeminiSettings();
  if (settings.gemini_api_key) {
    return { apiKey: settings.gemini_api_key, model: settings.gemini_model, source: "admin" };
  }

  if (process.env.GEMINI_API_KEY) {
    return {
      apiKey: process.env.GEMINI_API_KEY,
      model: settings.gemini_model,
      source: "environnement"
    };
  }

  return { model: settings.gemini_model, source: "absent" };
}

export async function getGeminiAdminStatus(): Promise<{
  actif: boolean;
  modele: string;
  source: "admin" | "environnement" | "absent";
  apercu_cle?: string;
  date_modification?: string;
  stockage: "postgres" | "temporaire";
  stockage_persistant: boolean;
  avertissement?: string;
}> {
  const settings = await getGeminiSettings();
  const runtime = await getGeminiRuntimeConfig();
  const stockagePersistant = usePostgres();
  const stockage = stockagePersistant ? "postgres" : "temporaire";
  const avertissement =
    !stockagePersistant && runtime.source === "admin"
      ? "La clé est active, mais elle est enregistrée dans un stockage temporaire Vercel. Elle peut disparaître. Pour une clé durable, ajoutez GEMINI_API_KEY dans les variables d'environnement Vercel ou configurez une base PostgreSQL/Supabase."
      : !stockagePersistant && runtime.source === "absent"
        ? "Aucune base PostgreSQL persistante n'est configurée. Une clé enregistrée ici peut disparaître sur Vercel. La solution la plus fiable est d'ajouter GEMINI_API_KEY dans les variables d'environnement Vercel."
        : undefined;

  return {
    actif: Boolean(runtime.apiKey),
    modele: runtime.model,
    source: runtime.source,
    apercu_cle: runtime.source === "admin" ? maskSecret(settings.gemini_api_key) : maskSecret(process.env.GEMINI_API_KEY),
    date_modification: settings.date_modification,
    stockage,
    stockage_persistant: stockagePersistant,
    avertissement
  };
}

export async function recordImportActivity(input: {
  utilisateur_id: string;
  fiche_id?: string;
  source: "gemini" | "local";
  statut: "succes" | "erreur";
  message?: string;
  modele?: string;
  tokens_entree?: number;
  tokens_sortie?: number;
  tokens_total?: number;
}): Promise<ImportActivityRecord> {
  const activity: ImportActivityRecord = {
    id: randomUUID(),
    utilisateur_id: input.utilisateur_id,
    fiche_id: input.fiche_id,
    source: input.source,
    statut: input.statut,
    message: input.message,
    modele: input.modele,
    tokens_entree: input.tokens_entree ?? 0,
    tokens_sortie: input.tokens_sortie ?? 0,
    tokens_total: input.tokens_total ?? 0,
    date: nowIso()
  };

  if (usePostgres() && (await ensurePostgresSeed())) {
    const pool = await getPool();
    const result = await pool.query(
      `insert into import_activites
        (id, utilisateur_id, fiche_id, source, statut, message, modele, tokens_entree, tokens_sortie, tokens_total, date)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       returning *`,
      [
        activity.id,
        activity.utilisateur_id,
        activity.fiche_id ?? null,
        activity.source,
        activity.statut,
        activity.message ?? null,
        activity.modele ?? null,
        activity.tokens_entree,
        activity.tokens_sortie,
        activity.tokens_total,
        activity.date
      ]
    );
    return toImportActivity(result.rows[0]);
  }

  const db = await readDatabase();
  db.import_activites.unshift(activity);
  db.import_activites = db.import_activites.slice(0, 500);
  await writeDatabase(db);
  return activity;
}

export async function listImportActivities(limit = 50): Promise<ImportActivityRecord[]> {
  if (usePostgres() && (await ensurePostgresSeed())) {
    const pool = await getPool();
    const result = await pool.query("select * from import_activites order by date desc limit $1", [limit]);
    return result.rows.map(toImportActivity);
  }

  const db = await readDatabase();
  return db.import_activites.slice(0, limit);
}

export async function getAdminOverview(): Promise<{
  utilisateurs: number;
  enseignants: number;
  admins: number;
  suspendus: number;
  fiches: number;
  imports: number;
  importsGemini: number;
  tokensTotal: number;
}> {
  if (usePostgres() && (await ensurePostgresSeed())) {
    const pool = await getPool();
    const [users, fiches, imports] = await Promise.all([
      pool.query(
        `select
          count(*)::int as total,
          count(*) filter (where role = 'enseignant')::int as enseignants,
          count(*) filter (where role = 'admin')::int as admins,
          count(*) filter (where role = 'suspendu')::int as suspendus
         from utilisateurs`
      ),
      pool.query("select count(*)::int as total from fiches"),
      pool.query(
        `select
          count(*)::int as total,
          count(*) filter (where source = 'gemini')::int as gemini,
          coalesce(sum(tokens_total), 0)::int as tokens
         from import_activites`
      )
    ]);

    return {
      utilisateurs: Number(users.rows[0].total ?? 0),
      enseignants: Number(users.rows[0].enseignants ?? 0),
      admins: Number(users.rows[0].admins ?? 0),
      suspendus: Number(users.rows[0].suspendus ?? 0),
      fiches: Number(fiches.rows[0].total ?? 0),
      imports: Number(imports.rows[0].total ?? 0),
      importsGemini: Number(imports.rows[0].gemini ?? 0),
      tokensTotal: Number(imports.rows[0].tokens ?? 0)
    };
  }

  const db = await readDatabase();
  return {
    utilisateurs: db.utilisateurs.length,
    enseignants: db.utilisateurs.filter((user) => user.role === "enseignant").length,
    admins: db.utilisateurs.filter((user) => user.role === "admin").length,
    suspendus: db.utilisateurs.filter((user) => user.role === "suspendu").length,
    fiches: db.fiches.length,
    imports: db.import_activites.length,
    importsGemini: db.import_activites.filter((activity) => activity.source === "gemini").length,
    tokensTotal: db.import_activites.reduce((total, activity) => total + activity.tokens_total, 0)
  };
}

export async function listHistorique(ficheId: string, userId: string): Promise<HistoriqueRecord[]> {
  if (usePostgres() && (await ensurePostgresSeed())) {
    const pool = await getPool();
    const fiche = await getFiche(ficheId, userId);
    if (!fiche) {
      return [];
    }

    const result = await pool.query("select * from historique where fiche_id = $1 order by version desc", [
      ficheId
    ]);
    return result.rows.map(toHistorique);
  }

  const db = await readDatabase();
  const fiche = db.fiches.find((item) => item.id === ficheId && item.utilisateur_id === userId);
  if (!fiche) {
    return [];
  }

  return db.historique
    .filter((entry) => entry.fiche_id === ficheId)
    .sort((a, b) => b.version - a.version);
}

export async function listHistoriqueForUser(userId: string): Promise<Array<HistoriqueRecord & { fiche?: FicheRecord }>> {
  if (usePostgres() && (await ensurePostgresSeed())) {
    const pool = await getPool();
    const result = await pool.query(
      `select
        h.id,
        h.fiche_id,
        h.version,
        h.contenu,
        h.date,
        f.id as fiche_join_id,
        f.utilisateur_id,
        f.titre,
        f.matiere,
        f.classe,
        f.contenu_json,
        f.date_creation,
        f.date_modification
       from historique h
       join fiches f on f.id = h.fiche_id
       where f.utilisateur_id = $1
       order by h.date desc`,
      [userId]
    );

    return result.rows.map((row) => {
      const historique = toHistorique(row);
      const fiche = toFiche({ ...row, id: row.fiche_join_id });
      return { ...historique, fiche };
    });
  }

  const db = await readDatabase();
  const fiches = db.fiches.filter((fiche) => fiche.utilisateur_id === userId);
  const ficheIds = new Set(fiches.map((fiche) => fiche.id));

  return db.historique
    .filter((entry) => ficheIds.has(entry.fiche_id))
    .map((entry) => ({
      ...entry,
      fiche: fiches.find((fiche) => fiche.id === entry.fiche_id)
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}
