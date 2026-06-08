# Cantine Intelligente

Plateforme web d'aide a la planification alimentaire scolaire. L'application aide un gestionnaire de cantine a generer un menu hebdomadaire coherent, calculer les quantites d'achat, suivre le budget et produire un rapport de verification nutritionnelle.

## Fonctionnalites MVP

- Formulaire de planification : nombre d'enfants, tranche d'age, budget, duree, saison et contraintes alimentaires.
- Generation automatique d'un menu par jour avec energie, proteine, fruit et vegetal.
- Calcul des portions par enfant, quantites totales, quantites d'achat arrondies et couts.
- Remplacement interactif d'un aliment avec recalcul immediat.
- Liste d'achats agregee.
- Rapport de verification : proteine, fruit, energie, vegetal, compatibilite culinaire et budget.
- Export CSV et impression PDF via le navigateur.
- Espace administrateur de demonstration pour visualiser la base alimentaire et simuler l'import Excel/CSV.

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
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash-lite
```

Le MVP principal fonctionne sans base de donnees externe. `DATABASE_URL` et `GEMINI_API_KEY` sont optionnels pour les modules serveur herites et pour de futures explications IA persistantes.

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
- `src/lib/cantine-engine.ts` : base alimentaire de demonstration, moteur de selection, calculs et verification.
- `src/app/page.tsx` : page d'accueil de l'application.
- `vercel.json` : configuration d'hebergement Vercel.
