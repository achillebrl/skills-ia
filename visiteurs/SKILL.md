---
name: visiteurs
description: Fait tester un site par 100 visiteurs simulés à partir de vraies captures de la page (ordinateur et mobile) : chacun a un âge, un métier, une raison de venir, un appareil et une patience ; il regarde le haut de page 5 secondes, dit ce qu'il a compris, cherche le bouton, dit où il se perd et s'il passerait à l'action. Rend un rapport HTML avec cartes des clics et du premier regard, chiffres par profil, vérifications techniques (contraste, chargement, liens cassés), titres alternatifs re-testés, et les 5 corrections à faire ce soir. À utiliser quand l'utilisateur dit « /visiteurs », « teste mon site », « fais tester ma landing », « est-ce que ma page est claire », « pourquoi personne ne s'inscrit », ou donne une URL à évaluer avant de la montrer.
argument-hint: <url> [but de la page] [--n 100] [--rapide] [--avant <dossier d'un test précédent>]
---

# Visiteurs : 100 inconnus testent ton site

Tu fais passer une page devant des visiteurs **simulés**, à partir de **vraies captures** de cette page, et tu rends un rapport chiffré et actionnable. Tu ne modifies aucun fichier du projet sans accord : tout s'écrit dans `.visiteurs/`.

Dis-le toujours dans le rapport : ce sont des visiteurs simulés par l'IA. Ils repèrent vite les problèmes évidents (message flou, bouton invisible, objection non traitée) ; ils ne remplacent pas de vrais tests utilisateurs.

`S` = le dossier `scripts` de ce skill (le dossier du skill est indiqué quand il se charge, en général `~/.claude/skills/visiteurs/scripts`).

## Arguments

- `<url>` : obligatoire (site en ligne, ou `http://localhost:3000`). Sans URL, demande-la.
- `[but]` : ce que la page doit faire faire (« s'inscrire à la liste d'attente », « réserver un appel », « acheter »).
- `--n 100` : nombre de visiteurs. `--rapide` = 30 visiteurs et pas de test de titres.
- `--avant <dossier>` : compare au test précédent (après des corrections).

## 0. Préparer

1. Crée `RUN=.visiteurs/<AAAA-MM-JJ-HHMM>` dans le dossier courant (ajoute `.visiteurs/` au `.gitignore` s'il existe).
2. Vérifie que Playwright est installé pour les scripts : `ls $S/node_modules/playwright`. Sinon : `npm install --prefix $S` puis `npx --prefix $S playwright install chromium` (une seule fois, ~1 min).
3. Si l'installation est impossible (pas de Node, pas de réseau), passe en **mode dégradé** : lis la page avec ton outil web, saute les cartes et les vérifications techniques, et dis-le en tête du rapport.

## 1. Capturer et comprendre la page

1. `node $S/capture.mjs <url> $RUN` → `page-capture.json`, `page-desktop-fold.png`, `page-mobile-fold.png` (haut de page tel qu'on le voit sans défiler) et `page-<appareil>-ecran-N.png` (la page écran par écran, chaque élément cliquable entouré et numéroté `D1, D2…` sur ordinateur, `M1, M2…` sur mobile).
2. Lis `page-capture.json` (éléments, titres, texte visible sans défiler, signaux, liens) et **regarde les images** : les deux `fold`, puis les écrans.
3. Écris `$RUN/config.json` :
   ```json
   { "url": "…", "but": "réserver un appel", "public": "agences et marques qui lancent un produit",
     "offre": "ce que le site propose vraiment, en une phrase neutre",
     "cta": { "desktop": ["D3", "D2"], "mobile": ["M3", "M2"] } }
   ```
   - `but` et `public` : ceux de l'utilisateur, sinon déduis-les de la page **et dis-le** dans ta réponse finale.
   - `cta` : **tous** les identifiants qui mènent au but (le bouton du haut et ses doublons plus bas).
   - `offre` : la vérité de référence pour juger si un visiteur a « compris ».

## 2. Créer les visiteurs

Écris `$RUN/personas.json` : N visiteurs crédibles et variés, chacun :
`{ "id": 1, "prenom", "age", "metier", "raison": "pourquoi il arrive sur la page, d'où il vient", "segment": "cible" | "proche" | "hors-cible", "appareil": "mobile" | "ordinateur", "patience": "pressé" | "normal" | "curieux", "niveau_tech": "débutant" | "à l'aise" | "expert" }`

Répartition par défaut (adapte-la au public et dis-le) :
- segment : 60 % cible, 25 % proches (curieux, concurrents, partenaires, futurs clients pas encore prêts), 15 % hors cible ;
- appareil : 60 % mobile, 40 % ordinateur (50/50 pour un public B2B qui travaille sur ordinateur) ;
- patience : 40 % pressés, 40 % normaux, 20 % curieux ; âges de 18 à 70 ans répartis selon le public ;
- prénoms, métiers et raisons variés et réalistes pour le marché de la page (langue de la page). Pas de caricature.

## 3. La visite : un sous-agent par lot de 20

1. `node $S/lots.mjs $RUN` découpe les visiteurs en lots de 20 au plus, **du même appareil**, et écrit un brief complet par lot (`lot-K-brief.md` : l'offre, le but, les images de cet appareil seulement, la liste des éléments numérotés avec leur écran, les visiteurs et le protocole en 4 étapes : 5 secondes, compréhension, tâche, décision).
2. Lance **dans un seul message** un sous-agent (outil Agent) par lot, avec ce prompt :
   > Lis le fichier `<RUN>/lot-K-brief.md` et exécute exactement ce qu'il demande (lis les images qu'il cite avec ton outil de lecture, puis écris le fichier JSON demandé). Réponds seulement « ok » à la fin.

   Si l'outil Agent accepte un modèle, prends un modèle rapide (par exemple `sonnet`) pour les visiteurs : ils jugent des captures, ils n'ont pas besoin du plus gros modèle, et le test coûte beaucoup moins cher. Garde ton modèle pour l'analyse.
3. Quand tous ont fini : `node $S/merge.mjs $RUN` (écrit `reponses.json` et signale les réponses manquantes ou invalides). Relance un lot manquant ou invalide.
4. Survole `reponses.json` : si beaucoup de visiteurs se plaignent d'écrans vides ou d'éléments absents, regarde les captures ; une page qui cache son contenu derrière une connexion, un pop-up ou une animation peut fausser le test, et il faut le dire.

## 4. Chiffres

`node $S/report.mjs $RUN --stats` : compris, restent, bouton trouvé (et sans défiler), perdus, décisions, par appareil et par segment, clics les plus fréquents, vérifications techniques. Ces chiffres sont calculés : ne les invente pas et ne les modifie pas.

## 5. Analyse

Relis `reponses.json` (surtout les `compris_5s` faux, `perdu`, `objection`, `manque`) et regroupe en thèmes. Écris `$RUN/analyse.json` :
```json
{ "verdict": "une phrase : le problème n° 1 et son effet",
  "incompris": [{ "titre": "Ils croient que c'est un outil d'emailing", "nb": 23, "citations": ["…", "…"] }],
  "rates": [{ "titre": "Le bouton ne dit pas ce qui se passe après", "nb": 31, "detail": "…" }],
  "corrections": [{ "titre": "Réécrire le titre", "quoi": "Remplacer « … » par « … »", "pourquoi": "23 visiteurs sur 100 ont cru …", "impact": "fort" }] }
```
- 2-3 `incompris`, 2-3 `rates`, avec le nombre réel de visiteurs (compte-les dans `reponses.json`).
- **5 corrections**, classées par impact, faisables en une soirée, chacune **concrète** (le texte proposé, l'emplacement, la taille) et **justifiée** par un chiffre du test ou une vérification technique.

## 6. Tester des titres (sauf `--rapide`)

Si un `<h1>` existe et que la compréhension n'est pas déjà excellente (plus de 85 %) :
1. Écris 3 titres (et au besoin 3 sous-titres) qui corrigent l'incompréhension n° 1, dans le ton de la marque.
2. Pour chacun : `node $S/capture.mjs <url> $RUN --name variante-<K> --h1 "…" [--sub "…"]` (le titre est remplacé dans la vraie page, puis capturé).
3. Choisis 30 visiteurs déjà utilisés, représentatifs (segments et appareils), et prépare un brief par variante : `node $S/lots.mjs $RUN --variante <K> --ids 3,7,12,…`. Lance **dans un seul message** un sous-agent par variante avec le même prompt que pour les lots (`variante-<K>-brief.md`). Chacun écrit `$RUN/variante-<K>-reponses.json`.
4. Relance `node $S/report.mjs $RUN --stats` : chaque variante est comparée au titre actuel sur les **mêmes** visiteurs. Si une variante gagne d'au moins 10 points, mets-la en correction n° 1 avec son score ; sinon dis que le titre n'est pas le problème.

## 7. Rapport

1. `node $S/report.mjs $RUN` (ajoute `--avant <dossier>` si l'utilisateur l'a donné ou si un test précédent de la même URL existe dans `.visiteurs/`) → `$RUN/rapport.html`. Ouvre-le (`open` sur Mac, `xdg-open` sur Linux, `start` sur Windows).
2. Réponds dans le chat, court :
   - les 4 chiffres (compris en 5 s, restent, trouvent le bouton, passeraient à l'action), et les écarts avec le test précédent s'il y en a ;
   - le verdict ;
   - les 5 corrections, une ligne chacune ;
   - le chemin du rapport ;
   - ce que tu as déduit toi-même (but, public, répartition) si l'utilisateur ne l'a pas donné.
3. Si le code du site est dans le dossier courant, propose d'appliquer les corrections une par une, puis de relancer `/visiteurs <url> --avant $RUN` pour mesurer l'effet.

## Coût et limites

- Un test complet = environ N/20 + 3 sous-agents qui lisent des images : compte 5 à 10 minutes et une part notable de ton quota (de l'ordre de 150 000 jetons par lot) ; `--rapide` divise le coût par 3, un modèle rapide pour les visiteurs aussi.
- La capture fait défiler la page pour déclencher les animations d'apparition ; un contenu qui n'apparaît qu'après un clic ou une connexion n'est pas vu.
- Les visiteurs ne remplissent pas de formulaire et ne paient pas : ils jugent la page, pas le parcours après le clic.
- Pages derrière une connexion : non gérées (capture de la page publique seulement).
