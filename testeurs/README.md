# Skill « testeurs » pour Claude Code

Ton app marche nickel… quand c'est toi qui cliques. Ce skill lâche **20 testeurs automatiques** sur ton app avant ton premier vrai utilisateur :

- **le pressé** double-clique et clique en rafale ;
- **le distrait** vide les champs et envoie quand même ;
- **le farceur** met un emoji dans le prix, 3 000 caractères dans le nom, une date en l'an 3000 ;
- **le baladeur** fait retour, suivant et recharge la page au milieu d'une action ;
- **le pouce** fait tout ça sur mobile.

Dès que quelque chose casse (exception JavaScript, erreur serveur, requête qui échoue, champ qui accepte n'importe quoi), le testeur note **l'écran** et **les dernières étapes**. À la fin, Claude te rend **la liste des bugs classés du plus grave au plus bête**, avec les étapes pour les reproduire, la cause probable dans ton code et la correction proposée.

Les testeurs sont des robots ([gremlins.js](https://github.com/marmelab/gremlins.js), piloté par [Playwright](https://playwright.dev)) : ils trouvent les plantages et les validations manquantes, pas les problèmes de compréhension. Pour ça, il y a le skill [visiteurs](../visiteurs/).

## ⚠️ À lancer sur ton app, en local ou en préversion

Les testeurs **remplissent et envoient vraiment** les formulaires. Lance-les sur `http://localhost:3000` ou sur une préversion, jamais sur un site en production avec de vrais paiements ou de vrais e-mails, et jamais sur un site qui n'est pas à toi.

## Installer (1 minute)

1. Copie le dossier `testeurs` dans `~/.claude/skills/` (Mac / Linux) ou `%USERPROFILE%\.claude\skills\` (Windows).
2. Relance Claude Code.

Il faut Node.js. Au premier lancement, le skill installe tout seul gremlins.js, Playwright et Chromium dans son dossier (une minute, une seule fois).

## Utiliser

    /testeurs http://localhost:3000

- `--n 20` : nombre de testeurs (5 en même temps).
- `--secondes 40` : durée de chaque testeur.

Tout s'écrit dans `.testeurs/<date>/` dans ton projet : les captures, les actions de chaque testeur, `bugs-bruts.json` et le rapport `bugs.md`. Le skill ne modifie pas ton code sans ton accord ; il te propose ensuite de corriger les bugs un par un.

Chaque testeur a une graine fixe : pour le revoir refaire exactement les mêmes gestes, `node scripts/horde.mjs <url> .testeurs/rejeu --rejouer <id> --voir`.

## Coût

La horde tourne sur ta machine (3 à 4 minutes pour 20 testeurs) et ne consomme rien. Seule l'analyse finale (lire les erreurs et les captures, chercher la cause dans ton code) utilise ton quota Claude.

— [@achille.ia](https://www.instagram.com/achille.ia/)
