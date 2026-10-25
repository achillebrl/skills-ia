# Skills IA gratuits pour Claude Code

Les skills présentés dans les reels de [@achille.ia](https://www.instagram.com/achille.ia/). Gratuits, licence MIT.

| Skill | Ce qu'il fait | Commande |
|---|---|---|
| [visiteurs](visiteurs/) | 100 visiteurs simulés testent ton site à partir de vraies captures : ce qu'ils comprennent en 5 s, où ils cliquent, où ils se perdent ; rapport HTML avec cartes des clics, titres re-testés et les 5 corrections à faire ce soir | `/visiteurs https://ton-site.fr` |
| [testeurs](testeurs/) | 20 testeurs automatiques (gremlins.js + Playwright) cassent ton app avant tes utilisateurs : double clics, retour arrière, champs vides, emoji dans le prix, mobile ; rend la liste des bugs classés du plus grave au plus bête, avec les étapes pour les reproduire | `/testeurs http://localhost:3000` |
| [seniors](seniors/) | 7 relecteurs seniors (sécurité, perf, lisibilité, tests, mobile, accessibilité, SEO) relisent ton code avant le push et rendent une seule liste : 3 corrections avant de pusher, 2 idées pour plus tard | `/seniors` |

## Installer un skill

1. Télécharge le dossier du skill (bouton **Code → Download ZIP** en haut de cette page, puis garde le dossier voulu).
2. Copie-le dans `~/.claude/skills/` (Mac / Linux) ou `%USERPROFILE%\.claude\skills\` (Windows).
3. Relance Claude Code et tape la commande.

`visiteurs` et `testeurs` ont besoin de Node.js : au premier lancement, ils installent Playwright et Chromium dans leur dossier.

Ou en une ligne (Mac / Linux), par exemple pour `visiteurs` :

```bash
git clone --depth 1 https://github.com/achillebrl/skills-ia /tmp/skills-ia && cp -R /tmp/skills-ia/visiteurs ~/.claude/skills/
```

Les visiteurs et relecteurs sont simulés par l'IA : c'est un premier filtre pour repérer les problèmes évidents, pas un remplacement de vrais tests utilisateurs ni d'une vraie revue de code.

## Fiches

- [Claude Code devient con au bout d'une heure ?](fiches/contexte.md) : 4 réflexes pour sa mémoire de travail, et un modèle de CLAUDE.md.
