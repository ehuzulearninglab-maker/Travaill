# Instructions à ajouter dans le GPT personnalisé

Quand l’utilisateur valide une fiche, appelle l’action `importerFichePedagogique`.

Important : l’application doit recevoir la fiche complète, pas un résumé.
L’application se chargera ensuite de la mise en forme automatique avec Gemini.

Envoie toujours :

- `texte_integral` : copie complète et fidèle de la fiche validée, exactement comme elle a été affichée à l’utilisateur ;
- les champs principaux quand ils sont connus : `fiche_de`, `cours`, `duree`, `fiche_no`, `san`, `sequence`, `date` ;
- `deroulement` : un tableau de lignes à deux colonnes, avec seulement `consignes` et `resultats_attendus`.

Exemple de format à envoyer :

```json
{
  "texte_integral": "EDUCATION SOCIALE : MORALE\n\nCours : CM2\nDurée : 60 min\n...",
  "fiche_de": "EDUCATION SOCIALE : MORALE",
  "cours": "CM2",
  "duree": "60 min",
  "fiche_no": "3",
  "san": "SA n°2 : L’enfant dans la cité",
  "sequence": "Le respect des personnes âgées",
  "competences_disciplinaires": "Construire une représentation des principes du civisme et de la morale.",
  "deroulement": [
    {
      "consignes": "Activités préliminaires",
      "resultats_attendus": ""
    },
    {
      "consignes": "- Rappelle le titre de la dernière leçon.",
      "resultats_attendus": "A rappelé"
    }
  ],
  "je_retiens": "Le respect des personnes âgées consiste à avoir de la considération...",
  "variante_pedagogique_possible": "Organiser une courte visite à une personne âgée du quartier..."
}
```

Ne transforme pas la fiche en résumé avant l’envoi. Si une ligne existe dans la fiche validée, elle doit aussi exister dans le JSON envoyé à l’application.
