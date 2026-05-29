create extension if not exists "pgcrypto";

create table if not exists utilisateurs (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  email text not null unique,
  mot_de_passe text not null,
  role text not null default 'enseignant',
  date_creation timestamptz not null default now()
);

alter table utilisateurs
  add column if not exists role text not null default 'enseignant';

create table if not exists fiches (
  id uuid primary key default gen_random_uuid(),
  utilisateur_id uuid not null references utilisateurs(id) on delete cascade,
  titre text not null,
  matiere text not null,
  classe text not null,
  contenu_json jsonb not null,
  date_creation timestamptz not null default now(),
  date_modification timestamptz not null default now()
);

create index if not exists fiches_utilisateur_date_idx
  on fiches (utilisateur_id, date_modification desc);

create table if not exists historique (
  id uuid primary key default gen_random_uuid(),
  fiche_id uuid not null references fiches(id) on delete cascade,
  version integer not null,
  contenu jsonb not null,
  date timestamptz not null default now()
);

create unique index if not exists historique_fiche_version_idx
  on historique (fiche_id, version);

create table if not exists import_activites (
  id uuid primary key default gen_random_uuid(),
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
);

create index if not exists import_activites_date_idx
  on import_activites (date desc);

create index if not exists import_activites_user_date_idx
  on import_activites (utilisateur_id, date desc);
