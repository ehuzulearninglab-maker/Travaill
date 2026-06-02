# Administration

La plateforme utilise trois rôles :

- `admin` : accès à `/admin`, gestion utilisateurs, suivi Gemini.
- `enseignant` : accès aux fiches, exports et paramètres personnels.
- `suspendu` : accès bloqué.

## Premier administrateur

Par défaut, le compte `enseignant@ehuzu.test` est administrateur.

Pour définir d'autres administrateurs en production, ajouter dans Vercel :

```text
ADMIN_EMAILS=ton.email@example.com,autre.admin@example.com
```

Les utilisateurs normaux qui créent un compte reçoivent automatiquement le rôle `enseignant`.

## Pages admin

- `/admin` : tableau de pilotage.
- `/admin/utilisateurs` : suspension, réactivation et promotion admin.
- `/admin/gemini` : statut Gemini, saisie de la clé API, modèle utilisé, tokens suivis.

Un utilisateur non admin qui tape directement une URL `/admin` est redirigé vers le tableau de bord.

## Clé Gemini

La clé peut être configurée de deux manières :

1. Dans Vercel, avec `GEMINI_API_KEY`.
2. Dans l'application, depuis `/admin/gemini`, avec un compte administrateur.

Si une clé est enregistrée dans `/admin/gemini`, elle est prioritaire. La clé n'est jamais affichée entièrement dans l'interface.

Attention : sur Vercel, la clé enregistrée dans `/admin/gemini` est durable seulement si
l'application est reliée à une base PostgreSQL/Supabase avec une variable comme
`DATABASE_URL`, `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`,
`SUPABASE_DB_URL` ou `SUPABASE_POSTGRES_URL`. Sans cette base persistante, la clé peut
repasser à "absente" après quelques secondes. Dans ce cas, mettre `GEMINI_API_KEY`
directement dans les variables d'environnement Vercel.
