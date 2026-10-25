# Skills IA gratuits pour Claude Code

Les skills présentés dans les reels de [@achille.ia](https://www.instagram.com/achille.ia/). Gratuits, licence MIT.

| Skill | Ce qu'il fait | Commande |
|---|---|---|
| [visiteurs](visiteurs/) | 100 visiteurs simulés testent ton site à partir de vraies captures : ce qu'ils comprennent en 5 s, où ils cliquent, où ils se perdent ; rapport HTML avec cartes des clics, titres re-testés et les 5 corrections à faire ce soir | `/visiteurs https://ton-site.fr` |
| [testeurs](testeurs/) | 20 testeurs automatiques (gremlins.js + Playwright) cassent ton app avant tes utilisateurs : double clics, retour arrière, champs vides, emoji dans le prix, mobile ; rend la liste des bugs classés du plus grave au plus bête, avec les étapes pour les reproduire | `/testeurs http://localhost:3000` |
| [investisseurs](investisseurs/) | Ton pitch devant 5 investisseurs simulés (business angel, fonds seed, banquier, ancienne fondatrice, sceptique) : 3 questions qui fâchent et un vote chacun, puis les 3 failles à corriger et une réponse prête par question | `/investisseurs pitch.pdf` |
| [prospects](prospects/) | Ton email de prospection face à 100 prospects simulés : qui ouvre, qui lit, qui répondrait et pourquoi les autres suppriment ; nouvel objet et nouvelle accroche re-testés sur les mêmes prospects | `/prospects` |
| [aveugle](aveugle/) | Ton site face à un aveugle : axe-core, puis la page parcourue au clavier seulement (Tab, Maj+Tab, Entrée, Espace) ; ordre de focus, pièges, focus invisible, images sans alternative, boutons sans nom, champs sans étiquette, formulaires impossibles à finir ; corrections classées de la plus bloquante à la plus simple | `/aveugle https://ton-site.fr` |
| [match](match/) | Ton site face à ton concurrent, en 5 rounds (promesse, preuve, prix, vitesse mesurée avec Lighthouse, bouton pour agir) : un gagnant par round, la phrase exacte qui rattrape là où tu perds, un score sur 5 et tes 3 coups à jouer ce soir | `/match https://ton-site.fr https://concurrent.fr` |
| [clients](clients/) | Ton idée face à 10 clients simulés, avec The Mom Test : tu poses tes questions, ils répondent comme de vrais gens (compliments creux compris) ; chaque piège signalé avec la bonne version, puis qui a vraiment le problème, ce qu'il paie déjà et 5 questions pour de vrais clients | `/clients "ton idée en une phrase"` |
| [seniors](seniors/) | 7 relecteurs seniors (sécurité, perf, lisibilité, tests, mobile, accessibilité, SEO) relisent ton code avant le push et rendent une seule liste : 3 corrections avant de pusher, 2 idées pour plus tard | `/seniors` |

## Installer un skill

1. Télécharge le dossier du skill (bouton **Code → Download ZIP** en haut de cette page, puis garde le dossier voulu).
2. Copie-le dans `~/.claude/skills/` (Mac / Linux) ou `%USERPROFILE%\.claude\skills\` (Windows).
3. Relance Claude Code et tape la commande.

`visiteurs`, `testeurs`, `aveugle` et `match` ont besoin de Node.js : au premier lancement, ils installent Playwright et Chromium dans leur dossier. `match` utilise aussi Google Chrome pour Lighthouse.

Ou en une ligne (Mac / Linux), par exemple pour `visiteurs` :

```bash
git clone --depth 1 https://github.com/achillebrl/skills-ia /tmp/skills-ia && cp -R /tmp/skills-ia/visiteurs ~/.claude/skills/
```

Les visiteurs, relecteurs, investisseurs, prospects et clients sont simulés par l'IA : c'est un premier filtre pour repérer les problèmes évidents, pas un remplacement de vrais tests utilisateurs, de vrais entretiens ni d'une vraie revue de code. `aveugle` ne remplace pas un audit RGAA.

## Workflows n8n

- [Inbox : un agent trie ta boîte mail la nuit](inbox/) : tri à 6 h (urgent, client, facture, newsletter, poubelle), brouillons de réponse jamais envoyés sans toi, factures avec le montant, résumé à 8 h. Import : `inbox/inbox.json`.

## Fiches

- [Claude Code devient con au bout d'une heure ?](fiches/contexte.md) : 4 réflexes pour sa mémoire de travail, et un modèle de CLAUDE.md.
