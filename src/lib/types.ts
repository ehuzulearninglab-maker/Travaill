export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type FicheContenu = Record<string, JsonValue>;

export type UserRole = "admin" | "enseignant" | "suspendu";

export type FicheRecord = {
  id: string;
  utilisateur_id: string;
  titre: string;
  matiere: string;
  classe: string;
  contenu_json: FicheContenu;
  date_creation: string;
  date_modification: string;
};

export type HistoriqueRecord = {
  id: string;
  fiche_id: string;
  version: number;
  contenu: FicheContenu;
  date: string;
};

export type UserRecord = {
  id: string;
  nom: string;
  email: string;
  mot_de_passe: string;
  role: UserRole;
  date_creation: string;
};

export type ImportActivityRecord = {
  id: string;
  utilisateur_id: string;
  fiche_id?: string;
  source: "gemini" | "local";
  statut: "succes" | "erreur";
  message?: string;
  modele?: string;
  tokens_entree: number;
  tokens_sortie: number;
  tokens_total: number;
  date: string;
};

export type AppSettingsRecord = {
  gemini_api_key?: string;
  gemini_model: string;
  date_modification?: string;
};

export type DatabaseShape = {
  utilisateurs: UserRecord[];
  fiches: FicheRecord[];
  historique: HistoriqueRecord[];
  import_activites: ImportActivityRecord[];
  parametres_app: AppSettingsRecord;
};

export type DeroulementRow = {
  etape: string;
  duree: string;
  activites_enseignant: string;
  activites_apprenants: string;
  consignes: string;
  resultats_attendus: string;
  evaluation: string;
};
