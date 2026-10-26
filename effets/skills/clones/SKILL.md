---
name: clones
description: Effet vidéo « clones » : deux autres versions de la personne (détourée sur la machine, à d'autres moments de sa vidéo) débarquent à sa gauche et à sa droite avec un flash et un « ×3 », rendu en clip vertical 1080 × 1920. This skill should be used when the user types /clones or asks for a clone, triple-me, multiple copies of myself effect on a video.
---

# /clones — Clones

Tu restes au centre ; deux autres toi arrivent de chaque côté, chacun à un autre moment de ta vidéo (donc avec d'autres gestes), avec un flash à chaque arrivée, puis « ×3 » s'affiche en bas.

## Il faut

- **Une vidéo de toi**, de la taille à la tête, centré, avec un peu de place de chaque côté et des gestes qui changent au fil de la vidéo (plus elle est longue, plus les clones diffèrent : `--duree 5`).
- `--texte` : l'étiquette (« ×3 » par défaut).

Si l'utilisateur ne donne pas de texte, proposer deux variantes courtes liées au sujet de sa vidéo, puis prendre la première sans attendre s'il a dit de faire au mieux.

## Lancer

Le moteur est dans le skill `effets`, à côté de celui-ci : `<dossier de ce skill>/../effets/scripts/effet.py`. S'il n'a jamais tourné, suivre d'abord « Installation » dans `../effets/SKILL.md` (uv + `effet.py installer`).

    uv run "<dossier de ce skill>/../effets/scripts/effet.py" clones --video ma-video.mp4

Faire d'abord un aperçu avec `--rapide` (1 à 3 minutes selon l'effet), le montrer, puis relancer sans `--rapide` pour le rendu final avec flou de mouvement. Options communes : `--debut`, `--duree` (3,5 s par défaut), `--sortie`, `--detourage fin` si les cheveux ou un objet sont mal détourés.

## Vérifier

Lire la planche `…-planche.jpg` écrite à côté du clip (outil Read) et contrôler :
- les deux clones sont visibles de chaque côté, derrière toi, sans morceau de décor autour d'eux ;
- l'étiquette ne cache pas ton visage.
Si un point rate, corriger (options, autre passage de la vidéo avec `--debut`) et relancer avant de livrer. Donner ensuite le chemin du `.mp4` et la commande exacte utilisée, pour qu'on puisse la relancer sur une autre vidéo.
