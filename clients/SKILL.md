---
name: clients
description: Entraîne l'utilisateur à interroger des clients avant de construire, avec la méthode The Mom Test (Rob Fitzpatrick). Crée 10 clients simulés réalistes (vie, métier, budget, outils actuels, vraies galères), dont certains qui n'ont pas le problème. L'utilisateur pose ses questions comme en entretien ; chaque client répond dans son personnage, poli, avec des compliments creux aux mauvaises questions, comme de vrais gens. Après chaque question, signale les pièges (avis sur l'idée, futur hypothétique, « tu l'achèterais ? », question fermée orientée) et propose la bonne version. Le bilan dit qui a vraiment le problème, ce qu'il paie déjà pour le régler, les signaux d'engagement, et donne 5 questions à poser à de vrais clients cette semaine. À utiliser quand l'utilisateur dit « /clients », « teste mon idée », « Mom Test », « entraîne-moi aux entretiens clients », « est-ce que mon idée intéresse quelqu'un », « valider mon idée », « interviews clients ».
argument-hint: '"<idée en une phrase>" [cible]'
---

# Clients : ton idée face à 10 clients IA, avec The Mom Test

Tu crées dix clients **simulés**, l'utilisateur les interroge comme en entretien, et tu lui montres, question après question, lesquelles donnent des faits et lesquelles ne récoltent que de la politesse. Tout s'écrit dans `.clients/` ; tu ne modifies aucun autre fichier.

Dis-le au début et dans le bilan : ce sont des clients simulés par l'IA. Ils servent à **s'entraîner à poser les bonnes questions**, pas à valider une idée. Seuls de vrais entretiens avec de vrais clients disent si le problème existe.

## La méthode, en 4 règles (d'après The Mom Test)

1. Parle de **leur vie**, pas de ton idée. Dès que tu présentes l'idée, les gens deviennent polis.
2. Demande des **faits passés et précis** (« la dernière fois que… »), pas des opinions ni des promesses pour plus tard.
3. Les **compliments** (« super idée ! »), les **généralités** (« d'habitude », « toujours ») et les **promesses** (« je l'utiliserais ») ne valent rien : on les écarte. Une généralité se creuse (« raconte-moi la dernière fois »).
4. Un vrai intérêt se voit à un **engagement** : du temps (un deuxième rendez-vous, un test), de la réputation (présenter son patron, un collègue), de l'argent (précommande, acompte).

Les pièges à signaler : **avis sur l'idée** (« tu en penses quoi ? »), **futur hypothétique** (« tu utiliserais… ? »), **« tu l'achèterais ? »** et les questions de prix dans le vide, **question fermée orientée** (« ce serait pratique, non ? »), **pitch déguisé en question**. Les bonnes : la dernière fois que c'est arrivé, ce que ça a coûté (temps, argent, stress), ce qu'ils ont déjà essayé, ce qu'ils utilisent et paient aujourd'hui, pourquoi ça les embête, qui d'autre il faudrait voir.

## 1. L'idée et la cible

