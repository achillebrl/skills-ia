---
name: vhs
description: Effet vidéo « VHS » : la vidéo façon caméscope 1998, couleurs qui bavent (décalage rouge et bleu), lignes de balayage, bande de tracking, neige, sauts d'image, affichage PLAY, REC et date. This skill should be used when the user types /vhs or asks for a VHS, camcorder, retro tape, 90s glitch effect on a video.
---

# /vhs — VHS

Ta vidéo comme une vieille cassette : couleurs qui débordent, lignes, une bande claire qui défile, de la neige, des sauts d'image, et l'affichage du caméscope (▶ PLAY, ● REC qui clignote, date et heure qui tournent).

## Il faut

- **Une vidéo**, n'importe laquelle (pas de détourage).
- `--texte` : la date affichée (« OCT. 26 1998 » par défaut), en majuscules, format caméscope.

Si l'utilisateur ne donne pas de texte, proposer deux variantes courtes liées au sujet de sa vidéo, puis prendre la première sans attendre s'il a dit de faire au mieux.

## Lancer

Le moteur est dans le skill `effets`, à côté de celui-ci : `<dossier de ce skill>/../effets/scripts/effet.py`. S'il n'a jamais tourné, suivre d'abord « Installation » dans `../effets/SKILL.md` (uv + `effet.py installer`).

    uv run "<dossier de ce skill>/../effets/scripts/effet.py" vhs --video ma-video.mp4 --texte "OCT. 26 1998"

Faire d'abord un aperçu avec `--rapide` (1 à 3 minutes selon l'effet), le montrer, puis relancer sans `--rapide` pour le rendu final avec flou de mouvement. Options communes : `--debut`, `--duree` (3,5 s par défaut), `--sortie`.

## Vérifier

Lire la planche `…-planche.jpg` écrite à côté du clip (outil Read) et contrôler :
- la date et l'heure sont lisibles en bas à gauche ;
- un saut d'image apparaît sur au moins une image de la planche (sinon allonger `--duree`).
Si un point rate, corriger (options, autre passage de la vidéo avec `--debut`) et relancer avant de livrer. Donner ensuite le chemin du `.mp4` et la commande exacte utilisée, pour qu'on puisse la relancer sur une autre vidéo.
