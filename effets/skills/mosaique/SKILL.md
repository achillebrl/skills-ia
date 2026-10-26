---
name: mosaique
description: Effet vidéo « mosaïque » : un poster titre (petite ligne, mot géant, sous-titre) découpé en 60 tuiles qui se retournent en vague 3D pour révéler la vidéo. This skill should be used when the user types /mosaique or asks for a tile flip, mosaic reveal, card flip or 3D wave transition on a video.
---

# /mosaique — Mosaïque

Ton titre s'affiche sur un fond de couleur, découpé en 6 × 10 tuiles ; une vague part du coin haut gauche et retourne chaque tuile en 3D : derrière, ta vidéo.

## Il faut

- **Une vidéo** (pas de détourage).
- `--haut` (16 caractères), `--mot` (8 lettres au plus), `--texte` (sous-titre court), `--couleur` (fond, orange Claude par défaut).

Si l'utilisateur ne donne pas de texte, proposer deux variantes courtes liées au sujet de sa vidéo, puis prendre la première sans attendre s'il a dit de faire au mieux.

## Lancer

Le moteur est dans le skill `effets`, à côté de celui-ci : `<dossier de ce skill>/../effets/scripts/effet.py`. S'il n'a jamais tourné, suivre d'abord « Installation » dans `../effets/SKILL.md` (uv + `effet.py installer`).

    uv run "<dossier de ce skill>/../effets/scripts/effet.py" mosaique --video ma-video.mp4 --haut "UN SEUL" --mot "PROMPT" --texte "et tout se retourne"

Faire d'abord un aperçu avec `--rapide` (1 à 3 minutes selon l'effet), le montrer, puis relancer sans `--rapide` pour le rendu final avec flou de mouvement. Options communes : `--debut`, `--duree` (3,5 s par défaut), `--sortie`.

## Vérifier

Lire la planche `…-planche.jpg` écrite à côté du clip (outil Read) et contrôler :
- le titre est entier sur la première image ;
- les tuiles se retournent en vague et la dernière image montre la vidéo entière.
Si un point rate, corriger (options, autre passage de la vidéo avec `--debut`) et relancer avant de livrer. Donner ensuite le chemin du `.mp4` et la commande exacte utilisée, pour qu'on puisse la relancer sur une autre vidéo.
