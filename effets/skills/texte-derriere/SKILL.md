---
name: texte-derriere
description: Effet vidéo « texte derrière » : un mot géant surgit dans le décor et passe derrière la personne (détourée sur la machine), avec une petite ligne au-dessus et un léger zoom. This skill should be used when the user types /texte-derriere or asks for a text-behind-subject, word behind me or behind-the-head title effect on a video.
---

# /texte-derriere — Texte derrière

Une petite ligne (« UN SEUL ») puis un mot géant (« PROMPT ») jaillissent lettre par lettre derrière ta tête, puis le mot passe à la couleur d'accent. La caméra zoome doucement (×1,14).

## Il faut

- **Une vidéo de toi** avec de l'espace au-dessus de la tête : la tête vers le milieu du cadre, pas collée en haut.
- **Un mot de 8 lettres au plus** (`--mot`) et une ligne de 16 caractères au plus (`--haut`, `""` pour aucune). La taille s'ajuste toute seule pour tenir dans le cadre.
- `--couleur "#4da3ff"` : couleur d'accent (orange Claude par défaut).

Si l'utilisateur ne donne pas de texte, proposer deux variantes courtes liées au sujet de sa vidéo, puis prendre la première sans attendre s'il a dit de faire au mieux.

## Lancer

Le moteur est dans le skill `effets`, à côté de celui-ci : `<dossier de ce skill>/../effets/scripts/effet.py`. S'il n'a jamais tourné, suivre d'abord « Installation » dans `../effets/SKILL.md` (uv + `effet.py installer`).

    uv run "<dossier de ce skill>/../effets/scripts/effet.py" texte-derriere --video ma-video.mp4 --haut "UN SEUL" --mot "PROMPT"

Faire d'abord un aperçu avec `--rapide` (1 à 3 minutes selon l'effet), le montrer, puis relancer sans `--rapide` pour le rendu final avec flou de mouvement. Options communes : `--debut`, `--duree` (3,5 s par défaut), `--sortie`, `--detourage fin` si les cheveux sont mal détourés.

## Vérifier

Lire la planche `…-planche.jpg` écrite à côté du clip (outil Read) et contrôler :
- le mot n'est pas coupé par les bords et reste lisible malgré la tête devant (si la tête cache plus de la moitié du mot, prendre un passage où la tête est plus basse, ou un mot plus court) ;
- la tête passe bien devant le mot (détourage propre).
Si un point rate, corriger (options, autre passage de la vidéo avec `--debut`) et relancer avant de livrer. Donner ensuite le chemin du `.mp4` et la commande exacte utilisée, pour qu'on puisse la relancer sur une autre vidéo.
