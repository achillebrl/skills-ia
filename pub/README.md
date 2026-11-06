# Skill « pub » pour Claude Code

Une **pub animée de 20 secondes pour ta marque**, faite entièrement en code : pas de vidéo IA, pas de banque d'images, pas de logiciel de montage.

- Claude écrit le texte de la pub et, si tu veux, génère la **voix off** avec ElevenLabs (avec le temps de chaque mot) ;
- il code les scènes en **motion design** : textes qui rebondissent, trait qui se dessine, maquette de téléphone avec ton appli, transitions ;
- chaque apparition tombe **pile sur le mot** qui la dit ;
- il rend la vidéo en **MP4 1920 × 1080** image par image (Playwright + ffmpeg), voix et musique mixées à −14 LUFS.

Exemple fourni : `exemples/panyo/`, une appli de courses **fictive** (19 s, 10 scènes).

## Installer

1. Copie le dossier `pub` dans `~/.claude/skills/` (Mac / Linux) ou `%USERPROFILE%\.claude\skills\` (Windows).
2. Installe [Node.js](https://nodejs.org) 18 ou plus et [ffmpeg](https://ffmpeg.org/download.html) (`brew install ffmpeg` sur Mac).
3. Dans le dossier du skill : `npm install` puis `npx playwright install chromium`.
4. Facultatif, pour la voix off : une clé [ElevenLabs](https://elevenlabs.io) dans la variable `ELEVENLABS_API_KEY`.
5. Relance Claude Code.

## Utiliser

    /pub ma marque de café en grains, couleur vert sapin, voix off

Claude te pose les questions qui manquent, écrit `marques/<marque>/texte.txt`, la voix, les scènes (`marque.js`), te montre une planche d'aperçu, puis rend `marques/<marque>/pub.mp4`.

À la main, l'exemple :

    node scripts/rendu.mjs exemples/panyo apercu 1 3 5 7 9 11 13 15 17
    node scripts/rendu.mjs exemples/panyo

(Sans `voix.mp3`, la vidéo est muette mais calée sur les temps de `voix.json`.)

## Bon à savoir

- N'utilise que des marques, logos et musiques dont tu as les droits.
- Une pub pour une marque inventée doit rester marquée « fictive » si tu la publies.
- Les polices viennent de Google Fonts : il faut une connexion au moment du rendu.

Licence MIT.
