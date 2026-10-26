---
name: doodle
description: Effet vidéo « doodle » : contour blanc qui tremble autour de la personne (détourée sur la machine), couronne, étincelles, cœur, flèche et un texte manuscrit qui se dessinent à main levée. This skill should be used when the user types /doodle or asks for a hand-drawn outline, scribble, sketch or doodle-around-me effect on a video.
---

# /doodle — Doodle

Un contour blanc épais se dessine autour de toi et « bout » comme un dessin à la main (le trait change 12 fois par seconde). Une couronne se pose sur ta tête (placée automatiquement d'après ton détourage), des étincelles et un cœur apparaissent, puis une flèche part de ton texte manuscrit vers ta tête.

## Il faut

- **Une vidéo de toi**, plan serré tête et buste, avec un peu d'espace au-dessus de la tête pour la couronne. Pose conseillée : bras croisés ou mains jointes, silhouette nette.
- **Un texte court en minuscules** (`--texte`), 16 caractères au plus.

Si l'utilisateur ne donne pas de texte, proposer deux variantes courtes liées au sujet de sa vidéo, puis prendre la première sans attendre s'il a dit de faire au mieux.

## Lancer

Le moteur est dans le skill `effets`, à côté de celui-ci : `<dossier de ce skill>/../effets/scripts/effet.py`. S'il n'a jamais tourné, suivre d'abord « Installation » dans `../effets/SKILL.md` (uv + `effet.py installer`).

    uv run "<dossier de ce skill>/../effets/scripts/effet.py" doodle --video ma-video.mp4 --texte "un seul prompt"

Faire d'abord un aperçu avec `--rapide` (1 à 3 minutes selon l'effet), le montrer, puis relancer sans `--rapide` pour le rendu final avec flou de mouvement. Options communes : `--debut`, `--duree` (3,5 s par défaut), `--sortie`, `--detourage fin` si les cheveux sont mal détourés.

## Vérifier

Lire la planche `…-planche.jpg` écrite à côté du clip (outil Read) et contrôler :
- la couronne est posée sur la tête (pas dans le vide, pas sur le front) ;
- le contour suit la silhouette sans attraper le décor ;
- le texte est entier dans le cadre.
Si un point rate, corriger (options, autre passage de la vidéo avec `--debut`) et relancer avant de livrer. Donner ensuite le chemin du `.mp4` et la commande exacte utilisée, pour qu'on puisse la relancer sur une autre vidéo.
