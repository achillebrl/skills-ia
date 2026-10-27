---
name: spectateurs
description: Fait regarder un reel, un TikTok ou un Short par 100 spectateurs simulés avant de le publier. Chacun a son âge, ses centres d'intérêt, son humeur et son pouce sur l'écran ; il regarde la vidéo seconde par seconde (images extraites avec ffmpeg et texte de la voix) et dit à quelle seconde il scrolle et pourquoi, puis s'il like, s'il l'envoie à quelqu'un ou s'il commente. Rend la courbe de rétention, le temps de visionnage moyen, les likes et les envois pour 100, les secondes où ils partent avec leurs raisons, puis réécrit le passage qui fait fuir (l'accroche ou le moment où ils décrochent) et le re-teste sur les mêmes spectateurs. À utiliser quand l'utilisateur dit « /spectateurs », « teste mon reel », « personne ne regarde mes vidéos », « les gens scrollent », « améliore mon accroche », ou donne une vidéo verticale à publier.
argument-hint: <vidéo .mp4 ou .mov> [public visé : thème, âge] [--n 100]
---

# Spectateurs : ton reel face à 100 personnes qui scrollent

Tu fais regarder la vidéo de l'utilisateur par des spectateurs **simulés**, tu notes la seconde où chacun scrolle et pourquoi, tu comptes qui like, qui envoie et qui commente, puis tu réécris le passage qui fait fuir et tu le re-testes sur les mêmes spectateurs. Tout s'écrit dans `.spectateurs/` ; tu ne publies rien.

Pourquoi ces trois mesures : en janvier 2025, Adam Mosseri, patron d'Instagram, a cité le temps de visionnage, les likes et les envois comme les trois signaux qui comptent le plus pour le classement, à suivre « par portée » (pour 100 personnes touchées).

Dis-le dans le rendu : ce sont des spectateurs simulés par l'IA. Les chiffres comparent deux versions entre elles ; ce ne sont pas des vues ni une rétention réelles à attendre.

## 1. La vidéo

- Vérifie `ffmpeg` et `ffprobe` (`ffmpeg -version`). S'ils manquent, donne la commande d'installation (`brew install ffmpeg`, `winget install ffmpeg`, `sudo apt install ffmpeg`) et arrête-toi.
- Crée `RUN=.spectateurs/<AAAA-MM-JJ-HHMM>` (ajoute `.spectateurs/` au `.gitignore` s'il existe) et `$RUN/images/`.
- Durée : `ffprobe -v quiet -show_entries format=duration -of csv=p=0 <vidéo>`.
- Images, petites pour aller vite :
  - les 3 premières secondes, toutes les 0,5 s : `ffmpeg -v error -i <vidéo> -t 3 -vf "fps=2,scale=540:-2" $RUN/images/debut_%02d.jpg` ;
  - le reste, toutes les 2 s : `ffmpeg -v error -ss 3 -i <vidéo> -vf "fps=0.5,scale=540:-2" $RUN/images/suite_%02d.jpg`.
- Le son : si `whisper` est installé (`whisper --help`), transcris avec les temps (`whisper <vidéo> --language fr --output_format json --output_dir $RUN`) ; sinon demande une fois le texte de la voix off (avec à peu près ses temps), ou note « pas de voix » si la vidéo n'en a pas. Mesure aussi le volume de la première seconde : `ffmpeg -v info -t 1 -i <vidéo> -af volumedetect -f null - 2>&1 | grep mean_volume` (sous −40 dB : on n'entend presque rien au début).
- Regarde chaque image et écris `$RUN/timeline-A.md` : une ligne par instant (0 s ; 0,5 s ; 1 s… puis toutes les 2 s) avec ce qu'on voit (personnage, mouvement, texte à l'écran mot pour mot) et ce qui est dit à ce moment. C'est ce fichier que liront les spectateurs : sois factuel, ne juge pas.
- Le public : celui de l'utilisateur (« gens qui codent avec l'IA, 20-35 ans »), sinon déduis-le de la vidéo **et dis-le**.

## 2. Créer les spectateurs

Écris `$RUN/spectateurs.json` : N spectateurs (100 par défaut), réalistes et variés :
`{ "id", "prenom", "age", "interets" (2-3), "dans_le_public": true | false, "humeur": "fatigué" | "normal" | "curieux", "son": "activé" | "coupé", "reels_deja_vus_ce_soir", "abonne_au_compte": true | false }`

