---
name: effets
description: Moteur commun de 12 effets vidéo verticaux pour reels (carrousel 3D, papier découpé, texte derrière, écran LED, doodle, avant/après, clones, VHS, néon, mosaïque, BD, mise en abyme), rendus image par image sur la machine de l'utilisateur. This skill should be used when the user types /effets, asks which video effects are available, how to install them, or when one of the commands /carrousel-3d, /papier-decoupe, /texte-derriere, /ecran-led, /doodle, /avant-apres, /clones, /vhs, /neon, /mosaique, /bd, /mise-en-abyme needs installation help or troubleshooting.
---

# Effets vidéo pour reels (moteur commun)

Douze commandes, une par effet. Chacune prend une vidéo (ou des images) et rend un clip vertical **1080 × 1920, 30 i/s**, avec flou de mouvement, prêt à monter dans un reel :

| Commande | Effet | Il faut |
|---|---|---|
| `/carrousel-3d` | tes images sur un anneau 3D qui tourne | 3 à 8 images ; vidéo de fond facultative |
| `/papier-decoupe` | toi en autocollant sur un collage de papiers, lettres découpées | une vidéo de toi |
| `/texte-derriere` | un mot géant qui passe entre toi et le décor | une vidéo de toi, de l'espace au-dessus de la tête |
| `/ecran-led` | des mots en points LED, puis ta vidéo sur un panneau géant | des mots ; vidéo facultative |
| `/doodle` | contour blanc qui tremble autour de toi, couronne et dessins à main levée | une vidéo de toi |
| `/avant-apres` | un curseur glisse entre « avant » et « après », sous-titres animés | une vidéo (ou deux : avant et après) |
| `/clones` | deux autres toi de chaque côté, à d'autres moments de ta vidéo | une vidéo de toi (détourée) |
| `/vhs` | caméscope 1998 : couleurs qui bavent, lignes, sauts, PLAY, REC, date | une vidéo |
| `/neon` | contour néon qui s'allume, échos colorés de tes gestes | une vidéo de toi qui bouge (détourée) |
| `/mosaique` | ton titre en 60 tuiles qui se retournent sur ta vidéo | une vidéo, un titre |
| `/bd` | case de BD : trame, contour encré, onomatopée, bulle | une vidéo de toi (détourée) |
| `/mise-en-abyme` | ta vidéo dans ta vidéo, zoom sans fin | une vidéo |

Quand l'utilisateur tape `/effets` seul : montrer ce tableau, vérifier l'installation (ci-dessous) et proposer l'effet qui colle à sa vidéo.

## Installation (une fois)

Le script `scripts/effet.py` déclare ses dépendances (Playwright, rembg, ffmpeg via imageio-ffmpeg, Pillow, NumPy) dans son en-tête : **uv** les installe tout seul.

1. Vérifier `uv --version`. S'il manque : `curl -LsSf https://astral.sh/uv/install.sh | sh` (Mac / Linux) ou `powershell -c "irm https://astral.sh/uv/install.ps1 | iex"` (Windows), après accord de l'utilisateur.
2. Lancer `uv run "<dossier de ce skill>/scripts/effet.py" installer` : Chromium pour Playwright et le modèle de détourage (≈ 180 Mo), une seule fois.

Sans uv : `pip install playwright imageio-ffmpeg numpy pillow "rembg[cpu]"` (Python 3.10 ou plus), puis `python effet.py …` à la place de `uv run effet.py …`.

## Lancer un effet

    uv run "<dossier de ce skill>/scripts/effet.py" <effet> --video ma-video.mp4 [options]

Options communes :
- `--debut 2.5` : secondes à sauter au début de la vidéo ; `--duree 3.5` : durée du clip (3,5 s par défaut, 1,5 s minimum).
- `--rapide` : aperçu sans flou de mouvement, 4 fois plus rapide. Le rendu final se fait sans.
- `--detourage fin` : détourage plus précis sur les cheveux, environ 15 fois plus lent (papier-decoupe, texte-derriere, doodle, clones, neon, bd).
- `--sortie clip.mp4` : sinon `effets-sortie/<effet>-<date>.mp4` dans le dossier courant.

Ce qui se passe : la vidéo est recadrée en 9:16 au centre ; pour les effets qui détourent, chaque image passe dans rembg **sur la machine** (rien n'est envoyé en ligne, ≈ 0,5 s par image) ; la page `moteur/effet.html` est rendue avec Playwright, 4 sous-images par image ; le son d'origine est gardé. Le détourage est mis en cache dans `.effets/cache/` : un 2e effet sur la même vidéo ne le refait pas.

Durées constatées sur un Mac récent pour un clip de 3,5 s : détourage ≈ 50 s (une fois par vidéo), aperçu `--rapide` 30 s à 1 min 30, rendu final avec flou de mouvement 1 à 3 min selon l'effet.

## Vérifier avant de rendre la main

Le script écrit à côté du clip une planche de 6 images (`…-planche.jpg`). La lire (outil Read) et contrôler ce que demande la commande (texte coupé, tête mal placée, détourage qui bave). Corriger avec les options plutôt que de livrer un clip raté.

## En cas de souci

- « La page ne s'est pas chargée » : relancer avec `--rapide` pour voir l'erreur ; vérifier que les textes ne contiennent pas de guillemets non échappés.
- Détourage qui attrape un objet (lampe, fauteuil) : `--detourage fin`, ou un plan avec un fond plus simple.
- Vidéo horizontale : elle est recadrée au centre ; prévenir l'utilisateur si la personne n'est pas au centre.
- Les polices (Geist, JetBrains Mono, Instrument Serif) sont sous licence SIL OFL, fournies dans `moteur/polices/`.
