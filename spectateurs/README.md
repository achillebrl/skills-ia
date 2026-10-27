# Skill « spectateurs » pour Claude Code

Tu publies un reel… et tout le monde scrolle avant la 3ᵉ seconde. Ce skill fait regarder ta vidéo par **100 spectateurs simulés avant la publication** :

- chacun a son âge, ses centres d'intérêt, son humeur, et 4 sur 10 regardent **le son coupé** ;
- il regarde ta vidéo **seconde par seconde** (images extraites avec ffmpeg, texte de ta voix) ;
- il dit **à quelle seconde il scrolle et pourquoi** ;
- s'il reste jusqu'au bout, il dit s'il **like**, s'il l'**envoie** à quelqu'un, et ce qu'il commenterait.

Tu reçois :

- la **courbe de rétention**, le **temps de visionnage moyen**, les **likes et envois pour 100** : les trois signaux qu'Adam Mosseri, patron d'Instagram, cite comme les plus importants pour le classement (janvier 2025) ;
- les secondes où ils partent, avec leurs raisons ;
- le passage qui fait fuir : ton accroche, ou la seconde précise où ils décrochent (souvent pas le début) ;
- **3 réécritures** de ce passage (image, texte à l'écran, phrase), la meilleure re-testée sur les mêmes spectateurs, avec le tableau avant / après.

Ce sont des spectateurs simulés par l'IA : les chiffres servent à comparer deux versions de ta vidéo, pas à prédire tes vraies vues. Le skill ne publie rien.

## Installer (30 secondes)

1. Copie le dossier `spectateurs` dans `~/.claude/skills/` (Mac / Linux) ou `%USERPROFILE%\.claude\skills\` (Windows).
2. Installe [ffmpeg](https://ffmpeg.org/download.html) si tu ne l'as pas (`brew install ffmpeg` sur Mac).
3. Relance Claude Code.

## Utiliser

    /spectateurs mon-reel.mp4

Précise ton public pour des spectateurs plus justes : `/spectateurs mon-reel.mp4 gens qui codent avec l'IA, 20-35 ans`.

- `--n 50` : moins de spectateurs, test plus rapide.
- Si [whisper](https://github.com/openai/whisper) est installé, la voix est transcrite toute seule ; sinon, colle le texte de ta voix off quand Claude le demande.

Tout s'écrit dans `.spectateurs/<date>/` (images, timeline, spectateurs, réponses, rapport). Le test lance 5 sous-agents par version : compte quelques minutes et une part de ton quota Claude.

— [@achille.ia](https://www.instagram.com/achille.ia/)
