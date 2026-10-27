---
name: remonte
description: Fait remonter un site de la page 2 à la page 1 de Google, chaque jour, en partant de vraies données : crawl de toutes les pages (404, liens internes cassés, redirections, titres trop longs ou en double, pages sans description ni H1, pages trop minces), requêtes coincées en positions 8 à 20 dans l'export Search Console, réécriture des titres, descriptions et H1 de ces pages, ajout de la section qui manque et de liens internes, puis contrôle de ce que les IA (ChatGPT, Perplexity, Gemini) répondent sur ton sujet. À utiliser quand l'utilisateur dit « /remonte », « mon site est en page 2 », « je ne suis pas sur Google », « audit SEO de mon site », « pourquoi je n'ai pas de trafic », ou donne une URL et un export Search Console.
argument-hint: <url> [export Search Console .zip ou dossier] [--max 200] [--quotidien]
---

# Remonte : de la page 2 à la page 1

Tu pars des données réelles du site et tu rends la liste des corrections, classées par clics gagnables. Tout s'écrit dans `.remonte/` du dossier courant (ajoute `.remonte/` au `.gitignore` s'il existe). Tu ne modifies aucun fichier du projet sans accord.

Dis-le dans le rapport : aucune méthode ne garantit la page 1. Google classe aussi selon la concurrence, les liens externes et l'ancienneté. Le skill règle ce qui dépend du site lui-même.

`S` = le dossier `scripts` de ce skill (en général `~/.claude/skills/remonte/scripts`). Il faut Node 18+, rien d'autre.

## 1. Crawl : ce qui est cassé

1. `node $S/crawl.mjs <url> --sortie .remonte/<AAAA-MM-JJ>` → `crawl.json` + `crawl.md`.
2. Lis `crawl.md`, puis le détail dans `crawl.json`. Priorités, dans cet ordre :
   - pages en erreur et liens internes cassés (une 404 liée depuis le site gaspille le passage de Google) ;
   - pages en `noindex` par erreur ;
   - titres absents, en double ou de plus de 60 caractères (coupés dans Google) ;
   - descriptions et H1 absents ; pages de moins de 250 mots sur un sujet qui mérite plus.
3. Si le dossier courant est le code du site : retrouve chaque problème dans le code (route, composant, métadonnées) et propose le correctif exact (fichier, ancien texte, nouveau texte).

## 2. Page 2 : ce qui est presque gagné

1. Demande l'export Search Console si l'utilisateur ne l'a pas donné : Search Console → Performances → Résultats de recherche → période **3 mois** → **Exporter** → CSV (ou .zip). Une requête en position 8 à 20 est déjà jugée pertinente par Google : c'est là que le gain est le plus rapide.
2. `node $S/page2.mjs <export> --sortie .remonte/<date>` → `page2.json` + `page2.md`. Les clics gagnables sont un ordre de grandeur (CTR ~10 % en position 3), pas une promesse.
3. Pour les **5 premières requêtes** : trouve la page qui doit se classer (celle de `Pages.csv` sur le même sujet, sinon cherche la requête dans les titres, H1 et URL de `crawl.json`, sinon lis les pages candidates). Si aucune page ne traite vraiment la requête, propose de la créer.
4. Sans export (site neuf, pas d'accès) : saute cette étape, dis-le, et propose d'installer Search Console.

## 3. Réécrire les pages visées

Pour chaque page retenue, propose :
- un `<title>` de 60 caractères au plus, la requête au début, une promesse concrète ;
- une meta description de 150 caractères au plus, qui donne envie de cliquer (chiffre, bénéfice, preuve) ;
- un H1 qui reprend la requête avec les mots de l'internaute ;
- la section qui manque : lis la page et dis ce qu'un internaute qui tape cette requête cherche et ne trouve pas (prix, délai, zone, comparaison, étapes, FAQ) ; écris-la ;
- 2 ou 3 liens internes vers cette page depuis des pages proches (texte du lien = la requête ou une variante).

N'invente aucun fait sur l'entreprise (prix, chiffres, avis) : laisse un `[À COMPLÉTER : …]`.

## 4. Les IA : est-ce qu'on te cite ?

1. Écris 5 questions qu'un client poserait à ChatGPT sur ce sujet (« quelle est la meilleure pension pour chien à Lyon ? »).
2. Si tu as un outil de recherche web, cherche chacune et note qui est cité ; sinon donne les 5 questions à l'utilisateur pour qu'il les pose lui-même dans ChatGPT, Perplexity et Gemini et colle les réponses.
3. Propose ce qui aide à être cité : une FAQ qui répond en une phrase claire à chaque question, les infos clés en texte (pas seulement en image), un `llms.txt` à la racine, et une fiche Google Business à jour pour un commerce local.

## 5. Rapport

Écris `.remonte/<date>/rapport.md` : le verdict en une phrase, les corrections classées (cassé → page 2 → IA), chacune avec le fichier ou la page, l'avant et l'après. Propose ensuite d'appliquer les corrections une par une.

## Tous les jours (`--quotidien`)

Relance le crawl chaque jour et compare au précédent (`crawl.json` de la veille) : nouvelles 404, nouveaux liens cassés, titres modifiés. Dans Claude Code : `/loop 1d /remonte <url> --quotidien`, ou une tâche planifiée. Refais l'étape 2 une fois par semaine avec un nouvel export : Google met souvent 1 à 4 semaines à reprendre une page modifiée.
