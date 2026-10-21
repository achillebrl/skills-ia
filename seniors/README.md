# Skill « seniors » pour Claude Code

7 seniors relisent ton code avant que tu pushes (sécurité, perf, lisibilité, tests, mobile, accessibilité, SEO), puis te rendent une seule liste : 3 corrections avant de pusher, 2 idées pour plus tard.

## Installer (30 secondes)

1. Copie le dossier `seniors` dans `~/.claude/skills/` (Mac / Linux) ou `%USERPROFILE%\.claude\skills\` (Windows).
2. Relance Claude Code.

## Utiliser

Dans ton projet, tape :

    /seniors

ou demande simplement « fais relire mon code avant de pusher ». Sans précision, il relit tes changements pas encore poussés. Tu peux aussi donner un dossier : « /seniors src/api ».

Il ne modifie rien tout seul : il te propose ensuite d'appliquer les corrections une par une.

— @achille.ia

## Pour aller plus loin : les plugins officiels d'Anthropic

Anthropic publie deux plugins de revue de code dans le dépôt officiel de Claude Code ([anthropics/claude-code](https://github.com/anthropics/claude-code/tree/main/plugins)) :

- [`code-review`](https://github.com/anthropics/claude-code/tree/main/plugins/code-review) : 4 agents relisent une pull request en parallèle, avec un score de confiance pour écarter les faux positifs (`/code-review`).
- [`pr-review-toolkit`](https://github.com/anthropics/claude-code/tree/main/plugins/pr-review-toolkit) : 6 relecteurs spécialisés (commentaires, tests, erreurs silencieuses, types, qualité, simplification).

`seniors` est plus large (sécurité, mobile, accessibilité, SEO) et marche sans pull request ; les plugins officiels vont plus loin sur la qualité du code.
