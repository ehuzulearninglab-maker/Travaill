# Mise en forme automatique avec Gemini

L'application peut utiliser Gemini uniquement pour transformer une fiche reçue en JSON propre pour le canevas.

## Configuration

Deux options sont possibles :

1. Ajouter `GEMINI_API_KEY` dans Vercel, section **Settings > Environment Variables**.
2. Ouvrir `/admin/gemini` dans l'application, puis enregistrer la clé avec un compte administrateur.

```text
GEMINI_API_KEY=la_cle_google_ai_studio
GEMINI_MODEL=gemini-2.5-flash-lite
```

`GEMINI_MODEL` est facultatif. Si cette variable est absente, l'application utilise `gemini-2.5-flash-lite`. Si une clé est enregistrée dans `/admin/gemini`, elle est prioritaire sur la clé Vercel.

## Fonctionnement

1. Le GPT personnalisé envoie la fiche à `/api/fiches/import`.
2. L'application fait une première normalisation locale.
3. Si une clé Gemini est active, Gemini reformate la fiche en JSON structuré.
4. Si Gemini échoue, l'application sauvegarde quand même la fiche avec la normalisation locale.

La clé Gemini ne doit jamais être mise dans le schéma ActionsGPT ni dans le navigateur public.

Le suivi visible dans `/admin/gemini` affiche le modèle, la source utilisée (`gemini` ou `local`) et les tokens retournés par l'API Gemini. Si la clé est absente ou si Gemini échoue, l'application garde un import local et indique l'avertissement dans le journal.
