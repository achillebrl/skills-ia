# Claude Code devient con au bout d'une heure ?

Il ne devient pas bête : il se noie dans sa **mémoire de travail** (le « contexte »). Chaque fichier lu, chaque commande lancée s'y empile. Quand c'est plein, il résume tout seul, souvent en pleine tâche, et il improvise. Quatre réflexes pour garder la main.

## 1. Regarde ce qui prend la place

`/context` affiche ce qui remplit le contexte (fichiers lus, résultats d'outils, CLAUDE.md, historique) et la place qui reste. À lancer dès que les réponses deviennent approximatives.

## 2. Résume avant qu'il ne le fasse tout seul

`/compact` condense la conversation et repart du résumé. Donne-lui une consigne pour choisir ce qu'il garde :

```
/compact garde seulement les décisions prises, les fichiers modifiés et ce qui reste à faire
```

Sans consigne, il décide seul de ce qui compte. Et si tu attends, le compactage automatique se déclenche au pire moment.

## 3. Repars de zéro quand il tourne en rond

Un résumé garde aussi les mauvaises pistes. Quand il boucle : demande une passation, puis `/clear`, puis colle la passation dans la nouvelle session.

```
Écris une passation en 5 lignes pour un collègue qui reprend : objectif, ce qui est fait, ce qui bloque, fichiers concernés, prochaine étape.
```

## 4. Fais fouiller par un sous-agent

Pour explorer le code, demande un sous-agent : il lit les fichiers dans son propre contexte et ne te renvoie que son résumé. Ton contexte principal reste propre.

```
Lance un sous-agent qui cherche où est gérée l'authentification et me rend un résumé de 10 lignes avec les fichiers concernés, sans coller le code.
```

## Bonus : un CLAUDE.md court

Il est relu à chaque session, donc il coûte à chaque message. 30 lignes qui disent **où trouver** l'info, pas 500 lignes qui la recopient. Modèle :

```markdown
# Projet
Stack : Next.js 15, Supabase, Tailwind. Déploiement Vercel.
Commandes : `pnpm dev`, `pnpm test`, `pnpm lint`.

# Où trouver quoi
- Auth : src/lib/auth/ (README dedans)
- Base : supabase/migrations/, schéma dans docs/schema.md
- UI : src/components/, design tokens dans src/styles/tokens.css

# Règles
- Pas de nouvelle dépendance sans me demander.
- Un test par bug corrigé.
- Tu ne touches pas à src/legacy/.

# En cours
Voir docs/TODO.md (mis à jour par toi en fin de session).
```

## Pour aller plus loin (projets open source)

- [ykdojo/claude-code-tips](https://github.com/ykdojo/claude-code-tips) : plus de 45 astuces Claude Code, des bases à l'avancé.
- [abhishekray07/claude-md-templates](https://github.com/abhishekray07/claude-md-templates) : modèles de CLAUDE.md (MIT).
- [Njengah/claude-code-cheat-sheet](https://github.com/Njengah/claude-code-cheat-sheet) : la feuille de triche Claude Code (MIT).
- Documentation officielle : [code.claude.com/docs](https://code.claude.com/docs).

— [@achille.ia](https://www.instagram.com/achille.ia/)
