# Skill « visiteurs » pour Claude Code

100 visiteurs simulés testent ton site avant que tu le montres : chacun a un âge, un job et une raison de venir, regarde ta page 5 secondes, dit ce qu'il a compris, cherche le bouton et te dit où il s'est perdu. À la fin : un rapport avec ce que personne n'a compris, ce que tout le monde a raté et les 5 trucs à corriger ce soir.

Ce sont des visiteurs simulés par l'IA, pas de vrais utilisateurs : parfait pour repérer les problèmes évidents avant de montrer ton site à de vrais gens.

## Installer (30 secondes)

1. Copie le dossier `visiteurs` dans `~/.claude/skills/` (Mac / Linux) ou `%USERPROFILE%\.claude\skills\` (Windows).
2. Relance Claude Code.
3. Optionnel, pour qu'il voie ta page comme un vrai visiteur (captures ordinateur et mobile) : `npx playwright install chromium`.

## Utiliser

    /visiteurs https://ton-site.fr

ou « teste mon site avec 100 visiteurs ». Ça marche aussi en local (`http://localhost:3000`).

— @achille.ia
