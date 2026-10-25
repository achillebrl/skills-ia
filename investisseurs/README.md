# Skill « investisseurs » pour Claude Code

Tu pitches devant des investisseurs demain ? Ils vont trouver tes failles en trente secondes. Ce skill les fait trouver avant, par **5 investisseurs simulés** :

- **un business angel** : ton équipe, ton histoire, ton premier marché ;
- **un fonds seed** : la taille du marché, la croissance, ce qui est difficile à copier ;
- **un banquier** : ta marge, ton chiffre d'affaires, ton besoin de trésorerie ;
- **une ancienne fondatrice** : ce qui va casser en premier, ton canal d'acquisition ;
- **un sceptique de service** : ton concurrent, « pourquoi maintenant », les chiffres trop beaux.

Chacun lit ton pitch, pose ses **3 questions qui fâchent** et **vote** : « J'investis » ou « Je passe ». Tu reçois :

- les **3 failles à corriger** avant le rendez-vous ;
- une **réponse prête** pour chaque question (avec `[à compléter]` là où il manque un chiffre : le skill n'en invente jamais) ;
- l'avis de chaque investisseur.

Ce sont des investisseurs simulés par l'IA : un entraînement pour repérer les trous classiques d'un pitch, pas une prédiction de levée ni un conseil financier.

## Installer (30 secondes)

1. Copie le dossier `investisseurs` dans `~/.claude/skills/` (Mac / Linux) ou `%USERPROFILE%\.claude\skills\` (Windows).
2. Relance Claude Code.

## Utiliser

    /investisseurs mon-pitch.pdf

ou colle ton texte de présentation, ou donne un lien. Ajoute le montant demandé si ton pitch ne le dit pas : `/investisseurs pitch.pdf 300 000 €`.

Tout s'écrit dans `.investisseurs/<date>/` (le pitch en texte, la préparation). Le skill ne touche pas à tes fichiers ; il te propose ensuite de réécrire la page qui corrige la faille n° 1, puis de refaire passer les cinq investisseurs.

— [@achille.ia](https://www.instagram.com/achille.ia/)
