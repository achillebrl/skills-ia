# Skills IA gratuits pour Claude Code

Les skills présentés dans les reels de [@achille.ia](https://www.instagram.com/achille.ia/). Gratuits, licence MIT.

| Skill | Ce qu'il fait | Commande |
|---|---|---|
| [visiteurs](visiteurs/) | 100 visiteurs simulés testent ton site : ce qu'ils comprennent en 5 s, le bouton qu'ils cherchent, où ils se perdent, et les 5 corrections à faire ce soir | `/visiteurs https://ton-site.fr` |
| [seniors](seniors/) | 7 relecteurs seniors (sécurité, perf, lisibilité, tests, mobile, accessibilité, SEO) relisent ton code avant le push et rendent une seule liste : 3 corrections avant de pusher, 2 idées pour plus tard | `/seniors` |

## Installer un skill

1. Télécharge le dossier du skill (bouton **Code → Download ZIP** en haut de cette page, puis garde le dossier voulu).
2. Copie-le dans `~/.claude/skills/` (Mac / Linux) ou `%USERPROFILE%\.claude\skills\` (Windows).
3. Relance Claude Code et tape la commande.

Ou en une ligne (Mac / Linux), par exemple pour `visiteurs` :

```bash
git clone --depth 1 https://github.com/achillebrl/skills-ia /tmp/skills-ia && cp -R /tmp/skills-ia/visiteurs ~/.claude/skills/
```

Les visiteurs et relecteurs sont simulés par l'IA : c'est un premier filtre pour repérer les problèmes évidents, pas un remplacement de vrais tests utilisateurs ni d'une vraie revue de code.
