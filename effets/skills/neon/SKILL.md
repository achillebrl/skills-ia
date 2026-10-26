---
name: neon
description: Effet vidéo « néon » : décor assombri, contour de la personne (détourée sur la machine) en tube néon bleu qui clignote avant de s'allumer, trois échos colorés qui suivent ses gestes, et un texte en néon rose. This skill should be used when the user types /neon or asks for a neon outline, glowing silhouette, light trail or echo effect on a video.
---

# /neon — Néon

Le décor s'assombrit ; ton contour s'allume comme un tube néon (il clignote puis tient), suivi de trois échos violet, rose et bleu quand tu bouges, puis ton texte s'allume en néon rose en bas.

## Il faut

- **Une vidéo de toi** avec des gestes (un bras qui pointe, une main qui bouge) : les échos n'apparaissent que si tu bouges.
- `--texte` : 16 caractères au plus, en minuscules (« un seul prompt » par défaut).

Si l'utilisateur ne donne pas de texte, proposer deux variantes courtes liées au sujet de sa vidéo, puis prendre la première sans attendre s'il a dit de faire au mieux.

## Lancer

Le moteur est dans le skill `effets`, à côté de celui-ci : `<dossier de ce skill>/../effets/scripts/effet.py`. S'il n'a jamais tourné, suivre d'abord « Installation » dans `../effets/SKILL.md` (uv + `effet.py installer`).

    uv run "<dossier de ce skill>/../effets/scripts/effet.py" neon --video ma-video.mp4 --texte "un seul prompt"

Faire d'abord un aperçu avec `--rapide` (1 à 3 minutes selon l'effet), le montrer, puis relancer sans `--rapide` pour le rendu final avec flou de mouvement. Options communes : `--debut`, `--duree` (3,5 s par défaut), `--sortie`, `--detourage fin` si les cheveux ou un objet sont mal détourés.

## Vérifier

Lire la planche `…-planche.jpg` écrite à côté du clip (outil Read) et contrôler :
- le contour suit la silhouette sans attraper le décor ;
- le texte néon est entier et lisible.
Si un point rate, corriger (options, autre passage de la vidéo avec `--debut`) et relancer avant de livrer. Donner ensuite le chemin du `.mp4` et la commande exacte utilisée, pour qu'on puisse la relancer sur une autre vidéo.
