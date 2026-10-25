# Skill « match » pour Claude Code

Ton concurrent vend plus que toi, et tu ne sais pas pourquoi ? Ce skill met **ton site face au sien**, en **5 rounds** :

1. **La promesse** : en 5 secondes, comprend-on ce que tu fais et pour qui ?
2. **La preuve** : avis, chiffres, logos de clients, démo.
3. **Le prix** : visible sans chercher, et clair ?
4. **La vitesse** : mesurée avec [Lighthouse](https://developer.chrome.com/docs/lighthouse), pas devinée.
5. **Le bouton pour agir** : visible, un seul, avec un verbe clair.

Claude lit les deux sites page par page (accueil sur ordinateur et sur mobile, tarifs, avis, fonctionnalités), puis cinq juges travaillent en parallèle, un par round. Tu reçois :

- **un gagnant par round**, et pourquoi, avec les phrases exactes des deux sites ;
- là où tu perds, **la phrase ou l'élément exact** qui rattrape, prêt à coller (avec `[à compléter]` là où il faut un vrai chiffre : le skill n'en invente jamais) ;
- **ton score sur 5** et **tes 3 coups à jouer ce soir**.

La vitesse est mesurée ; la promesse, la preuve, le prix et le bouton sont jugés par l'IA, comme un visiteur exigeant. C'est un regard extérieur rapide, pas une étude de marché.

## Installer (1 minute)

1. Copie le dossier `match` dans `~/.claude/skills/` (Mac / Linux) ou `%USERPROFILE%\.claude\skills\` (Windows).
2. Relance Claude Code.

Il faut Node.js et Google Chrome (pour Lighthouse). Au premier lancement, le skill installe Playwright et Chromium dans son dossier (une minute, une seule fois). Sans Chrome, la vitesse est mesurée par Playwright à la place.

## Utiliser

    /match https://ton-site.fr https://site-du-concurrent.fr

Tout s'écrit dans `.match/<date>/` dans ton projet : le texte et les captures des deux sites, les mesures Lighthouse et le verdict `match.md`. Le skill ne touche pas à ton code sans ton accord.

— [@achille.ia](https://www.instagram.com/achille.ia/)
