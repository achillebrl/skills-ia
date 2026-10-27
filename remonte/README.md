# Skill « remonte » pour Claude Code

Ton site est en page 2 de Google ? Presque personne ne va le chercher là. Ce skill le fait remonter en partant de **tes vraies données** :

- il **crawle toutes tes pages** : 404, liens internes cassés, redirections, titres trop longs ou en double, pages sans description ni H1, pages trop minces ;
- il lit ton **export Search Console** et sort les requêtes **coincées en positions 8 à 20**, classées par clics gagnables ;
- il **réécrit** le titre, la description et le H1 des pages visées, écrit la section qui manque et ajoute les liens internes ;
- il vérifie **ce que ChatGPT, Perplexity et Gemini répondent** sur ton sujet, et ce qu'il faut pour y être cité ;
- tu peux le relancer **chaque jour** : il compare au crawl de la veille.

Aucune méthode ne garantit la page 1 : le skill règle tout ce qui dépend de ton site.

## Installer (1 minute)

1. Copie le dossier `remonte` dans `~/.claude/skills/` (Mac / Linux) ou `%USERPROFILE%\.claude\skills\` (Windows).
2. Relance Claude Code.

Il faut Node.js 18 ou plus. Rien d'autre à installer.

## Utiliser

    /remonte https://ton-site.fr

Ajoute ton export Search Console pour l'étape « page 2 » : Search Console → Performances → 3 mois → Exporter → CSV.

    /remonte https://ton-site.fr ~/Downloads/export-search-console.zip

Lance-le dans le dossier du code de ton site : il retrouve chaque problème dans le code et te propose le correctif exact. Il ne modifie rien sans ton accord.

Tous les jours : `/loop 1d /remonte https://ton-site.fr --quotidien`.

Tout s'écrit dans `.remonte/<date>/` : `crawl.md`, `page2.md`, `rapport.md`.
