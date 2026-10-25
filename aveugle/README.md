# Skill « aveugle » pour Claude Code

Ton site marche… tant qu'on a des yeux et une souris. Ce skill le fait parcourir comme une personne aveugle, **au clavier uniquement** :

- **axe-core** passe la page aux règles WCAG 2.2 (A et AA) ;
- **Tab, Maj+Tab, Entrée, Espace**, pilotés par [Playwright](https://playwright.dev) : l'ordre de focus, les éléments impossibles à atteindre, les **pièges à focus**, le **focus invisible** ;
- ce que **lit le lecteur d'écran** : les images sans alternative, les boutons et liens sans nom (ou juste nommés « bouton »), les champs sans étiquette ;
- chaque **formulaire** rempli et envoyé au clavier seulement (l'envoi est intercepté : rien ne part).

Tu reçois **les corrections classées de la plus bloquante à la plus simple**, chacune avec l'élément exact, ce que vit l'utilisateur et le code corrigé. Claude te propose ensuite de corriger ton code, une correction à la fois.

## Pourquoi maintenant

Depuis le **28 juin 2025**, l'**European Accessibility Act** (directive UE 2019/882, transposée en France par la loi n° 2023-171) impose l'accessibilité aux sites de **commerce électronique**. Les micro-entreprises (moins de 10 salariés et 2 M€ de chiffre d'affaires ou de bilan au plus) sont exemptées.

Ce skill est un **premier filtre automatique** : il ne remplace ni un audit RGAA certifié, ni un test avec un vrai lecteur d'écran (VoiceOver, NVDA).

## Installer (1 minute)

1. Copie le dossier `aveugle` dans `~/.claude/skills/` (Mac / Linux) ou `%USERPROFILE%\.claude\skills\` (Windows).
2. Relance Claude Code.

Il faut Node.js. Au premier lancement, le skill installe Playwright, axe-core et Chromium dans son dossier (une minute, une seule fois).

## Utiliser

    /aveugle https://ton-site.fr

Une adresse locale marche aussi : `/aveugle http://localhost:3000`.

Tout s'écrit dans `.aveugle/<date>/` dans ton projet : `rapport.json` (axe + parcours clavier), la capture de la page et `corrections.md`. Le skill ne modifie pas ton code sans ton accord.

## Coût

L'audit tourne sur ta machine (de 10 s à 2 min) et ne consomme rien. Seule l'analyse (classer, trouver l'élément dans ton code, écrire les corrections) utilise ton quota Claude.

— [@achille.ia](https://www.instagram.com/achille.ia/)
