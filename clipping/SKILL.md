---
name: clipping
description: Transforme une longue vidéo de jeu (ta partie de GTA, de Fortnite, de Minecraft… ou un live) en 5 à 10 shorts verticaux 1080 × 1920 prêts pour YouTube Shorts, TikTok ou les Reels. Trouve les meilleurs moments (pics de volume, action à l'image, changements de plan, ce qui est dit), les découpe en 20 à 45 s, met la vidéo au centre sur un fond flou d'elle-même, ajoute un bandeau de titre et des sous-titres mot à mot, puis écrit pour chaque short un titre, une description et des hashtags. À utiliser quand l'utilisateur dit « /clipping », « découpe ma partie en shorts », « fais des clips de ma vidéo », « transforme mon live en TikTok », « clipping GTA », ou donne une longue vidéo de jeu à découper.
argument-hint: <ta vidéo .mp4/.mov ou le lien de TA vidéo> [nombre de shorts, 8 par défaut] [--duree 30]
---

# Clipping : ta partie de jeu en shorts verticaux

Tu transformes la longue vidéo de jeu de l'utilisateur en shorts verticaux, avec sous-titres et titres, prêts à poster. Tout s'écrit dans `clips-<nom de la vidéo>/` à côté de la vidéo ; tu ne publies rien.

Le script fait le travail lourd : `scripts/clipping.py` (dans le dossier de ce skill), lancé avec `uv run`. Toi, tu choisis les moments à partir de son analyse et tu écris les titres.

## 1. La vidéo

- Vérifie `ffmpeg` et `uv` (`ffmpeg -version`, `uv --version`). S'il manque ffmpeg : `brew install ffmpeg` (Mac), `winget install ffmpeg` (Windows), `sudo apt install ffmpeg` (Linux). S'il manque uv : `curl -LsSf https://astral.sh/uv/install.sh | sh` (Mac / Linux) ou `powershell -c "irm https://astral.sh/uv/install.ps1 | iex"` (Windows). Demande avant d'installer.
- **Un fichier** : utilise-le tel quel.
- **Un lien** : télécharge avec `yt-dlp` s'il est installé (`yt-dlp -f "bv*[height<=1080]+ba/b" -o "partie.%(ext)s" <lien>`), sinon demande le fichier. Rappelle une fois, en une phrase : on ne découpe que **ses propres parties** ou des vidéos dont on a le droit ; reposter les vidéos des autres expose aux réclamations pour droits d'auteur et à la démonétisation (règle YouTube du contenu réutilisé).
- Plus la vidéo est longue, plus il y a de moments à choisir : 8 shorts de 30 s demandent au moins 10 minutes de vidéo.

## 2. L'analyse

```bash
uv run <dossier du skill>/scripts/clipping.py analyser <vidéo> --n <nombre> --duree <secondes>
```

La première fois, uv installe faster-whisper et télécharge le modèle `small` (environ 500 Mo, une seule fois). Le script mesure le volume toutes les 0,5 s, l'action à l'image et les changements de plan, transcrit la voix (langue détectée), note chaque fenêtre et garde jusqu'à 2 × n moments sans chevauchement. Il écrit `clips-<nom>/analyse.json` et affiche les candidats, du meilleur au moins bon, avec ce qui est dit.

Durée : 20 à 45 s (30 par défaut). Plus court si la vidéo est courte : le script le dit.

## 3. Le choix des moments

Lis les candidats de `analyse.json` (score, pic de volume, action, plans, paroles). Choisis les n meilleurs **pour un spectateur** : une action qui se comprend sans contexte, un pic d'émotion (cri, rire, crash, victoire), une phrase drôle ou surprenante. Écarte les moments de menu, de chargement ou de silence, même bien notés. Si un moment fort commence avant ou finit après la fenêtre, ajuste `debut` et `fin` (20 à 45 s, sans chevauchement).

Écris `clips-<nom>/choix.json`, dans l'ordre chronologique :

```json
[
  {
    "debut": 412.0,
    "fin": 441.5,
    "bandeau": "IL M'A PAS VU VENIR",
    "titre": "Le braquage a mal tourné 😭 #gta",
    "description": "Une phrase qui donne envie de regarder jusqu'au bout.",
    "hashtags": "#gta #gaming #shorts #gtaonline"
  }
]
```

- `bandeau` : 3 à 5 mots en majuscules, l'accroche affichée en haut pendant tout le short.
- `titre` : moins de 70 caractères, l'accroche avant le hashtag principal ; dans la langue de la vidéo.
- `description` : une ou deux phrases ; pas de promesse fausse ni de « lien en bio » inventé.
- `hashtags` : 3 à 5, le jeu en premier.

## 4. Le rendu

```bash
uv run <dossier du skill>/scripts/clipping.py rendre <vidéo> clips-<nom>/choix.json
```

Pour chaque moment : la vidéo d'origine **entière** au centre (rien de l'action n'est coupé), sur un fond flou et assombri d'elle-même, le bandeau en haut, les sous-titres en blanc cerclé de noir par 2 ou 3 mots au tiers bas, le son à −14 LUFS. Sortie : `short-01.mp4`… , `clips.md` (titres, descriptions, hashtags) et `planche.jpg` (une image par short).

Pressé : `rendre <vidéo> --auto --n 8` rend directement les meilleurs moments de l'analyse, avec des bandeaux « Moment 1 »… à renommer.

## 5. Le contrôle et le rendu à l'utilisateur

- Regarde `planche.jpg` et une image du milieu d'un short (`ffmpeg -ss 10 -i clips-<nom>/short-01.mp4 -frames:v 1 controle.jpg`) : bandeau lisible, sous-titres dans le cadre, action visible.
- Donne le dossier, le nombre de shorts et leur durée, puis le tableau de `clips.md` (short, moment, titre).
- Conseils de publication, en deux lignes : poster 1 à 2 shorts par jour plutôt que tout d'un coup ; ajouter sa voix ou une réaction quand c'est possible, car YouTube démonétise le contenu réutilisé sans apport.