Répartition par défaut : 50 % dans le public visé, 30 % proches (un intérêt en commun), 20 % hors public ; 40 % fatigués, 40 % normaux, 20 % curieux ; 40 % le son coupé ; 10 % abonnés au compte. Pas de caricature.

## 3. Le visionnage : un sous-agent par lot de 20

Lance **dans un seul message** un sous-agent (outil Agent) par lot de 20 spectateurs, avec un modèle rapide si l'outil le permet. Chacun reçoit le chemin de `timeline-A.md`, celui du dossier `images/`, son lot et ce protocole :

> Pour chaque spectateur, joue-le honnêtement : il scrolle ce soir, son pouce est déjà posé sur l'écran, et la vidéo suivante est à un geste. S'il a le son coupé, il ne connaît que l'image et le texte à l'écran.
> 1. Avance dans la timeline instant par instant. À chaque instant : reste-t-il ? Dès qu'il part, note la seconde et la raison en une phrase (« je ne sais pas de quoi ça parle », « déjà vu », « trop lent », « pas pour moi »…).
> 2. S'il reste jusqu'au bout : like-t-il ? L'envoie-t-il à quelqu'un (à qui, et pourquoi en une phrase) ? Commente-t-il (quoi, mot pour mot) ?
> 3. Le moment exact qui l'a fait rester ou partir, cité (texte à l'écran ou phrase dite).
> Écris `<RUN>/lot-K-A.json` : un objet par spectateur `{ id, part_a: <secondes> | "fin", raison_depart, like, envoie, a_qui, commente, commentaire, moment_cle }`. Ne modifie aucun autre fichier. Réponds seulement « ok ».

## 4. Le diagnostic

Fusionne les lots et calcule :
- la **courbe de rétention** : combien regardent encore à 1, 2, 3, 5, 10, 15, 20, 25 et 30 s, et jusqu'à la fin ;
- le **temps de visionnage moyen** (en secondes et en % de la durée) ;
- **likes, envois et commentaires pour 100 spectateurs** ;
- les mêmes chiffres par segment (dans le public, proches, hors public ; son activé ou coupé ; fatigués).

Regroupe les raisons de départ par seconde : où partent-ils le plus, et pourquoi ? Relève ce qui fait rester et ce qui fait envoyer.

## 5. Réécrire le passage qui fait fuir, puis re-tester

1. Repère où la courbe baisse le plus. Si c'est dans les 3 premières secondes, le problème est l'accroche. Sinon, dis-le franchement (« ton accroche tient, ils partent à la 9ᵉ seconde ») : c'est ce passage qu'il faut réécrire, pas le début.
2. Propose **3 versions** du passage visé (les 3 premières secondes, ou les 3 à 5 secondes où ils partent), chacune avec : l'image (ce qu'on voit et ce qui bouge), le texte à l'écran, la phrase dite. Chacune répond à une raison de départ relevée au point 4 (par exemple : on comprend le sujet son coupé, le résultat est montré avant l'explication, le jargon est remplacé par ce que ça change pour le spectateur). Garde le fond de la vidéo : n'ajoute ni promesse ni chiffre que l'utilisateur n'a pas donnés.
3. Écris `$RUN/timeline-B.md` : la timeline A dont ce passage est remplacé par la meilleure version, décrite de la même façon. Relance les mêmes lots sur la version B (`lot-K-B.json`), en précisant aux sous-agents que ce passage n'est pas encore tourné : ils le lisent décrit. Si B ne fait pas mieux que A, dis-le et propose la version suivante plutôt que d'arrondir.
4. Écris `$RUN/rapport.md` et rends ce format :

```
## Ton reel face à 100 personnes qui scrollent (simulation)

|                          | Version A | Version B |
|--------------------------|-----------|-----------|
| Encore là à 3 s          | 41 / 100  | 63 / 100  |
| Jusqu'à la fin           | 12        | 22        |
| Visionnage moyen         | 6,1 s     | 9,8 s     |
| Likes / envois pour 100  | 4 / 1     | 9 / 4     |

### Courbe de rétention (version A)
0 s  ████████████████████ 100
1 s  ███████████████      74
3 s  ████████             41
…

### Pourquoi ils scrollent
- 1-2 s : « … » (22 spectateurs)

### Ce qui les fait rester ou envoyer
- « … » (9 spectateurs)

### Le passage qui fait fuir : 7-9 s (ou : l'accroche)
Version B — image : … / texte à l'écran : … / phrase : …
(les 2 autres versions proposées)
```

Termine en rappelant que ce sont des spectateurs simulés, et propose de tester une version C, un autre public, ou de refaire le test une fois la version B tournée.
