# Skill « prospects » pour Claude Code

Tu envoies cent emails de prospection… et personne ne répond. Ce skill fait lire ton email par **100 prospects simulés avant l'envoi** :

- chacun a son poste, son entreprise, sa priorité du moment et sa boîte pleine ;
- il voit ton nom et ton **objet**, et décide s'il ouvre ;
- il lit tes **deux premières lignes**, et décide s'il continue ;
- il te dit s'il **répond**, ou pourquoi il supprime.

Tu reçois :

- combien ouvrent, lisent jusqu'au bout et répondraient, par segment (dans la cible, mobile, débordés…) ;
- les raisons de non-ouverture et les **phrases qui font décrocher**, citées mot pour mot ;
- **3 nouveaux objets** et une **nouvelle accroche**, re-testés sur les mêmes prospects, avec le tableau avant / après.

Ce sont des prospects simulés par l'IA : les chiffres servent à comparer deux versions de ton email, pas à prédire tes vrais taux. Le skill n'envoie rien.

## Installer (30 secondes)

1. Copie le dossier `prospects` dans `~/.claude/skills/` (Mac / Linux) ou `%USERPROFILE%\.claude\skills\` (Windows).
2. Relance Claude Code.

## Utiliser

    /prospects

puis colle ton email (nom d'expéditeur, objet et texte), ou donne un fichier. Précise ta cible pour des prospects plus justes : `/prospects email.md directeurs marketing de PME industrielles`.

- `--n 50` : moins de prospects, test plus rapide.

Tout s'écrit dans `.prospects/<date>/` (prospects, réponses, versions A et B). Le test lance 5 sous-agents par version : compte quelques minutes et une part de ton quota Claude.

— [@achille.ia](https://www.instagram.com/achille.ia/)
