---
name: visiteurs
description: Fait tester un site par 100 visiteurs simulés (chacun avec un âge, un métier, une raison de venir et un appareil) : chacun regarde la page 5 secondes, dit ce qu'il a compris, cherche le bouton principal et dit où il s'est perdu. Rend un rapport avec ce que personne n'a compris, ce que tout le monde a raté et les 5 corrections à faire ce soir. À utiliser quand l'utilisateur dit « /visiteurs », « teste mon site », « fais tester ma landing », « est-ce que ma page est claire », ou donne une URL à évaluer avant de la montrer.
---

# Visiteurs : 100 inconnus testent ton site

Tu fais passer la page de l'utilisateur devant 100 visiteurs **simulés** et tu rends un rapport court et actionnable. Dis-le clairement dans le rapport : ce sont des visiteurs simulés par l'IA, pas de vrais utilisateurs ; ils servent à repérer les problèmes évidents avant de montrer la page à de vrais gens. Tu ne modifies aucun fichier sauf si l'utilisateur le demande après le rapport.

## 1. Récupérer la page

- Entrée : une URL (ou un fichier HTML local / un `localhost`). Sans entrée, demande l'URL.
- Demande en une ligne, si ce n'est pas évident, **le but de la page** (ex. « s'inscrire à la liste d'attente », « réserver un appel ») et **le public visé**. Si l'utilisateur ne répond pas, déduis-les de la page et dis-le.
- Capture ce que verrait un visiteur :
  - le texte de la page (outil de lecture web, ou `curl -sL <url>`) ;
  - si Playwright est disponible (`npx playwright --version`), deux captures du haut de page : `npx playwright screenshot --viewport-size=1440,900 <url> visiteurs-desktop.png` et `npx playwright screenshot --device="iPhone 13" <url> visiteurs-mobile.png`. Lis-les : ce qui est visible **sans défiler** compte le plus pour le test des 5 secondes.
- Note la liste des boutons et liens visibles en haut de page, avec leur texte exact.

## 2. Créer les 100 visiteurs

Écris `visiteurs/personas.json` : 100 visiteurs variés, chacun avec `id`, `prenom`, `age`, `metier`, `raison` (pourquoi il arrive sur la page), `appareil` (mobile ~60 %, ordinateur ~40 %), `patience` (pressé / normal / curieux), `niveau_tech` (débutant / à l'aise / expert). Répartis-les : ~60 % du public visé, ~25 % proches (curieux, concurrents, partenaires), ~15 % hors cible. Pas de caricature ; des gens crédibles.

## 3. Les faire visiter (10 sous-agents en parallèle)

Lance **dans un seul message** 10 sous-agents (outil Agent), 10 visiteurs chacun. Donne à chacun : le texte de la page, les chemins des captures, la liste des boutons, le but de la page et ses 10 visiteurs. Consigne :

> Pour chaque visiteur, mets-toi à sa place (âge, métier, raison, appareil, patience) et réponds en JSON, une ligne par visiteur :
> `{"id", "compris_5s": "ce qu'il croit que fait le site, en une phrase, avec ses mots", "juste": true/false (correspond au vrai but), "reste": true/false, "bouton_cherche": "ce qu'il cherche à cliquer", "bouton_trouve": "texte exact du bouton qu'il cliquerait, ou null", "perdu": "où et pourquoi il bloque, ou null", "citation": "une phrase qu'il dirait à voix haute"}`
> Ne te base que sur ce qui est visible dans la page et les captures. Un visiteur pressé sur mobile ne voit que le haut de page. Sois honnête : si la page est floue pour lui, dis-le.

Rassemble les 100 réponses dans `visiteurs/reponses.json`.

## 4. Rapport

Calcule et écris `visiteurs/rapport.md`, puis affiche-le :

```
## 100 visiteurs ont testé <url>
(visiteurs simulés par IA — à confirmer avec de vrais utilisateurs)

- Ont compris ce que fait le site en 5 s : X / 100
- Seraient restés : X / 100
- Ont trouvé le bouton principal : X / 100   (mobile : X %, ordinateur : X %)

### Ce que personne n'a compris
Les 2-3 incompréhensions les plus fréquentes, avec 2 citations de visiteurs.

### Ce que tout le monde a raté
Les 2-3 blocages les plus fréquents (bouton invisible, jargon, prix caché…), avec le nombre de visiteurs concernés.

### Les 5 trucs à corriger ce soir
1. … (quoi changer exactement : texte proposé, emplacement, taille)
2. …
5. …

### Par profil
Une ligne par groupe (public visé, proches, hors cible ; mobile vs ordinateur) : ce qui change.
```

- Les 5 corrections sont concrètes et faisables en une soirée (réécrire le titre, déplacer le bouton, afficher le prix…), classées par impact.
- Termine en proposant d'appliquer les corrections dans le code si le site est dans le dossier courant.
