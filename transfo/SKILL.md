---
name: transfo
description: Transformation IA en pleine phrase pour reels — la personne filmée face caméra devient une autre personne (fictive) qui termine sa phrase avec ses gestes, sa bouche et sa voix transformée, puis présente un objet. Pipeline fal.ai (Nano Banana Pro, Kling 2.6 Motion Control, ElevenLabs voice changer) et montage avec flash et mention « Vidéo générée par IA ». This skill should be used when the user types /transfo, or asks to turn themselves into another person in a video, make an AI character finish their sentence, a "transformation" or "character swap" reel, or a UGC-style promo played by an AI persona.
---

# /transfo — tu deviens quelqu'un d'autre en pleine phrase

Tu parles face caméra ; à la première pause, flash blanc, et une autre personne termine ta phrase avec tes gestes, ton visage, ta bouche, et ta voix transformée. Puis elle présente ton objet.

## Il faut

- **Une vidéo de 10 à 30 s où l'utilisateur parle**, téléphone fixe, cadré de la taille à la tête, mains visibles, gestes calmes, une petite pause là où la bascule doit se faire. Un objet en main si une présentation est prévue (sans logo de marque).
- **Une description de la personne** (`--personne`) : toujours **une personne fictive**. Refuser de reproduire le visage d'une personne réelle (célébrité, proche, créateur d'une vidéo virale) : c'est interdit par Meta, TikTok et YouTube, et puni par la loi. Les personnes types et leurs consignes sont dans `references/prompts.md`.
- **Une clé fal.ai** (`FAL_KEY`, https://fal.ai/dashboard/keys) avec quelques dollars. Le reste s'installe tout seul avec **uv** (`curl -LsSf https://astral.sh/uv/install.sh | sh` si absent, après accord).

## Marche à suivre

1. **Devis, sans rien payer** :

       uv run "<dossier de ce skill>/scripts/transfo.py" ma-video.mp4 --personne "<personne>" --devis

   Le script affiche la durée, la seconde de bascule trouvée (première pause après 1,5 s), l'image modèle et **le coût estimé en dollars**. Montrer ce coût à l'utilisateur et **attendre son accord** avant l'étape 2. Si la bascule tombe mal, la placer à la main avec `--bascule 3.4` (juste avant le mot qui doit être dit par l'autre personne).

2. **Génération** (payante) : même commande avec `--oui` à la place de `--devis`. Options :
   - `--voix Charlotte` : voix ElevenLabs du voice changer (voir `references/prompts.md`) ; `--sans-voix` pour garder la voix d'origine ;
   - `--qualite pro` : Kling Pro, plus net, 1,6 fois plus cher ;
   - `--image-a 5.2` : seconde de l'image qui sert de modèle (choisir un moment où l'objet est bien visible).

3. **Vérifier** la planche `…-planche.jpg` (outil Read) : la bascule tombe au bon endroit, la nouvelle personne garde la pièce, l'objet et la pose, la mention « Vidéo générée par IA » est lisible. Écouter : la voix suit bien les mots. Si l'image de la personne ne convient pas, supprimer `personne.png` du dossier `.transfo/…` et relancer (seule cette étape et les suivantes sont refaites et repayées).

4. Donner le chemin du `.mp4`, le coût réel et les fichiers bruts (`.transfo/<vidéo>/` : personne, vidéo Kling, voix) pour un autre montage.

## Publier proprement

Rappeler à l'utilisateur, à chaque fois :
- activer l'étiquette **« Info IA »** (Instagram) ou **« Contenu généré par l'IA »** (TikTok) à la publication ; c'est obligatoire et, dans l'UE, imposé par l'AI Act (article 50) depuis le 2 août 2026 ;
- si un produit est présenté contre une contrepartie : **« Collaboration commerciale »** ; en France, la loi influence (2023-451) demande aussi **« Images virtuelles »** pour un visage généré par IA dans une promo ;
- ne jamais laisser croire que la personne existe.
