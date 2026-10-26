---
name: ecran-led
description: Effet vidéo « écran LED » : des mots en points LED (sous-pixels rouge, vert, bleu) jaillissent avec un flou de zoom, puis la vidéo apparaît sur l'écran LED et la caméra recule sur un panneau géant avec halo et reflet. This skill should be used when the user types /ecran-led or asks for an LED screen, dot matrix, billboard or pixel-text effect for a reel.
---

# /ecran-led — Écran LED

Des mots en points LED sortent un par un de l'écran. À 1 s, ta vidéo s'allume sur l'écran, puis la caméra recule : l'écran devient un panneau géant sur un mur sombre, avec un halo et son reflet au sol.

## Il faut

- **2 à 6 mots ou groupes courts** séparés par `|` (`--mots "Tout|fait|en un|prompt"`) : 6 caractères par groupe au plus pour rester gros.
- **Vidéo facultative** : un plan bien éclairé et contrasté rend mieux en LED (90 × 160 points). Sans vidéo, les mots seuls sur l'écran, sans recul.

Si l'utilisateur ne donne pas de texte, proposer deux variantes courtes liées au sujet de sa vidéo, puis prendre la première sans attendre s'il a dit de faire au mieux.

## Lancer

Le moteur est dans le skill `effets`, à côté de celui-ci : `<dossier de ce skill>/../effets/scripts/effet.py`. S'il n'a jamais tourné, suivre d'abord « Installation » dans `../effets/SKILL.md` (uv + `effet.py installer`).

    uv run "<dossier de ce skill>/../effets/scripts/effet.py" ecran-led --mots "Tout|fait|en un|prompt" [--video ma-video.mp4]

Faire d'abord un aperçu avec `--rapide` (1 à 3 minutes selon l'effet), le montrer, puis relancer sans `--rapide` pour le rendu final avec flou de mouvement. Options communes : `--debut`, `--duree` (3,5 s par défaut), `--sortie`.

## Vérifier

Lire la planche `…-planche.jpg` écrite à côté du clip (outil Read) et contrôler :
- chaque mot est lisible au moment où il apparaît ;
- avec une vidéo, le visage se reconnaît sur le panneau (sinon prendre un passage plus lumineux).
Si un point rate, corriger (options, autre passage de la vidéo avec `--debut`) et relancer avant de livrer. Donner ensuite le chemin du `.mp4` et la commande exacte utilisée, pour qu'on puisse la relancer sur une autre vidéo.
