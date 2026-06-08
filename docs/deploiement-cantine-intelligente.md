# Deploiement de Cantine Intelligente

Ce guide decrit le chemin de production conseille pour l'application Next.js.

## 1. Preparer le depot

```bash
npm install
npm run typecheck
npm run build
git status
git add .
git commit -m "Build Cantine Intelligente MVP"
git push origin main
```

## 2. Heberger sur Vercel

1. Ouvrir le tableau de bord Vercel.
2. Importer le depot GitHub du projet.
3. Laisser Vercel detecter Next.js.
4. Verifier les commandes :
   - Install Command : `npm install`
   - Build Command : `npm run build`
   - Output Directory : `.next`
5. Ajouter les variables d'environnement.
6. Lancer le deploiement.

## 3. Variables Vercel minimales

```bash
NEXT_PUBLIC_APP_NAME=Cantine Intelligente
NEXT_PUBLIC_APP_URL=https://votre-domaine.vercel.app
AUTH_SECRET=une-valeur-longue-et-secrete
IMPORT_SECRET_KEY=une-cle-longue-et-secrete
```

## 4. Variables optionnelles

```bash
DATABASE_URL=postgresql://...
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash-lite
```

`DATABASE_URL` est necessaire uniquement pour rendre persistants les anciens modules serveur conserves dans le projet. Le MVP Cantine principal fonctionne sans base externe.

## 5. Verifications apres mise en ligne

- Ouvrir la page d'accueil.
- Generer un menu de 5 jours.
- Remplacer une proteine dans la vue menu.
- Ouvrir la liste d'achats et verifier les couts.
- Exporter le CSV.
- Tester l'impression PDF navigateur.
- Ouvrir l'onglet Admin et rechercher un aliment.

## 6. Passage en production terrain

Avant usage reel :

- Remplacer la base alimentaire de demonstration par un fichier valide localement.
- Faire valider les portions par un nutritionniste.
- Faire valider les compatibilites culinaires par des experts locaux.
- Ajouter une base PostgreSQL/Supabase si les menus et imports doivent etre historises.
- Activer un domaine HTTPS propre.
