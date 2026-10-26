---
name: todo-list
description: Effet vidéo « todo list » : une carte « À faire » arrive à côté de la personne et ses lignes se cochent toutes seules en vert, une ligne précédée de « - » se fait barrer en rouge, rendu en clip vertical 1080 × 1920. This skill should be used when the user types /todo-list or asks for a checklist, to-do list, tasks ticking off or checkbox effect on a video.
---

# /todo-list — Todo list

Une carte « À faire » glisse en bas de l'écran ; ses lignes se cochent une par une (coche verte qui se dessine), et la dernière, précédée de « - », se fait barrer avec une croix rouge. Idéal quand tu pointes la carte du doigt.

## Il faut

- **Une vidéo** (pas de détourage), avec le bas de l'image assez calme : la carte se pose vers le bas, à droite.
- `--mots` : 3 à 5 lignes séparées par `|`, 26 caractères au plus chacune ; un `-` devant une ligne pour la barrer. Par défaut : `Filmer 5 secondes|Taper une commande|Exporter le clip|-Apprendre After Effects`.
- `--haut` : le titre de la carte (« À faire » par défaut).

Si l'utilisateur ne donne pas de lignes, proposer deux variantes liées au sujet de sa vidéo (les étapes faciles cochées, l'étape pénible barrée), puis prendre la première sans attendre s'il a dit de faire au mieux.

## Lancer

Le moteur est dans le skill `effets`, à côté de celui-ci : `<dossier de ce skill>/../effets/scripts/effet.py`. S'il n'a jamais tourné, suivre d'abord « Installation » dans `../effets/SKILL.md` (uv + `effet.py installer`).

    uv run "<dossier de ce skill>/../effets/scripts/effet.py" todo-list --video ma-video.mp4 --mots "Filmer 5 secondes|Taper une commande|Exporter le clip|-Apprendre After Effects"

Faire d'abord un aperçu avec `--rapide` (1 à 3 minutes selon l'effet), le montrer, puis relancer sans `--rapide` pour le rendu final avec flou de mouvement. Options communes : `--debut`, `--duree` (3,5 s par défaut), `--sortie`.

## Vérifier

Lire la planche `…-planche.jpg` écrite à côté du clip (outil Read) et contrôler :
- la carte ne cache pas le visage et toutes les lignes tiennent sur une ligne ;
- les coches et la ligne barrée sont visibles sur les dernières images.
Si un point rate, corriger (lignes plus courtes, autre passage de la vidéo avec `--debut`) et relancer avant de livrer. Donner ensuite le chemin du `.mp4` et la commande exacte utilisée, pour qu'on puisse la relancer sur une autre vidéo.
