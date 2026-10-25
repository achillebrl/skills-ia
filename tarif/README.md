# Skill « tarif » pour Claude Code

Tu hésites entre 9 et 19 € ? Tu as mis un prix « au feeling » ? Ce skill met ton prix face à **100 acheteurs simulés** avant tes vrais clients :

- ils sont répartis en **profils réalistes adaptés à ton produit** (par exemple étudiant, freelance, PME, cadre) ;
- chacun a son **revenu**, son **budget** pour ce type d'outil et la **solution qu'il utilise aujourd'hui** ;
- chacun répond aux **4 questions de van Westendorp** (Price Sensitivity Meter, 1976) :
  1. à partir de quel prix c'est **trop cher** ;
  2. à partir de quel prix c'est **cher, mais envisageable** ;
  3. à quel prix c'est **une bonne affaire** ;
  4. à partir de quel prix c'est **trop bon marché pour être sérieux** ;
- puis il dit s'il **achèterait** à ton prix A, et à ton prix B.

Un petit script (Node.js, sans dépendance) fait le calcul, pas l'IA de tête. Tu reçois :

- ta **fourchette de prix acceptable** (point de prix marginal bas et haut) et ton **prix optimal**, par la méthode standard (intersections des courbes cumulées) ;
- **le prix qui fait fuir** : au-delà, la majorité trouve ton produit trop cher ;
- **tes deux prix côte à côte** : combien achèteraient chacun, en tout et **par profil** ;
- **le profil prêt à payer davantage** : ta piste d'offre premium ;
- les raisons de ceux qui refusent, et le graphique des courbes (en ASCII, directement dans le terminal).

Sous le capot, une étude de Harvard Business School : Brand, Israeli et Ngwe, « Using GPT for Market Research » (Working Paper 23-062, 2023). GPT y estimait à 3,40 $ la disposition à payer pour du fluor dans un dentifrice ; une étude sur de vrais consommateurs donnait 3,27 $.

Ce sont quand même des acheteurs **simulés** par l'IA : un point de départ pour choisir quoi tester, pas une étude de marché. Confirme ton prix avec de vrais clients ou un test de page de prix.

## Installer (30 secondes)

1. Copie le dossier `tarif` dans `~/.claude/skills/` (Mac / Linux) ou `%USERPROFILE%\.claude\skills\` (Windows).
2. Relance Claude Code.

Le calcul a besoin de Node.js 18 ou plus (rien d'autre à installer).

## Utiliser

    /tarif "un outil de facturation pour freelances" 9 19

- Un seul prix ? `/tarif "un outil de facturation pour freelances" 15` : le skill propose lui-même un second prix à tester, et dit pourquoi.
- Tu as déjà une page de tarifs ? Donne le fichier ou l'URL : `/tarif https://ton-site.fr/tarifs`.

Tout s'écrit dans `.tarif/<date>/` (les acheteurs, leurs réponses, le calcul, le rapport). Le test lance 5 sous-agents en parallèle : compte quelques minutes et une part de ton quota Claude.

Tu peux aussi relancer le calcul seul sur tes réponses : `node ~/.claude/skills/tarif/scripts/prix.mjs .tarif/<date>/reponses.json`.

— [@achille.ia](https://www.instagram.com/achille.ia/)
