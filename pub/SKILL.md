---
name: pub
description: Crée une pub animée de 15 à 25 s pour une marque (motion design en HTML/Canvas, voix off ElevenLabs facultative), puis la rend en MP4 1920 × 1080 avec Playwright et ffmpeg. À utiliser quand on demande « fais une pub pour ma marque », « pub animée », « spot de 20 secondes », « vidéo promo de mon appli », « /pub <marque> ».
---

# Pub animée pour ta marque

Tu fabriques une pub de motion design de 15 à 25 s, codée image par image : une toile 1920 × 1080, une fonction `dessin(ctx, t)` pure, aucune vidéo IA ni banque d'images. Le moteur et les scripts sont dans ce dossier (`moteur/`, `scripts/`). L'exemple complet `exemples/panyo/marque.js` (appli de courses fictive, 19 s, 10 scènes) est le modèle à suivre.

## 1. Le brief (une seule question groupée)

Demande seulement ce qui manque : le nom de la marque et ce qu'elle vend, la promesse principale, 2 ou 3 arguments, la couleur principale (sinon propose-en une), le logo s'il existe (PNG dans le dossier de la marque), la langue, et si l'utilisateur veut une voix off (clé `ELEVENLABS_API_KEY`). Sans réponse, pars sur des choix raisonnables et dis lesquels.

## 2. Le texte de la voix off

Écris `marques/<marque>/texte.txt` : 8 à 12 phrases très courtes, 40 à 50 mots en tout (≈ 18 s). Structure qui marche :
1. La douleur en question (« Plus rien dans le frigo ? »).
2. Le nom (« Ouvre Panyo ! »).
3. Ce que c'est, en une phrase.
4. Deux ou trois bénéfices, un par phrase, chacun montrable à l'image.
5. Le nom + la signature, puis l'appel (« Télécharge l'appli ! »).

N'invente aucun chiffre présenté comme vrai : un prix ou une note d'exemple est écrit « exemple » à l'écran.

## 3. La voix (facultative)

```bash
ELEVENLABS_API_KEY=… node scripts/voix.mjs marques/<marque> [voice_id]
```

Le script écrit `voix.mp3` et `voix.json` (début et fin de chaque mot). Sans voice_id, il prend « Chloé » (voix féminine française de la bibliothèque ElevenLabs). Pour une autre voix, liste-les avec l'API `GET /v2/voices` ou demande à l'utilisateur. Sans voix, la pub marche quand même : les temps de repli de `mot()` servent.

## 4. Les scènes

Copie `exemples/panyo/marque.js` dans `marques/<marque>/marque.js` et réécris-le. Le fichier exporte une fonction qui reçoit `{ mot }` et renvoie `{ duree, dessin(ctx, t) }`.

- **Une scène par phrase**, bornée par les temps des mots : `mot("panier", apres, defaut)` donne le début du premier mot qui commence par « panier » après `apres` secondes (accents et ponctuation ignorés). Ajoute `DECALAGE` (0,3 s) : la voix démarre à 0,3 s dans la vidéo.
- **Chaque apparition est calée sur le mot qui la dit** : `pop(t, T.panier - 0.1)` fait entrer un élément en rebond juste avant le mot.
- **Briques du moteur** (`moteur/moteur.js`) : `fond`, `texte` (rebond, alignement), `motsParMots`, `trait` (trait qui se dessine le long d'une courbe, la signature visuelle), `balayage` (transition : trait épais qui traverse l'écran), `telephone` (maquette de téléphone avec un écran dessiné par toi), `pastille`, `picto` (emoji), `rect`, `prog`, `pop`, `easeOut`.
- **Grammaire visuelle** : deux tons (la couleur de la marque et le blanc) qui alternent d'une scène à l'autre, un mot-clé en couleur par scène, beaucoup de vide, un seul mouvement principal à la fois, le téléphone de l'appli dès que la marque est nommée, le logo et l'appel à la fin.
- Rien d'aléatoire, rien qui dépend de l'horloge : seulement `t`. Sinon le rendu image par image tremble.

## 5. Contrôler, puis rendre

```bash
node scripts/rendu.mjs marques/<marque> apercu 1 3 5 7 9 11 13 15 17   # planche marques/<marque>/apercu.jpg
node scripts/rendu.mjs marques/<marque>                                  # marques/<marque>/pub.mp4
```

Lis `apercu.jpg` avec l'outil de lecture d'image : textes qui se chevauchent, éléments coupés, trait mal placé. Corrige, refais l'aperçu, puis lance le rendu (environ 1 min pour 20 s). Une musique libre de droits posée dans `marques/<marque>/musique.mp3` passe sous la voix (−16 dB) ; le son final est à −14 LUFS.

## 6. Livrer

Donne le chemin de `pub.mp4`, sa durée, et rappelle :
- de n'utiliser que des marques et des logos dont l'utilisateur a les droits ;
- qu'une pub pour une marque inventée doit rester marquée « fictive » si elle est publiée ;
- que le format 1920 × 1080 se recadre en vertical en changeant `W`, `H` et la taille de la toile dans `moteur/pub.html` (1080 × 1920), puis en replaçant les éléments.
