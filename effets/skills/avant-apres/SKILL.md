---
name: avant-apres
description: Effet vidéo « avant / après » : un curseur glisse sur la vidéo, « avant » à gauche, « après » à droite, et deux sous-titres mot à mot surlignés apparaissent côté « après ». This skill should be used when the user types /avant-apres or asks for a before/after slider, comparison or reveal effect for a reel.
---

# /avant-apres — Avant / après

Un curseur part de la droite, s'arrête au milieu (les deux côtés côte à côte), puis repart vers la gauche. Côté « après », deux sous-titres arrivent mot par mot, le dernier mot surligné en jaune.

## Il faut

- **Deux vidéos, le vrai avant et le vrai après** (`--avant brut.mp4 --video final.mp4`) : c'est le plus honnête, le spectateur voit la vraie différence.
- **Ou une seule vidéo** (`--video`) : l'avant est alors simulé (désaturé, terne) et l'après légèrement étalonné. Le dire à l'utilisateur, et ne pas présenter ça comme un vrai résultat.
- **Deux sous-titres courts** séparés par `|` (`--legendes "Un seul prompt.|Rendu pro."`), 3 mots chacun au plus.

Si l'utilisateur ne donne pas de texte, proposer deux variantes courtes liées au sujet de sa vidéo, puis prendre la première sans attendre s'il a dit de faire au mieux.

## Lancer

Le moteur est dans le skill `effets`, à côté de celui-ci : `<dossier de ce skill>/../effets/scripts/effet.py`. S'il n'a jamais tourné, suivre d'abord « Installation » dans `../effets/SKILL.md` (uv + `effet.py installer`).

    uv run "<dossier de ce skill>/../effets/scripts/effet.py" avant-apres --video final.mp4 [--avant brut.mp4] --legendes "Un seul prompt.|Rendu pro."

Faire d'abord un aperçu avec `--rapide` (1 à 3 minutes selon l'effet), le montrer, puis relancer sans `--rapide` pour le rendu final avec flou de mouvement. Options communes : `--debut`, `--duree` (3,5 s par défaut), `--sortie`.

## Vérifier

Lire la planche `…-planche.jpg` écrite à côté du clip (outil Read) et contrôler :
- les sous-titres sont lisibles quand le curseur est à gauche ;
- les étiquettes AVANT / APRÈS sont du bon côté et la différence se voit.
Si un point rate, corriger (options, autre passage de la vidéo avec `--debut`) et relancer avant de livrer. Donner ensuite le chemin du `.mp4` et la commande exacte utilisée, pour qu'on puisse la relancer sur une autre vidéo.
