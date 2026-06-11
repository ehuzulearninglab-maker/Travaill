# Cantine Intelligente

Plateforme web d'aide a la planification alimentaire scolaire. L'application aide un gestionnaire de cantine a generer un menu hebdomadaire coherent, calculer les quantites d'achat, suivre le budget et produire un rapport de verification nutritionnelle.

## Fonctionnalites MVP

- Formulaire de planification : nombre d'enfants, tranche d'age, budget, duree, saison et contraintes alimentaires.
- Generation automatique d'un menu par jour a partir de la feuille `Plats_Validés`.
- Calcul des portions par enfant, quantites totales, quantites d'achat arrondies et couts.
- Liste d'achats agregee.
- Prix de reference visible dans les achats : prix par kg, lot, piece ou unite d'achat.
- Changement manuel d'un menu par jour parmi les plats valides disponibles, avec recalcul immediat.
- Rapport de verification : plats valides, proteine visible, fruit, base energetique, apport vegetal et budget.
- Export CSV et impression PDF via le navigateur.
- Espace administrateur separe sur `/admin-cantine`, protege par mot de passe.
- Import Excel serveur avec lecture de `Base_Aliments` et `Plats_Validés`.
- Saisie admin d'une cle API IA optionnelle pour les futurs controles assistes.

## Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Lucide React

## Demarrage local

```bash
npm install
npm run dev
```

Ouvrir ensuite `http://localhost:3000`.

## Verification

```bash
npm run typecheck
npm run build
```

## Variables d'environnement

Copier `.env.example` vers `.env.local` en developpement.

```bash
NEXT_PUBLIC_APP_NAME=Cantine Intelligente
NEXT_PUBLIC_APP_URL=http://localhost:3000
AUTH_SECRET=changez-cette-valeur-en-production
DATABASE_URL=
CANTINE_ADMIN_PASSWORD=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash-lite
```

L'application utilisateur fonctionne sans API externe et sans import a chaque utilisation : la reference `CANTINE_INTELLIGENTE_GPT.xlsx` est incluse dans le site. Les routes API internes Next.js servent a l'administration et a l'import.

Pour conserver durablement les futurs imports admin en production, configurez `DATABASE_URL` avec PostgreSQL/Supabase. Sans base, la reference incluse reste disponible, mais un nouvel import realise depuis Vercel peut etre temporaire.

## Import du fichier Excel de reference

Ouvrir `/admin-cantine`, se connecter avec `CANTINE_ADMIN_PASSWORD`, puis cliquer sur `Selectionner un fichier Excel`.

Le fichier attendu peut contenir plusieurs feuilles. L'application lit en priorite la feuille `Base_Aliments` avec les colonnes :

- `Aliment`
- `Groupe alimentaire`
- `Saison`
- `Unité achat`
- `Prix estimé (FCFA)`
- `Portion standard enfant`
- `Unité portion`
- `Rôle nutritionnel`
- `Type protéine`
- `Niveau de coût`
- `Mode d’achat`
- `Quantité par vente`
- `Catégorie culinaire`
- `Compatible avec`

La generation lit aussi `Plats_Validés` et refuse de creer des combinaisons libres hors reference. Apres import, la nouvelle base devient active pour les utilisateurs.

## Hebergement Vercel

Le depot contient `vercel.json`. Une fois pousse sur GitHub, Vercel peut construire automatiquement l'application avec :

- Install command : `npm install`
- Build command : `npm run build`
- Output directory : `.next`

Variables minimales conseillees dans Vercel :

```bash
NEXT_PUBLIC_APP_NAME=Cantine Intelligente
NEXT_PUBLIC_APP_URL=https://votre-domaine.vercel.app
AUTH_SECRET=une-valeur-longue-et-secrete
CANTINE_ADMIN_PASSWORD=un-mot-de-passe-admin-long
IMPORT_SECRET_KEY=une-cle-longue
```

Variables optionnelles :

```bash
DATABASE_URL=postgresql://...
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash-lite
```

## Limite importante

Les menus generes par Cantine Intelligente sont des propositions d'aide a la decision. Ils ne remplacent pas l'avis d'un nutritionniste qualifie. Les portions, prix et compatibilites culinaires doivent etre valides avec une base alimentaire locale fiable avant une utilisation terrain.

## Structure principale

- `src/components/cantine-app.tsx` : interface applicative.
- `src/components/cantine-admin-client.tsx` : interface admin separee.
- `src/lib/cantine-engine.ts` : normalisation de la reference, selection des plats valides, calculs et verification.
- `src/lib/cantine-storage.ts` : lecture/ecriture de la reference active.
- `src/app/page.tsx` : page d'accueil de l'application.
- `src/app/admin-cantine/page.tsx` : page d'administration protegee.
- `vercel.json` : configuration d'hebergement Vercel.
