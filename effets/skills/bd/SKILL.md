---
name: bd
description: Effet vidéo « BD » : la personne (détourée sur la machine) en case de bande dessinée, couleurs saturées, trame de points, contour encré, fond de rayons, onomatopée en étoile et bulle de dialogue, animée à 12 i/s. This skill should be used when the user types /bd or asks for a comic book, pop art, halftone, cartoon panel or speech bubble effect on a video.
---

# /bd — BD

Tu deviens une case de BD : fond de rayons jaunes, trame de points sur toi, contour à l'encre, « POW! » qui éclate, puis une bulle avec ton texte. Tout bouge à 12 images par seconde, comme une BD animée.

## Il faut

- **Une vidéo de toi**, de la taille à la tête, avec de la place en haut pour la bulle et l'onomatopée.
- `--texte` : la bulle, 20 caractères au plus (« UN SEUL PROMPT ! » par défaut) ; `--mot` : l'onomatopée, 5 caractères au plus (« POW! » par défaut).

Si l'utilisateur ne donne pas de texte, proposer deux variantes courtes liées au sujet de sa vidéo, puis prendre la première sans attendre s'il a dit de faire au mieux.

## Lancer

Le moteur est dans le skill `effets`, à côté de celui-ci : `<dossier de ce skill>/../effets/scripts/effet.py`. S'il n'a jamais tourné, suivre d'abord « Installation » dans `../effets/SKILL.md` (uv + `effet.py installer`).

    uv run "<dossier de ce skill>/../effets/scripts/effet.py" bd --video ma-video.mp4 --texte "UN SEUL PROMPT !" --mot "POW!"

Faire d'abord un aperçu avec `--rapide` (1 à 3 minutes selon l'effet), le montrer, puis relancer sans `--rapide` pour le rendu final avec flou de mouvement. Options communes : `--debut`, `--duree` (3,5 s par défaut), `--sortie`, `--detourage fin` si les cheveux ou un objet sont mal détourés.

## Vérifier

Lire la planche `…-planche.jpg` écrite à côté du clip (outil Read) et contrôler :
- la bulle et l'onomatopée ne cachent pas ton visage ;
- aucun morceau de décor (fauteuil, lampe) ne reste collé à toi.
Si un point rate, corriger (options, autre passage de la vidéo avec `--debut`) et relancer avant de livrer. Donner ensuite le chemin du `.mp4` et la commande exacte utilisée, pour qu'on puisse la relancer sur une autre vidéo.
