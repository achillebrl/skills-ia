# Skill « clients » pour Claude Code

Tu demandes à tes proches si ton idée est bonne, et tout le monde dit oui ? C'est normal : les gens sont polis. Ce skill t'entraîne à poser les questions qui donnent des **faits**, avec la méthode **The Mom Test** de Rob Fitzpatrick, face à **10 clients simulés** :

- chacun a sa vie, son métier, son budget, ses outils actuels et ses vraies galères ;
- certains ont vraiment ton problème, d'autres un peu, d'autres **pas du tout** (et ils ne te le diront pas si tu poses mal la question) ;
- tu poses tes questions comme en entretien ; ils répondent dans leur personnage, polis, avec des **compliments creux aux mauvaises questions**, comme de vrais gens.

Après chaque question, Claude te dit si c'est un **piège** (avis sur l'idée, futur hypothétique, « tu l'achèterais ? », question fermée orientée) et te donne **la bonne version** (« raconte-moi la dernière fois que… », « combien ça te coûte aujourd'hui ? », « qu'as-tu déjà essayé ? »). Les compliments sont écartés, les faits gardés.

À la fin, le bilan : **qui a vraiment le problème** (et ceux que tu as ratés), **ce qu'ils paient déjà** pour le régler (en temps ou en argent), les **signaux d'engagement**, et **5 questions à poser à de vrais clients cette semaine**.

Ce sont des clients simulés par l'IA : un entraînement aux entretiens, pas une validation de ton idée. Seuls de vrais clients te diront si le problème existe.

## Installer (30 secondes)

1. Copie le dossier `clients` dans `~/.claude/skills/` (Mac / Linux) ou `%USERPROFILE%\.claude\skills\` (Windows).
2. Relance Claude Code.

## Utiliser

    /clients "une appli qui planifie les repas de la semaine selon ce qu'il reste dans le frigo" "parents qui travaillent"

Puis tape tes questions une à une (`@Prénom` pour n'interroger qu'un client, `bilan` pour finir). Pas envie d'interactif ? Donne toutes tes questions d'un coup : le skill les joue et rend le bilan.

Tout s'écrit dans `.clients/<date>/` : les fiches des clients (à ne pas lire avant le bilan), l'entretien complet et le bilan.

— [@achille.ia](https://www.instagram.com/achille.ia/)
