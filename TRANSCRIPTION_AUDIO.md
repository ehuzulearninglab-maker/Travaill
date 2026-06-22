# Application de transcription audio

## Version en ligne

La version web est disponible sur `/transcription`.

Pour l'hebergement en ligne, ajoutez `OPENAI_API_KEY` dans les variables d'environnement du site. La page web decoupe l'audio dans le navigateur, puis envoie les petits segments a `/api/transcription/chunk`.

## Lancement rapide

Double-cliquer sur `LANCER_TRANSCRIPTION_AUDIO.bat`.

L'application s'ouvre dans une fenetre Windows. Elle permet de :

- selectionner un fichier audio ;
- entrer la cle API OpenAI ;
- couper automatiquement un gros audio en segments ;
- transcrire chaque segment ;
- copier ou enregistrer le resultat en `.txt`.

## Configuration

1. Coller la cle API OpenAI dans le champ `Cle API OpenAI`.
2. Garder le modele `gpt-4o-transcribe`, sauf besoin particulier.
3. Choisir le fichier audio.
4. Pour un audio de 2 heures ou plus de 25 MB, cliquer une fois sur `Installer ffmpeg local`.
5. Cliquer sur `Lancer la transcription`.

## Sortie

Les transcriptions sont enregistrees automatiquement dans le dossier `transcriptions`.

## Notes

- Les petits fichiers sont envoyes directement a OpenAI.
- Les gros fichiers sont convertis en segments MP3 mono avec `ffmpeg`.
- Le dossier `outils` sert uniquement a stocker `ffmpeg` si vous utilisez l'installation locale.
