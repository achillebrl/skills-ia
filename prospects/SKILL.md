---
name: prospects
description: Fait lire un email de prospection par 100 prospects simulés avant l'envoi. Chacun a son métier, son entreprise, ses priorités et sa boîte pleine ; il voit l'expéditeur et l'objet et décide s'il ouvre, lit les deux premières lignes, puis dit s'il répond ou pourquoi il supprime. Rend le nombre d'ouvertures, de lectures et de réponses simulées, les raisons de suppression, puis réécrit l'objet et l'accroche et refait passer le test aux mêmes prospects. À utiliser quand l'utilisateur dit « /prospects », « teste mon email de prospection », « personne ne répond à mes emails », « améliore mon cold email », ou colle un email commercial à envoyer.
argument-hint: <email (objet + texte) ou fichier> [cible : métier, secteur, taille d'entreprise] [--n 100]
---

# Prospects : ton email de prospection face à 100 prospects

Tu fais lire l'email de l'utilisateur par des prospects **simulés**, tu comptes qui ouvre, qui lit et qui répondrait, tu expliques pourquoi les autres suppriment, puis tu proposes une meilleure version et tu la re-testes sur les mêmes prospects. Tout s'écrit dans `.prospects/` ; tu n'envoies rien.

Dis-le dans le rendu : ce sont des prospects simulés par l'IA. Les chiffres comparent deux versions entre elles ; ce ne sont pas des taux réels à attendre.

## 1. L'email et la cible

- Récupère : le nom d'expéditeur, l'objet, le texte complet, la signature. S'il manque l'objet ou le nom d'expéditeur, demande-les une fois.
- La cible : celle de l'utilisateur (« directeurs marketing de PME industrielles »), sinon déduis-la de l'email **et dis-le**.
- Crée `RUN=.prospects/<AAAA-MM-JJ-HHMM>` (ajoute `.prospects/` au `.gitignore` s'il existe) et écris `$RUN/email-A.md`.

## 2. Créer les prospects

Écris `$RUN/prospects.json` : N prospects (100 par défaut), réalistes et variés pour cette cible :
`{ "id", "prenom", "poste", "entreprise" (secteur et taille), "priorite_du_moment", "mails_par_jour", "humeur": "débordé" | "normal" | "curieux", "deja_equipe": true | false, "lit_sur": "mobile" | "ordinateur" }`

Répartition par défaut : 70 % dans la cible, 20 % proches (bon secteur, mauvais poste), 10 % hors cible ; 40 % débordés, 40 % normaux, 20 % curieux ; 60 % lisent sur mobile. Pas de caricature.

## 3. La lecture : un sous-agent par lot de 20

Lance **dans un seul message** un sous-agent (outil Agent) par lot de 20 prospects, avec un modèle rapide si l'outil le permet. Chacun reçoit le chemin de `email-A.md`, son lot de prospects et ce protocole :

> Pour chaque prospect, joue-le honnêtement, avec sa journée et sa priorité du moment.
> 1. Il voit seulement le nom de l'expéditeur, l'objet et le début du texte (environ 90 caractères, ce que montre une boîte mail). Ouvre-t-il ? Pourquoi, en une phrase ?
> 2. S'il ouvre : il lit les deux premières lignes. Continue-t-il ? Pourquoi ?
> 3. S'il lit jusqu'au bout : répond-il ? Que répondrait-il, en une phrase ? Sinon, que fait-il (ignore, supprime, se désabonne, transfère) et pourquoi ?
> 4. La phrase qui l'a le plus fait décrocher, citée mot pour mot.
> Écris `<RUN>/lot-K-A.json` : un objet par prospect `{ id, ouvre, raison_ouverture, continue, raison_lecture, repond, reponse, action, phrase_qui_bloque }`. Ne modifie aucun autre fichier. Réponds seulement « ok ».

## 4. Le diagnostic

Fusionne les lots et calcule : ouvrent, lisent jusqu'au bout, répondent (nombres sur N), puis par segment (cible, proches, hors cible ; mobile, ordinateur ; débordés). Regroupe les raisons de non-ouverture et de suppression, et les phrases qui bloquent le plus souvent.

## 5. Réécrire, puis re-tester

1. Propose **3 objets** et **une nouvelle accroche** (les deux premières lignes), chacun justifié par une raison relevée au point 4. Garde le fond de l'offre : n'ajoute ni promesse ni chiffre que l'utilisateur n'a pas donnés.
2. Écris `$RUN/email-B.md` avec le meilleur objet et la nouvelle accroche, puis relance les mêmes lots sur la version B (`lot-K-B.json`).
3. Rends ce format :

```
## Ton email face à 100 prospects (simulation)

|                  | Version A | Version B |
|------------------|-----------|-----------|
| Ouvrent          | 58 / 100  | 71 / 100  |
| Lisent jusqu'au bout | 21    | 34        |
| Répondraient     | 3         | 7         |

### Pourquoi ils n'ouvrent pas (version A)
- « … » (24 prospects)

### Les phrases qui font décrocher
- « … » (17 prospects)

### Ta version B
Objet : …
Accroche : …
(les 2 autres objets proposés)
```

Termine en rappelant que ce sont des prospects simulés, et propose de tester une version C ou une autre cible.
