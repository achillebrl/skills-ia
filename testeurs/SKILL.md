---
name: testeurs
description: Fait casser une app web par 20 testeurs automatiques avant le premier vrai utilisateur. Chacun a sa façon de « faire n'importe quoi » (double clics, retour arrière, champs vides, emoji dans un prix, date en l'an 3000, mobile au pouce), grâce à gremlins.js piloté par Playwright ; dès que quelque chose casse, il note l'écran et les dernières étapes. Rend la liste des bugs classés du plus grave au plus bête, avec les étapes pour les reproduire. À utiliser quand l'utilisateur dit « /testeurs », « casse mon app », « teste mon app avant de la lancer », « monkey test », « trouve les bugs de mon site ».
argument-hint: <url> [--n 20] [--secondes 40]
---

# Testeurs : 20 testeurs cassent ton app avant tes utilisateurs

Tu lâches une horde de testeurs automatiques sur l'app de l'utilisateur, tu regroupes ce qui a cassé et tu rends une liste de bugs classés, chacun avec ses étapes pour le reproduire. Tu ne modifies aucun fichier du projet sans accord : tout s'écrit dans `.testeurs/`.

Dis-le dans le rapport : ce sont des robots (gremlins.js), pas des humains. Ils trouvent les plantages, les erreurs serveur et les champs qui acceptent n'importe quoi ; pour savoir si la page est claire, il faut de vrais visiteurs (ou le skill `visiteurs`).

`S` = le dossier `scripts` de ce skill (en général `~/.claude/skills/testeurs/scripts`).

## Arguments

- `<url>` : obligatoire, de préférence en local (`http://localhost:3000`) ou sur une préversion. Sans URL, demande-la.
- `--n 20` : nombre de testeurs (5 en même temps). `--secondes 40` : durée de chaque testeur.

## 0. Préparer

1. **Sécurité d'abord.** Les testeurs remplissent et **envoient vraiment** les formulaires (inscriptions, commandes, e-mails, paiements). Si l'URL n'est ni `localhost`, ni `127.0.0.1`, ni une préversion (staging, preview, test…), demande confirmation avant de lancer, en rappelant ce risque. Ne lance jamais les testeurs sur un site qui n'appartient pas à l'utilisateur.
2. Crée `RUN=.testeurs/<AAAA-MM-JJ-HHMM>` dans le dossier courant (ajoute `.testeurs/` au `.gitignore` s'il existe).
3. Vérifie l'installation : `ls $S/node_modules/gremlins.js $S/node_modules/playwright`. Sinon : `npm install --prefix $S` puis `npx --prefix $S playwright install chromium` (une seule fois, ~1 min).

## 1. Lâcher les testeurs

`node $S/horde.mjs <url> $RUN --n 20 --secondes 40` (3 à 4 minutes pour 20 testeurs).

Les 5 profils tournent : **le pressé** (double clics, clics en rafale), **le distrait** (vide les champs et envoie quand même, revient en arrière), **le farceur** (emoji, 3 000 caractères, `-1`, `0`, `NaN`, date en l'an 3000), **le baladeur** (retour, suivant, recharge la page au milieu d'une action), **le pouce** (mobile, gestes tactiles). Un testeur sur deux est sur mobile. Chaque testeur a une graine fixe : il refait les mêmes gestes si on le relance.

Sortie : `testeur-<id>.json` (ses actions, ses erreurs avec les 10 dernières étapes), `ecran-<id>-<k>.png` (l'écran au moment de chaque nouvelle erreur) et `bugs-bruts.json` (erreurs regroupées, de la plus fréquente à la plus rare). Ce qui compte comme erreur : exception JavaScript, erreur dans la console, réponse HTTP 4xx ou 5xx de l'app, requête qui échoue, page qui plante, et champ qui accepte une valeur absurde (`valeur absurde acceptée`).

## 2. Comprendre chaque bug

1. Lis `bugs-bruts.json`, puis **regarde l'écran** de l'exemple de chaque bug (outil de lecture d'image).
2. Fusionne les doublons (même cause, messages différents) et écarte le bruit qui ne vient pas de l'app (extension, service tiers, favicon) en le disant.
3. Si le code est dans le dossier courant, cherche la cause : le message d'erreur, la route en erreur, le gestionnaire du bouton cité dans les étapes. Note le fichier et la ligne.

## 3. Classer, du plus grave au plus bête

- 🔴 **Bloquant** : l'app plante ou une action principale ne marche plus (payer, s'inscrire, ajouter au panier), ou une donnée est perdue (panier vidé, saisie effacée).
- 🟠 **Grave** : erreur serveur (5xx), exception sur une action courante, valeur absurde enregistrée (prix négatif, date en 3000).
- 🟡 **Gênant** : validation manquante sans dégât visible, erreur 4xx inattendue, erreur console sur une action rare.
- ⚪ **Bête** : cosmétique, cas extrême sans conséquence.

À gravité égale, le bug vu par le plus de testeurs passe devant.

## 4. Le rapport

Écris `$RUN/bugs.md`, un bloc par bug :

```
## 🔴 1. Le panier se vide après un double clic sur « Ajouter »
Vu par 4 testeurs sur 20 (pressé, pouce) · page /panier · capture : ecran-1-3.png
Étapes pour reproduire :
1. Ouvre /panier.
2. Double-clique sur « Ajouter au panier ».
3. Le compteur repasse à 0 et la console affiche « Cannot read properties of undefined (reading 'push') ».
Cause probable : src/panier.js:42, le gestionnaire dblclick remplace le tableau.
Correction proposée : …
```

Traduis les étapes notées (`double clic sur button « Ajouter au panier »`, `recharge la page`…) en phrases simples, numérotées, sans le bruit (scrolls, clics dans le vide). Pour revoir le testeur refaire exactement ses gestes : `node $S/horde.mjs <url> $RUN/rejeu --rejouer <id> --voir`.

Dans ta réponse : le nombre de bugs par gravité, les 5 premiers en une ligne chacun, le chemin de `bugs.md`, puis propose de les corriger un par un, en commençant par le premier. Ne modifie rien sans accord. Après les corrections, relance les mêmes testeurs pour vérifier.
