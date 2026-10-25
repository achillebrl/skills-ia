---
name: tarif
description: Teste un prix face à 100 acheteurs simulés, avec le Price Sensitivity Meter de van Westendorp (1976). Crée 100 acheteurs répartis en profils réalistes adaptés au produit (étudiant, freelance, PME, cadre…), chacun avec son revenu, son budget pour ce type d'outil et la solution qu'il utilise aujourd'hui ; des sous-agents en parallèle leur posent les 4 questions de van Westendorp (trop cher, cher mais envisageable, bonne affaire, trop bon marché pour être sérieux) puis leur demandent s'ils achèteraient à chacun des deux prix. Un script calcule la fourchette de prix acceptable, le prix optimal et le prix qui fait fuir, compare les deux prix par profil et repère le profil prêt à payer davantage. À utiliser quand l'utilisateur dit « /tarif », « à quel prix vendre », « combien facturer », « mon prix est-il trop cher », « teste mon prix », « 9 ou 19 € ? », « fixe mon prix », « pricing », ou donne un produit avec un ou deux prix, une page de tarifs ou son URL.
argument-hint: '"<produit en une phrase>" <prix A> [prix B] [page de tarifs, fichier ou URL]'
---

# Tarif : ton prix face à 100 acheteurs

Tu fais répondre cent acheteurs **simulés** aux quatre questions de van Westendorp, tu calcules par un script la fourchette de prix acceptable, puis tu compares les deux prix de l'utilisateur, profil par profil. Tu ne modifies aucun fichier de l'utilisateur ; tout s'écrit dans `.tarif/`.

Dis-le au début et dans le rendu : ce sont des acheteurs simulés par l'IA. La base : Brand, Israeli et Ngwe, « Using GPT for Market Research » (Harvard Business School, Working Paper 23-062, 2023) ; GPT y estimait à 3,40 $ la disposition à payer pour du fluor dans un dentifrice, contre 3,27 $ dans une étude menée sur de vrais consommateurs. C'est un **point de départ** pour choisir quoi tester, pas une étude de marché : le prix se confirme avec de vrais clients ou un test de page de prix.

`S` = le dossier `scripts` de ce skill (en général `~/.claude/skills/tarif/scripts`). Le calcul demande Node.js 18 ou plus, sans rien installer.

## 1. Le produit et les prix

