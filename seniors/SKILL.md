---
name: seniors
description: Fait relire le code par 7 relecteurs seniors spécialisés (sécurité, performance, lisibilité, tests, mobile, accessibilité, SEO), en parallèle, puis fusionne leurs avis en une seule liste : 3 corrections à faire avant de pusher et 2 idées pour plus tard. À utiliser avant un push ou une mise en prod, ou quand l'utilisateur dit « /seniors », « fais relire mon code », « revue avant de pusher », « est-ce que je peux mettre en prod ».
---

# Seniors : 7 relectures avant de pusher

Tu fais relire le code de l'utilisateur par sept seniors, chacun dans sa spécialité, puis tu rends **une seule liste courte et actionnable**. Tu ne modifies aucun fichier sauf si l'utilisateur le demande après la liste.

## 1. Délimiter ce qu'on relit

- Si l'utilisateur donne un chemin ou un fichier : c'est le périmètre.
- Sinon : les changements pas encore poussés. Essaie dans l'ordre `git diff origin/HEAD...HEAD`, `git diff main...HEAD`, puis `git diff HEAD` (changements non commités). S'il n'y a ni dépôt git ni changement, demande quoi relire.
- Note la stack (langages, framework, web ou non, front ou back) : elle décide quels seniors ont quelque chose à dire.

## 2. Lancer les sept seniors en parallèle

Lance **dans un seul message** sept sous-agents (outil Agent). Chacun reçoit : le périmètre exact (liste des fichiers et la commande git pour voir le diff), la stack, sa spécialité ci-dessous, et cette consigne de rendu :

> Relis uniquement sous l'angle de ta spécialité. Rends au plus 5 constats, du plus grave au moins grave. Pour chacun : fichier:ligne, gravité (bloquant / important / mineur), le problème en une phrase, la correction en une phrase ou un court extrait. Ne signale que ce que tu as vu dans le code, pas des généralités. Si rien ne te concerne dans ce périmètre, réponds « RAS » et pourquoi en une ligne. Ne modifie aucun fichier.

| Senior | Ce qu'il cherche |
|---|---|
| Sécurité | secrets en dur (clés API, mots de passe, tokens), injections SQL / commande / XSS, données utilisateur non validées, routes sans contrôle d'accès, CORS trop large, dépendances douteuses |
| Performance | requêtes en boucle (N+1), requêtes sans limite ni index, appels réseau en série qui pourraient être parallèles, gros calculs au rendu, images ou bundles trop lourds, fuites mémoire |
| Lisibilité | noms trompeurs, fonctions trop longues, duplication, code mort, logique imbriquée, commentaires faux, incohérences avec le style du projet |
| Tests | chemins critiques sans test, cas limites oubliés (vide, null, erreur réseau), tests qui ne vérifient rien, tests cassés par le changement |
| Mobile | rendu sur petit écran, zones tactiles trop petites, débordements horizontaux, gestes, clavier qui masque les champs, poids sur réseau lent (si pas d'interface : RAS) |
| Accessibilité | contrastes, textes alternatifs, labels de formulaires, navigation au clavier, focus visible, rôles ARIA, ordre de lecture (si pas d'interface : RAS) |
| SEO | balises title / description, titres hiérarchisés, URLs, contenu rendu côté serveur, liens cassés, sitemap, robots, données structurées (si pas de pages publiques : RAS) |

## 3. Fusionner en une liste

1. Rassemble les constats, supprime les doublons (deux seniors qui voient le même problème = un seul constat, plus grave).
2. Classe : bloquant > important > mineur ; à gravité égale, ce qui touche la sécurité ou les données passe devant.
3. Rends exactement ce format :

```
## Verdict des 7 seniors

### À corriger avant de pusher
1. [Sécurité] fichier:ligne — problème. → correction.
2. ...
3. ...

### Pour plus tard
1. [Spécialité] fichier:ligne — idée.
2. ...

### Ce que les seniors n'ont pas relu
- Mobile : RAS (pas d'interface dans ce périmètre)
- ...

Push : OK après les 3 corrections / À ÉVITER tant que le point 1 n'est pas réglé
```

- Toujours 3 points « avant de pusher » s'il y a au moins 3 constats sérieux, moins s'il n'y en a pas (ne jamais inventer).
- Toujours 2 points « pour plus tard » au plus.
- Termine en proposant d'appliquer les corrections une par une.
