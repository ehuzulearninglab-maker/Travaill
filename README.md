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
- Espace administrateur pour visualiser la base alimentaire et importer un fichier Excel/CSV.
- Import reel d'un fichier Excel/CSV depuis l'onglet Admin, avec lecture de la feuille `Base_Aliments`.

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

Le MVP principal fonctionne sans base de donnees externe. La base alimentaire importee est memorisee dans le navigateur de l'utilisateur. `DATABASE_URL` et `GEMINI_API_KEY` sont optionnels pour les modules serveur herites et pour de futures explications IA persistantes.

## Import du fichier Excel de reference

Dans l'application, ouvrir `Admin`, puis cliquer sur `Selectionner un fichier Excel ou CSV`.

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

Apres import, les menus sont regeneres avec la base chargee. Le bouton `Restaurer la base demo` permet de revenir aux aliments de demonstration.

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
