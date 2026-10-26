---
name: mise-en-abyme
description: Effet vidéo « mise en abyme » : la vidéo affichée dans un cadre blanc à l'intérieur d'elle-même, sept fois, et la caméra plonge de cadre en cadre sans fin. This skill should be used when the user types /mise-en-abyme or asks for an infinite zoom, Droste effect, video-in-video or recursive zoom on a video.
---

# /mise-en-abyme — Mise en abyme

Ta vidéo contient ta vidéo, qui contient ta vidéo… sept niveaux dans des cadres blancs. La caméra plonge dedans : à chaque niveau, l'image intérieure prend exactement la place de l'écran, donc la plongée semble sans fin.

## Il faut

- **Une vidéo** (pas de détourage) ; les cadres sont centrés vers le bas du milieu (là où sont souvent les mains), donc un plan face caméra marche le mieux.
- Une plongée par tranche de 1,6 s environ : `--duree 5` donne trois niveaux.

Si l'utilisateur ne donne pas de texte, proposer deux variantes courtes liées au sujet de sa vidéo, puis prendre la première sans attendre s'il a dit de faire au mieux.

## Lancer

Le moteur est dans le skill `effets`, à côté de celui-ci : `<dossier de ce skill>/../effets/scripts/effet.py`. S'il n'a jamais tourné, suivre d'abord « Installation » dans `../effets/SKILL.md` (uv + `effet.py installer`).

    uv run "<dossier de ce skill>/../effets/scripts/effet.py" mise-en-abyme --video ma-video.mp4

Faire d'abord un aperçu avec `--rapide` (1 à 3 minutes selon l'effet), le montrer, puis relancer sans `--rapide` pour le rendu final avec flou de mouvement. Options communes : `--debut`, `--duree` (3,5 s par défaut), `--sortie`.

## Vérifier

Lire la planche `…-planche.jpg` écrite à côté du clip (outil Read) et contrôler :
- les cadres blancs sont visibles et emboîtés ;
- la dernière image est nette (pas de cadre coupé à moitié).
Si un point rate, corriger (options, autre passage de la vidéo avec `--debut`) et relancer avant de livrer. Donner ensuite le chemin du `.mp4` et la commande exacte utilisée, pour qu'on puisse la relancer sur une autre vidéo.
