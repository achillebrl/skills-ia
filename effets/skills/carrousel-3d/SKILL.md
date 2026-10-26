---
name: carrousel-3d
description: Effet vidéo « carrousel 3D » : 3 à 8 images (captures, couvertures de reels, produits) sur un grand anneau 3D qui tourne au-dessus d'une vidéo, rendu en clip vertical 1080 × 1920. This skill should be used when the user types /carrousel-3d or asks for a 3D carousel, a ring of images or a spinning gallery effect for a reel.
---

# /carrousel-3d — Carrousel 3D

Tes images sur un anneau 3D vu de l'intérieur : il apparaît, tourne vite, ralentit, puis repart d'un second coup de pouce. Le flou de mouvement vient du rendu (4 sous-images par image).

## Il faut

- **3 à 8 images** (au-delà de 8, seules les 8 premières servent ; en dessous, elles se répètent). Format vertical idéal, sinon recadrées en 9:16 au centre.
- **Vidéo de fond facultative** : idéalement filmée par-dessus ton épaule, téléphone en main, le haut de l'image vide (l'anneau tourne au-dessus). Sans vidéo : fond bleu nuit dégradé.

Si l'utilisateur ne donne pas de texte, proposer deux variantes courtes liées au sujet de sa vidéo, puis prendre la première sans attendre s'il a dit de faire au mieux.

## Lancer

Le moteur est dans le skill `effets`, à côté de celui-ci : `<dossier de ce skill>/../effets/scripts/effet.py`. S'il n'a jamais tourné, suivre d'abord « Installation » dans `../effets/SKILL.md` (uv + `effet.py installer`).

    uv run "<dossier de ce skill>/../effets/scripts/effet.py" carrousel-3d --images a.jpg b.jpg c.jpg [--video fond.mp4]

Faire d'abord un aperçu avec `--rapide` (1 à 3 minutes selon l'effet), le montrer, puis relancer sans `--rapide` pour le rendu final avec flou de mouvement. Options communes : `--debut`, `--duree` (3,5 s par défaut), `--sortie`.

## Vérifier

Lire la planche `…-planche.jpg` écrite à côté du clip (outil Read) et contrôler :
- l'anneau est entièrement dans le cadre et les images se reconnaissent sur la carte de face ;
- avec une vidéo de fond, l'anneau ne cache pas l'élément important (sinon `--debut` ou une autre vidéo).
Si un point rate, corriger (options, autre passage de la vidéo avec `--debut`) et relancer avant de livrer. Donner ensuite le chemin du `.mp4` et la commande exacte utilisée, pour qu'on puisse la relancer sur une autre vidéo.