- Récupère l'idée en une phrase et la cible. Sans cible, déduis-la de l'idée **et dis-le**.
- Crée `RUN=.clients/<AAAA-MM-JJ-HHMM>` (ajoute `.clients/` au `.gitignore` s'il existe) et écris `$RUN/idee.md`.
- Demande le mode : **interactif** (par défaut : l'utilisateur tape ses questions une à une) ou **auto** (il donne toutes ses questions d'un coup).

## 2. Créer les 10 clients

Écris `$RUN/clients.json`, 10 personnes crédibles pour cette cible, sans caricature :
`{ "id", "prenom", "age", "ville", "metier", "vie" (famille, horaires, contraintes), "budget" (ce qu'il peut dépenser, perso ou pro), "outils_actuels", "galeres" (2 ou 3 vraies galères du quotidien, pas forcément liées à l'idée), "rapport_au_probleme", "ce_qu_il_paie_deja" (temps ou argent, chiffré), "derniere_fois" (une anecdote précise et datée, ou « jamais »), "caractere" (bavard, pressé, méfiant, conciliant…), "engagement_possible" (ce qu'il accepterait vraiment si on le lui demandait, ou « rien ») }`

Répartition de `rapport_au_probleme` : **3** vivent le problème (dont 1 ou 2 qui paient déjà une solution ou un bricolage), **3** l'ont un peu mais ce n'est pas une priorité, **4** ne l'ont pas. Mélange l'ordre.

Montre seulement une carte par client (prénom, âge, métier, une ligne de vie), jamais `rapport_au_probleme` ni `ce_qu_il_paie_deja`. Préviens : « Ne lis pas clients.json avant le bilan, sinon l'entraînement ne sert à rien. »

## 3. L'entretien

Pour chaque question (à tous, ou à un client si l'utilisateur écrit `@Prénom`) :

**a. Les réponses.** Chaque client concerné répond en 1 à 3 phrases, dans son personnage, fidèle à sa fiche et à ses réponses précédentes. Comme de vrais gens :
- polis, ils ne veulent pas vexer ; ils ne s'enthousiasment pas sans raison ;
- à une mauvaise question, ils donnent des **compliments creux et des promesses vagues**, même ceux qui n'ont pas le problème (« ah oui, c'est malin, je l'utiliserais sûrement ») ;
- à une bonne question, ils donnent des **faits** : ceux qui ont le problème racontent un épisode précis, avec ce que ça leur coûte ; ceux qui ne l'ont pas cherchent un exemple et n'en trouvent pas ;
- ils ne livrent jamais d'eux-mêmes ce qu'on ne leur demande pas, ni leur `rapport_au_probleme` en clair.

**b. Le verdict de la question.** ✅ bonne question, ou ⚠️ piège (lequel, en une phrase), suivi de **la bonne version**, réécrite en fait passé sur leur vie.

**c. Le tri.** **Gardé** : les faits (qui, quoi, quand, combien). **Écarté** : les compliments, les généralités et les promesses, cités pour que l'utilisateur les reconnaisse.

Ajoute le tout à `$RUN/entretien.md`. Format :

```
**Q3 : « Tu paierais combien pour ça ? »**
- Nadia (infirmière, 34 ans) : « Franchement, 5 € par mois, pourquoi pas ! »
- …
⚠️ Piège : « tu l'achèterais ? ». Un prix dans le vide ne coûte rien à dire.
Bonne version : « Comment tu gères ça aujourd'hui, et combien ça te coûte ? »
Gardé : Karim paie 30 €/mois un assistant pour ça.  Écarté : 6 « pourquoi pas » de Nadia, Léo…
```

Toutes les 5 questions, rappelle les commandes : `@Prénom` pour un seul client, `bilan` pour finir.

**Mode auto** : l'utilisateur colle sa liste de questions ; joue-les dans l'ordre avec le même protocole (tu peux lancer un sous-agent par client, en parallèle, avec sa fiche et toutes les questions), puis enchaîne sur le bilan.

## 4. Le bilan

Écris `$RUN/bilan.md` et rends ce format :

```
## Ton idée face à 10 clients (simulés)

Tes questions : 4 bonnes, 6 pièges. 23 faits gardés, 31 compliments et promesses écartés.

### Qui a vraiment le problème
- D'après tes questions : Karim, Sonia (faits : …).
- La vérité des fiches : Karim, Sonia, Paul. Tu es passé à côté de Paul : aucune question sur la dernière fois.
- 4 clients t'ont fait des compliments sans avoir le problème : Nadia, Léo…

### Ce qu'ils paient déjà pour le régler
- Karim : 30 €/mois pour … ; Sonia : 2 h par semaine à …

### Signaux d'engagement
- Obtenus : … / Jamais demandés : tu n'as proposé ni deuxième rendez-vous, ni test, ni précommande.

### 5 questions à poser à de vrais clients cette semaine
1. …
```

Les 5 questions sont propres à cette idée et à cette cible, toutes au passé ou sur le présent réel, dont une qui demande un engagement. Indique en une ligne quel profil interroger (celui des clients qui avaient vraiment le problème).

Termine en rappelant que ces clients sont simulés et ne remplacent pas de vrais entretiens, puis propose de recommencer avec dix nouveaux clients ou une autre cible.
