# Skill « clipping » pour Claude Code

Tu as une partie de GTA de 2 heures et aucune envie de la monter. Ce skill la transforme en **5 à 10 shorts verticaux prêts à poster** sur YouTube Shorts, TikTok ou Instagram :

- il trouve les **meilleurs moments** : pics de volume, action à l'image, changements de plan, et ce qui est dit (transcription automatique) ;
- il découpe chaque moment en **20 à 45 s**, au format vertical 1080 × 1920, ta vidéo entière au centre sur un fond flou (rien de l'action n'est coupé) ;
- il ajoute un **bandeau de titre** en haut et des **sous-titres mot à mot** au tiers bas ;
- il écrit pour chaque short un **titre, une description et des hashtags** dans `clips.md`.

Tout se fait sur ta machine, gratuitement. Le skill ne publie rien.

## Installer

1. Copie le dossier `clipping` dans `~/.claude/skills/` (Mac / Linux) ou `%USERPROFILE%\.claude\skills\` (Windows).
2. Installe [ffmpeg](https://ffmpeg.org/download.html) (`brew install ffmpeg` sur Mac) et [uv](https://docs.astral.sh/uv/).
3. Relance Claude Code.

Au premier lancement, uv installe faster-whisper et télécharge le modèle de transcription (environ 500 Mo, une seule fois).

## Utiliser

    /clipping ma-partie.mp4

Avec le nombre de shorts et leur durée : `/clipping ma-partie.mp4 10 --duree 25`. Un lien vers ta propre vidéo marche aussi si `yt-dlp` est installé.

Tu reçois le dossier `clips-ma-partie/` : `short-01.mp4`, `short-02.mp4`…, `clips.md` et `planche.jpg`.

## Bon à savoir

- Ne découpe que **tes propres parties** ou des vidéos dont tu as le droit : reposter celles des autres expose aux réclamations pour droits d'auteur.
- YouTube démonétise le contenu réutilisé sans apport : ajoute ta voix, une réaction ou un commentaire quand tu peux.
- Plus la vidéo est longue, plus le skill a de moments à choisir : 8 shorts de 30 s demandent au moins 10 minutes.

Licence MIT.
