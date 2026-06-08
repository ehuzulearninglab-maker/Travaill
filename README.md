# Récepteur de fiches pédagogiques

Application web Next.js destinée à recevoir des fiches validées depuis un GPT personnalisé, les afficher dans un canevas pédagogique, les modifier, les sauvegarder et les exporter.

Application publiée : https://travaill.vercel.app

## Points clés

- Interface entièrement orientée enseignants, en français.
- Aucune génération d’IA dans l’application.
- Aucune clé OpenAI demandée ou utilisée.
- Route d’import sécurisée : `POST /api/fiches/import`.
- Canevas flexible : les champs non prévus sont affichés dans les sections supplémentaires.
- Sauvegarde automatique et historique de versions.
- Export PDF, export Word et impression.
- Connexion, inscription et point d’entrée pour la récupération de mot de passe.

## Installation

```bash
npm install
npm run dev
```

Ouvrir ensuite `http://localhost:3000`.

Compte de démonstration :

- Courriel : `enseignant@ehuzu.test`
- Mot de passe : `enseignant-demo`

## Variables d’environnement

Créer un fichier `.env.local` à partir de `.env.example`.

```bash
IMPORT_SECRET_KEY=CLE_SECURISEE
AUTH_SECRET=une-valeur-longue-et-secrète
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Import depuis le GPT personnalisé

Le GPT doit envoyer la fiche validée vers :

```http
POST /api/fiches/import
Content-Type: application/json
```

Exemple :

```json
{
  "utilisateur_email": "enseignant@ehuzu.test",
  "fiche_de": "Mathématiques",
  "classe": "CM1",
  "date": "2026-05-21",
  "duree": "45 min",
  "deroulement": [],
  "resultats_attendus": ""
}
```

Le champ `utilisateur_email` est obligatoire. Il doit contenir le courriel exact du compte enseignant qui doit recevoir la fiche. Si le compte n'existe pas encore dans l'application, l'import est refusé pour éviter que la fiche soit rattachée par erreur au compte administrateur.

Pour une action GPT, configurer l’authentification en clé API avec l’en-tête `x-import-secret`. Le corps JSON doit contenir directement les champs de la fiche.

Clé de test recommandée pour l’action GPT : `CLE_SECURISEE`.

## Base de données

En production, renseigner `DATABASE_URL` avec l’adresse PostgreSQL de Supabase. En local, si `DATABASE_URL` est absente, l’application utilise `data/database.json` pour permettre un démarrage rapide sans serveur externe.

Le schéma PostgreSQL de production est fourni dans `docs/schema-postgresql.sql`.

## Action GPT

Un exemple de schéma OpenAPI pour l’action GPT est disponible dans `docs/action-gpt-openapi.yaml`.

## Modèle pédagogique

Le canevas reprend les sections obligatoires du modèle fourni :

- fiche de, dossier ou unité, S.A.N, séquence, date, cours, fiche N°, durée ;
- éléments de planification ;
- contenu de formation ;
- compétences disciplinaires et transversales ;
- connaissances et techniques ;
- stratégies pédagogiques ;
- matériel ;
- grand tableau pédagogique ;
- consignes et résultats attendus ;
- sections supplémentaires selon la matière.

Le PDF vierge transmis comme référence est conservé dans `docs/modele-fiche-vierge.pdf`.

## Production

Pour une mise en production, remplacer le stockage fichier par PostgreSQL ou Supabase, configurer `AUTH_SECRET`, définir une vraie clé d’import et servir l’application derrière HTTPS.

## Déploiement gratuit conseillé

1. Pousser le code sur GitHub.
2. Créer un projet Supabase gratuit.
3. Exécuter `docs/schema-postgresql.sql` dans Supabase SQL Editor.
4. Créer un projet Vercel à partir du dépôt GitHub.
5. Ajouter les variables `DATABASE_URL`, `IMPORT_SECRET_KEY`, `AUTH_SECRET` et `NEXT_PUBLIC_APP_URL` dans Vercel.
6. Utiliser `/politique-confidentialite` comme URL de politique de confidentialité dans l’action GPT.