- Récupère le produit en une phrase, le prix A et, s'il est donné, le prix B, avec leur unité (une fois, par mois, par an, par utilisateur…). Sans unité, déduis-la du produit **et dis-le**.
- Si l'utilisateur donne une page de tarifs (fichier) ou une URL, lis-la (outil Read ou WebFetch) : offres, prix, ce qui est inclus, à qui elle s'adresse. Sans prix donné en argument, le prix A est celui de la page (l'offre principale).
- **Un seul prix ?** Propose le prix B toi-même et dis pourquoi en une phrase : si A semble bas pour la cible (sous ce que coûtent les solutions qu'elle paie déjà), teste plus haut, de 50 à 100 % au-dessus ; sinon, teste plus bas, de 30 à 40 % en dessous. Arrondis à un prix crédible (9 → 15, 19 → 29, 49 → 35). Ne demande pas : annonce-le et continue.
- La cible : celle de l'utilisateur, sinon déduis-la du produit **et dis-le**.
- Crée `RUN=.tarif/<AAAA-MM-JJ-HHMM>` dans le dossier courant (ajoute `.tarif/` au `.gitignore` s'il existe) et écris `$RUN/etude.json` :
  `{ "produit": "…", "devise": "€/mois", "cible": "…", "source": "argument | page | URL", "prix": { "A": 19, "B": 29 } }`
  `devise` est l'unité affichée partout (« € », « €/mois », « $/an »…). Les prix sont des nombres.

## 2. Créer les 100 acheteurs

Choisis **4 à 6 profils** réalistes pour ce produit (pour un outil de facturation : étudiant, freelance, artisan, gérant de PME, cadre en entreprise) et répartis les 100 acheteurs comme ils le seraient vraiment sur ce marché, avec 10 à 15 % d'acheteurs qui n'en ont pas vraiment besoin. Pas de caricature : des revenus et des besoins variés à l'intérieur de chaque profil.

Écris `$RUN/acheteurs.json`, un tableau de 100 :
`{ "id", "profil", "prenom", "age", "metier", "revenu" (net mensuel, ou chiffre d'affaires pour une entreprise, chiffré), "budget" (ce qu'il dépense déjà ou peut dépenser pour ce type d'outil, chiffré, dans l'unité des prix), "solution_actuelle" (ce qu'il utilise aujourd'hui et ce que ça lui coûte, « rien » est possible), "besoin": "fort" | "moyen" | "faible" }`

Montre la répartition en une ligne par profil (nombre, revenu typique, solution actuelle la plus fréquente).

## 3. Les 4 questions : un sous-agent par lot d'environ 20

Lance **dans un seul message** un sous-agent (outil Agent) par lot d'environ 20 acheteurs (un par profil si les profils font à peu près cette taille). Chacun reçoit le produit, l'unité, les deux prix, les chemins `$RUN/acheteurs.json` et `$RUN`, les `id` de son lot, le numéro K du lot et ce protocole :

> Tu joues chacun de ces acheteurs, honnêtement, avec son revenu, son budget, sa solution actuelle et son besoin. Ne sois ni généreux ni radin : réponds comme cette personne, avec son argent.
> Pour chaque acheteur, réponds d'abord aux 4 questions de van Westendorp, chacune par un prix précis dans l'unité donnée, **sans tenir compte des prix testés** :
> 1. `trop_cher` : à partir de quel prix ce produit serait-il trop cher pour que tu l'achètes ?
> 2. `cher` : à partir de quel prix le trouverais-tu cher, tout en l'envisageant quand même ?
> 3. `bonne_affaire` : à quel prix serait-ce une bonne affaire ?
> 4. `trop_bon_marche` : à partir de quel prix serait-il si bon marché que tu douterais de sa qualité ?
> Il faut `trop_bon_marche` < `bonne_affaire` < `cher` < `trop_cher`. Un acheteur qui paie déjà une solution s'appuie sur son prix ; un acheteur sans besoin répond quand même, avec des prix bas (0 est permis pour `trop_bon_marche`).
> Puis, au prix A, l'achèterais-tu (`achete_A`, true ou false) ? Et au prix B (`achete_B`) ? Sois cohérent : à un prix égal ou supérieur à ton `trop_cher`, tu n'achètes pas. Donne `pourquoi` en une phrase, à la première personne.
> Écris `<RUN>/lot-K.json` : le tableau des acheteurs de ton lot, chacun avec tous ses champs d'origine, plus `trop_bon_marche`, `bonne_affaire`, `cher`, `trop_cher` (des nombres), `achete_A`, `achete_B` et `pourquoi`. Ne modifie aucun autre fichier. Réponds seulement « ok ».

## 4. Le calcul, par le script

Ne calcule rien de tête. Lance :

```bash
node $S/prix.mjs $RUN/etude.json $RUN/lot-*.json
```

Le script fusionne les lots dans `$RUN/reponses.json`, écarte les réponses incohérentes ou incomplètes (il dit lesquelles et pourquoi), puis applique la méthode standard de van Westendorp. Pour chaque prix, il trace les quatre courbes cumulées : « trop bon marché » (part des acheteurs pour qui ce prix est trop bon marché), « plus une bonne affaire » (1 − part pour qui c'est encore une bonne affaire), « pas encore cher » (1 − part pour qui c'est cher) et « trop cher ». Les intersections donnent :

- le **point de prix marginal bas** : « trop bon marché » croise « plus une bonne affaire » (bas de la fourchette acceptable) ;
- le **prix optimal** : « trop bon marché » croise « trop cher » (autant d'acheteurs le trouvent trop cher que trop bon marché) ;
- le **prix d'indifférence** : « plus une bonne affaire » croise « pas encore cher » ;
- le **point de prix marginal haut** : « trop cher » croise « pas encore cher » (haut de la fourchette) ;
- le **prix qui fait fuir** : là où « trop cher » atteint 50 % ; au-delà, la majorité trouve le produit trop cher.

Il compare aussi les deux prix (part qui achèterait, part qui trouve trop cher ou trop bon marché, chiffre d'affaires simulé pour 100 acheteurs), en tout et par profil, et désigne le profil prêt à payer davantage (la médiane « cher mais envisageable » la plus haute). Sortie : `$RUN/resultats.json` et `$RUN/rapport.md`, avec le graphique ASCII des courbes.

Si plus de 10 réponses sont écartées, relance une fois les lots concernés, puis relance le script. Ne retouche jamais les chiffres du script : cite-les tels quels (arrondis au centime ou à l'euro pour la lecture).

## 5. Le rendu

Lis `$RUN/rapport.md` et les `pourquoi` des acheteurs, puis rends ce format (et écris-le dans `$RUN/tarif.md`) :

```
## Ton prix face à 100 acheteurs (simulation)

Fourchette acceptable : 12 € à 29 €/mois. Prix optimal : 17 €/mois.
Le prix qui fait fuir : 35 €/mois (au-delà, la majorité trouve trop cher).

### Tes deux prix côte à côte
|                         | A : 19 €/mois | B : 29 €/mois |
|-------------------------|---------------|---------------|
| Achèteraient            | 54 %          | 31 %          |
| Trouvent trop cher      | 18 %          | 47 %          |
| CA simulé (100 acheteurs) | 1 026 €     | 899 €         |

Par profil : (le tableau du rapport)

### Le profil prêt à payer davantage
PME : « cher mais envisageable » dès 45 €/mois en médiane. Piste : une offre premium vers 39 €/mois avec … (ce qui compte pour eux, d'après leurs « pourquoi »).

### Pourquoi ils refusent
- « … » (Freelance, à 29 €)
- (3 à 5 raisons qui reviennent, citées depuis les « pourquoi »)

### Les courbes
(le graphique du rapport)

### Ce que je ferais
(2 ou 3 phrases : le prix à garder ou à tester, en t'appuyant sur la fourchette et sur les deux prix ; jamais un chiffre qui ne sort pas du script)

Base : Brand, Israeli, Ngwe, « Using GPT for Market Research », HBS Working Paper 23-062 (2023).
Simulation : un point de départ, à confirmer avec de vrais clients ou un test de page de prix.
```

Termine en proposant de tester un troisième prix ou une autre cible sur de nouveaux acheteurs, et, pour confirmer avec de vrais gens : un test de page de prix (deux versions de la page, ou un bouton « Acheter » qui compte les clics avant même que le paiement existe) ou cinq appels avec des clients du profil prêt à payer davantage.
