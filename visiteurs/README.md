# Skill « visiteurs » pour Claude Code

100 visiteurs simulés testent ton site avant que tu le montres. Ils partent de **vraies captures** de ta page (ordinateur et mobile) :

- chacun a un âge, un métier, une raison de venir, un appareil et une patience ;
- il regarde le haut de page **5 secondes** et dit ce qu'il a compris, avec ses mots ;
- il cherche le bouton, défile selon sa patience, dit où il hésite et s'il passerait à l'action.

Tu reçois un **rapport HTML** :

- les 4 chiffres clés (compris en 5 s, restent, trouvent le bouton, passeraient à l'action) ;
- les **cartes des clics et du premier regard** sur tes captures ;
- ce que personne n'a compris, ce que tout le monde a raté, avec le nombre de visiteurs ;
- les **5 corrections à faire ce soir**, chacune justifiée par un chiffre ;
- **3 titres alternatifs testés** dans ta vraie page sur les mêmes visiteurs (est-ce que le titre est vraiment le problème ?) ;
- les chiffres par profil (mobile, ordinateur, public visé, curieux, hors cible) ;
- les vérifications techniques : contraste des boutons, temps de chargement, liens cassés, prix et preuves visibles ou non.

Ce sont des visiteurs simulés par l'IA, pas de vrais utilisateurs : un premier filtre pour repérer les problèmes évidents avant de montrer ton site à de vrais gens.

## Installer (1 minute)

1. Copie le dossier `visiteurs` dans `~/.claude/skills/` (Mac / Linux) ou `%USERPROFILE%\.claude\skills\` (Windows).
2. Relance Claude Code.

Il faut Node.js. Au premier lancement, le skill installe tout seul Playwright et Chromium dans son dossier (une minute, une seule fois).

## Utiliser

    /visiteurs https://ton-site.fr

ou `/visiteurs https://ton-site.fr réserver un appel` pour préciser le but de la page. Ça marche aussi en local (`http://localhost:3000`).

- `--rapide` : 30 visiteurs, sans test de titres (3 fois moins cher).
- `--n 50` : choisir le nombre de visiteurs.
- `--avant .visiteurs/<date>` : après tes corrections, compare au test précédent.

Tout s'écrit dans `.visiteurs/<date>/` dans ton projet (captures, visiteurs, réponses, `rapport.html`). Le skill ne modifie pas ton code sans ton accord ; il te propose ensuite d'appliquer les corrections une par une.

## Coût

Un test complet lance environ 5 à 8 sous-agents qui lisent des captures : quelques minutes et une part notable de ton quota Claude. Le skill utilise un modèle rapide pour les visiteurs quand c'est possible, et `--rapide` divise le coût par 3.

— [@achille.ia](https://www.instagram.com/achille.ia/)
