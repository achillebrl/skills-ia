---
name: match
description: Met le site de l'utilisateur face à celui d'un concurrent, en 5 rounds. Lit les deux sites page par page (accueil sur ordinateur et mobile, tarifs, avis, fonctionnalités), mesure la vitesse avec Lighthouse, puis juge chaque round (la promesse comprise en 5 secondes, la preuve, le prix, la vitesse, le bouton pour agir) avec un gagnant et pourquoi. Là où l'utilisateur perd, donne la phrase ou l'élément exact qui rattrape. Finit par un score sur 5 et « tes 3 coups à jouer ce soir ». À utiliser quand l'utilisateur dit « /match », « compare mon site à mon concurrent », « pourquoi mon concurrent vend plus », « mon site contre celui de… », « benchmark de landing page », ou donne deux URL à comparer.
argument-hint: <ton-url> <url-concurrent>
---

# Match : ton site face à ton concurrent, en 5 rounds

Tu lis les deux sites comme un visiteur pressé, tu mesures leur vitesse, puis tu fais juger cinq rounds. Tu rends un gagnant par round, ce qu'il faut changer là où l'utilisateur perd, et trois actions faisables ce soir. Tu ne modifies aucun fichier du projet sans accord : tout s'écrit dans `.match/`.

Dis-le dans le rendu : la vitesse est **mesurée** (Lighthouse) ; la promesse, la preuve, le prix et le bouton sont **jugés par l'IA** à partir des pages et des captures, comme le ferait un visiteur. C'est un regard extérieur rapide, pas une étude de marché ni un test A/B.

`S` = le dossier `scripts` de ce skill (en général `~/.claude/skills/match/scripts`).

## 0. Préparer

1. Il faut deux URL : celle de l'utilisateur, puis celle du concurrent. S'il en manque une, demande-la.
2. Crée `RUN=.match/<AAAA-MM-JJ-HHMM>` dans le dossier courant (ajoute `.match/` au `.gitignore` s'il existe).
3. Vérifie l'installation : `ls $S/node_modules/playwright`. Sinon : `npm install --prefix $S` puis `npx --prefix $S playwright install chromium` (une seule fois, environ 1 min).

## 1. Lire les deux sites, page par page

`node $S/lire.mjs <ton-url> $RUN/toi & node $S/lire.mjs <url-concurrent> $RUN/concurrent & wait`

Pour chaque site, le script ouvre l'accueil (capture ordinateur et mobile du premier écran, texte, titres, boutons visibles, prix trouvés), puis jusqu'à 3 pages clés trouvées dans les liens : tarifs, preuves (avis, clients), produit, à propos. Il ne fait que lire : aucun formulaire n'est envoyé. Sortie : `site.json`, `accueil-ordi.png`, `accueil-mobile.png`, `page-<k>.png`.

Si une page clé manque (pas de page tarifs, par exemple), c'est une information pour le round, pas une erreur.

## 2. Mesurer la vitesse

Lance Lighthouse **l'un après l'autre** (en parallèle, les mesures se faussent) :

```bash
npx lighthouse <ton-url> --only-categories=performance --output=json --quiet --chrome-flags="--headless" > $RUN/toi/lighthouse.json
npx lighthouse <url-concurrent> --only-categories=performance --output=json --quiet --chrome-flags="--headless" > $RUN/concurrent/lighthouse.json
```

Ne lis pas ce JSON en entier (plusieurs centaines de Ko). Résume-le :

```bash
node -e 'const r=require(process.argv[1]),a=r.audits,v=k=>a[k]?.displayValue;console.log(JSON.stringify({score:Math.round(r.categories.performance.score*100),lcp:v("largest-contentful-paint"),fcp:v("first-contentful-paint"),tbt:v("total-blocking-time"),cls:v("cumulative-layout-shift"),poids:v("total-byte-weight")}))' "$PWD/$RUN/toi/lighthouse.json"
```

Lighthouse simule un mobile sur une connexion lente : un score bas ne veut pas dire que le site est lent chez toi. D'une mesure à l'autre, le score bouge de 5 à 10 points : en dessous de 10 points d'écart, regarde surtout le LCP (temps d'affichage du plus gros élément).

