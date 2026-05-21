export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type FicheContenu = Record<string, JsonValue>;

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
  date_creation: string;
};

export type DatabaseShape = {
  utilisateurs: UserRecord[];
  fiches: FicheRecord[];
  historique: HistoriqueRecord[];
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
