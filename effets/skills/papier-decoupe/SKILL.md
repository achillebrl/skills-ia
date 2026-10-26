---
name: papier-decoupe
description: Effet vidéo « papier découpé » : la personne de la vidéo devient un autocollant détouré posé sur un collage de papiers, avec un titre en lettres découpées façon lettre anonyme, animé en stop-motion à 12 i/s. This skill should be used when the user types /papier-decoupe or asks for a paper cut-out, sticker, collage or ransom-letters effect on a video.
---

# /papier-decoupe — Papier découpé

Le décor disparaît : tu deviens un autocollant (contour blanc épais, ombre portée) qui se pose sur un collage de papiers (quadrillé, journal, scotch, papiers de couleur). Au-dessus, ton titre arrive lettre par lettre, chaque lettre découpée dans un papier différent. Tout bouge à 12 images par seconde, comme du stop-motion.

## Il faut

- **Une vidéo de toi**, tête et buste, fond quelconque (il est retiré). Évite les mains qui sortent du cadre et les objets collés à toi.
- **Un titre court** : 12 caractères au plus, espaces compris (au-delà, il rétrécit pour tenir). Il est écrit en majuscules.

Si l'utilisateur ne donne pas de texte, proposer deux variantes courtes liées au sujet de sa vidéo, puis prendre la première sans attendre s'il a dit de faire au mieux.

## Lancer

Le moteur est dans le skill `effets`, à côté de celui-ci : `<dossier de ce skill>/../effets/scripts/effet.py`. S'il n'a jamais tourné, suivre d'abord « Installation » dans `../effets/SKILL.md` (uv + `effet.py installer`).

    uv run "<dossier de ce skill>/../effets/scripts/effet.py" papier-decoupe --video ma-video.mp4 --texte "UN PROMPT"

Faire d'abord un aperçu avec `--rapide` (1 à 3 minutes selon l'effet), le montrer, puis relancer sans `--rapide` pour le rendu final avec flou de mouvement. Options communes : `--debut`, `--duree` (3,5 s par défaut), `--sortie`, `--detourage fin` si les cheveux sont mal détourés.

## Vérifier

Lire la planche `…-planche.jpg` écrite à côté du clip (outil Read) et contrôler :
- le titre est entier et lisible en haut ;
- la silhouette est propre (pas de morceau de décor collé, pas de bras coupé net) ; sinon `--detourage fin`.
Si un point rate, corriger (options, autre passage de la vidéo avec `--debut`) et relancer avant de livrer. Donner ensuite le chemin du `.mp4` et la commande exacte utilisée, pour qu'on puisse la relancer sur une autre vidéo.
