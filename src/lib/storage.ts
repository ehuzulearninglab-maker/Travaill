import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { createEmptyFiche, inferFicheMeta } from "@/lib/fiche-utils";
import type { DatabaseShape, FicheContenu, FicheRecord, HistoriqueRecord, UserRecord } from "@/lib/types";

export const DEFAULT_USER_ID = "00000000-0000-4000-8000-000000000001";
const SAMPLE_FICHE_ID = "00000000-0000-4000-8000-000000000101";
const DATA_FILE = path.join(process.cwd(), "data", "database.json");

const DEMO_PASSWORD_HASH =
  "demo-sel-ehuzu-2026:9affe4211a76528b1592af0df028a06056b06f6e97bebbcec2d73a867fe8c56fcb55290a2e77e7d3c8b3ebe759827de7126e6362bbd5c9b1343a9b9d91718bf9";

type PgPool = import("pg").Pool;
type PgRow = Record<string, unknown>;

const globalForPg = globalThis as typeof globalThis & {
  fichesPool?: PgPool;
  fichesSeeded?: boolean;
};

function nowIso(): string {
  return new Date().toISOString();
}

function usePostgres(): boolean {
  return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL);
}

async function getPool(): Promise<PgPool> {
  if (globalForPg.fichesPool) {
    return globalForPg.fichesPool;
  }

  const { Pool } = await import("pg");
  globalForPg.fichesPool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL,
    ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false }
  });
  return globalForPg.fichesPool;
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

function toUser(row: PgRow): UserRecord {
  return {
    id: String(row.id),
    nom: String(row.nom),
    email: String(row.email),
    mot_de_passe: String(row.mot_de_passe),
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
    ]
  };
}

async function ensurePostgresSeed(): Promise<void> {
  if (globalForPg.fichesSeeded) {
    return;
  }

  const pool = await getPool();
  const db = initialDatabase();
  const user = db.utilisateurs[0];
  const fiche = db.fiches[0];
  const history = db.historique[0];

  await pool.query(
    `insert into utilisateurs (id, nom, email, mot_de_passe, date_creation)
     values ($1, $2, $3, $4, $5)
     on conflict (id) do nothing`,
    [user.id, user.nom, user.email, user.mot_de_passe, user.date_creation]
  );

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
}

async function readDatabase(): Promise<DatabaseShape> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw) as DatabaseShape;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }

    const db = initialDatabase();
    await writeDatabase(db);
    return db;
  }
}

async function writeDatabase(db: DatabaseShape): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, `${JSON.stringify(db, null, 2)}\n`, "utf8");
}

export async function getUserByEmail(email: string): Promise<UserRecord | undefined> {
  if (usePostgres()) {
    await ensurePostgresSeed();
    const pool = await getPool();
    const result = await pool.query("select * from utilisateurs where lower(email) = lower($1) limit 1", [email]);
    return result.rows[0] ? toUser(result.rows[0]) : undefined;
  }

  const db = await readDatabase();
  return db.utilisateurs.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

export async function getUserById(id: string): Promise<UserRecord | undefined> {
  if (usePostgres()) {
    await ensurePostgresSeed();
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
  if (usePostgres()) {
    await ensurePostgresSeed();
    const pool = await getPool();
    try {
      const result = await pool.query(
        `insert into utilisateurs (id, nom, email, mot_de_passe, date_creation)
         values ($1, $2, lower($3), $4, $5)
         returning *`,
        [randomUUID(), input.nom, input.email, input.mot_de_passe, nowIso()]
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
    date_creation: nowIso()
  };

  db.utilisateurs.push(user);
  await writeDatabase(db);
  return user;
}

export async function listFiches(userId: string): Promise<FicheRecord[]> {
  if (usePostgres()) {
    await ensurePostgresSeed();
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
  if (usePostgres()) {
    await ensurePostgresSeed();
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
  if (usePostgres()) {
    await ensurePostgresSeed();
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
  if (usePostgres()) {
    await ensurePostgresSeed();
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

export async function listHistorique(ficheId: string, userId: string): Promise<HistoriqueRecord[]> {
  if (usePostgres()) {
    await ensurePostgresSeed();
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
  if (usePostgres()) {
    await ensurePostgresSeed();
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