**Repli** : si Lighthouse échoue (pas de Chrome installé, site qui bloque), garde l'erreur et compare `poids_playwright` de chaque `site.json` (poids de la page, nombre de requêtes, temps de chargement, LCP mesurés par Playwright, sans limitation). Dis-le dans le rendu.

## 3. Les 5 rounds, en parallèle

Lance **dans un seul message** cinq sous-agents (outil Agent), un par round. Chacun reçoit les chemins de `$RUN/toi/` et `$RUN/concurrent/` (site.json, captures, résumé Lighthouse), son round ci-dessous et cette consigne :

> Tu es un visiteur exigeant qui découvre les deux sites. Regarde les captures (outil de lecture d'image) et lis site.json. Juge seulement ton round, uniquement sur ce que montrent les pages : ne suppose rien. Rends :
> 1. Le gagnant (« toi », « concurrent » ou « égalité ») et pourquoi, en 2 phrases, en citant mot pour mot le texte ou l'élément décisif de chaque site.
> 2. Une note sur 10 pour chaque site.
> 3. Si « toi » perd ou fait égalité : la phrase ou l'élément exact à ajouter ou à remplacer, prêt à coller, et où le mettre. N'invente aucun chiffre, avis ou client : écris `[à compléter : …]` à la place.
> Ne modifie aucun fichier.

| Round | Ce qui est jugé |
|---|---|
| 1. La promesse | En 5 secondes, sur le premier écran (ordinateur et mobile) : comprend-on **quoi** (ce que ça fait) et **pour qui** ? Un titre concret bat un slogan. |
| 2. La preuve | Avis, notes, chiffres d'usage, logos de clients, témoignages avec nom et photo, démo ou vidéo. Visible tôt, précise, vérifiable. |
| 3. Le prix | Trouve-t-on le prix sans chercher ? Est-il clair (combien, pour quoi, par mois ou une fois, essai gratuit, engagement) ? Pas de prix du tout = point perdu, sauf « sur devis » assumé et expliqué. |
| 4. La vitesse | Les mesures Lighthouse (score, LCP, poids), ou le repli Playwright. Le gagnant est celui qui affiche son contenu principal le plus vite. |
| 5. Le bouton pour agir | Sur le premier écran : un bouton principal visible (contraste, taille), **un seul** (pas trois appels qui se battent), avec un **verbe clair** qui dit ce qui se passe (« Essayer gratuitement 14 jours » bat « En savoir plus »). |

## 4. Le verdict

Score sur 5 = rounds gagnés par l'utilisateur (égalité = 0,5). Choisis **3 coups à jouer ce soir** : des changements faisables en moins d'une heure chacun, pris dans les rounds perdus, le plus rentable d'abord (en général : la promesse, puis le bouton, puis la preuve). Écris `$RUN/match.md` et rends ce format :

```
## Ton site face à <concurrent> : 2 / 5

| Round | Gagnant | Pourquoi |
|---|---|---|
| 1. La promesse | Concurrent | Son titre dit quoi et pour qui : « … » ; le tien : « … » |
| 2. La preuve | Toi | … |
| 3. Le prix | Concurrent | … |
| 4. La vitesse | Toi | LCP 1,8 s contre 4,2 s (Lighthouse, mobile) |
| 5. Le bouton | Concurrent | … |

### Là où tu perds, ce qui rattrape
- Promesse : remplace « … » par « … » (titre du premier écran).
- …

### Tes 3 coups à jouer ce soir
1. …
2. …
3. …
```

Termine en rappelant ce qui est mesuré et ce qui est jugé, puis propose d'appliquer le coup n° 1 dans le code si le site est dans le dossier courant (sans rien modifier sans accord), et de relancer le match après.
