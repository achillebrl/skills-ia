---
name: aveugle
description: Teste un site comme le ferait une personne aveugle ou qui navigue sans souris. Lance axe-core sur la page, puis la parcourt AU CLAVIER uniquement (Tab, Maj+Tab, Entrée, Espace) avec Playwright, en relevant l'ordre de focus, les éléments impossibles à atteindre, les pièges à focus, le focus invisible, les images sans alternative, les boutons et liens sans nom (ou nommés « bouton »), les champs sans étiquette et les formulaires impossibles à finir au clavier. Rend les corrections classées de la plus bloquante à la plus simple, puis propose de corriger le code. À utiliser quand l'utilisateur dit « /aveugle », « teste l'accessibilité de mon site », « mon site est-il accessible », « audit accessibilité », « European Accessibility Act », « EAA », « RGAA », « navigation au clavier », « lecteur d'écran ».
argument-hint: <url>
---

# Aveugle : ton site face à quelqu'un qui ne voit pas l'écran

Tu passes la page de l'utilisateur à axe-core, puis tu la parcours **au clavier seulement**, comme une personne aveugle avec un lecteur d'écran ou quelqu'un qui ne peut pas tenir une souris. Tu rends la liste des corrections, de la plus bloquante à la plus simple. Tu ne modifies aucun fichier du projet sans accord : tout s'écrit dans `.aveugle/`.

Dis-le dans le rapport :
- Depuis le **28 juin 2025**, l'**European Accessibility Act** (directive UE 2019/882, transposée en France par la loi n° 2023-171 du 9 mars 2023) impose l'accessibilité aux sites de **commerce électronique** et à d'autres services. Les **micro-entreprises** (moins de 10 salariés **et** chiffre d'affaires annuel ou total du bilan de 2 M€ au plus) en sont exemptées pour les services.
- Ce rapport est un **premier filtre automatique**, pas un audit RGAA certifié ni une déclaration de conformité. Les robots ne voient qu'une partie des problèmes : il faut ensuite un test avec un vrai lecteur d'écran (VoiceOver, NVDA) et, si l'obligation te concerne, un audit par un professionnel.

`S` = le dossier `scripts` de ce skill (en général `~/.claude/skills/aveugle/scripts`).

## 0. Préparer

1. Sans URL, demande-la. Une adresse locale (`http://localhost:3000`) marche aussi.
2. Crée `RUN=.aveugle/<AAAA-MM-JJ-HHMM>` dans le dossier courant (ajoute `.aveugle/` au `.gitignore` s'il existe).
3. Vérifie l'installation : `ls $S/node_modules/playwright $S/node_modules/@axe-core/playwright`. Sinon : `npm install --prefix $S` puis `npx --prefix $S playwright install chromium` (une seule fois, environ 1 min).

## 1. axe-core + parcours au clavier

`node $S/aveugle.mjs <url> $RUN` (de 10 s à 2 min selon la page).

Le script, dans un Chromium sans écran :
1. **axe-core** (règles WCAG 2.2 A et AA) sur la page telle qu'elle arrive. On passe par Playwright car `npx @axe-core/cli <url>` exige un ChromeDriver de la même version que Chrome et casse souvent ; si l'utilisateur tient à la CLI, lance-la en plus, sans remplacer le script.
2. **Les noms que le navigateur donne** à chaque bouton, lien, image et champ, c'est-à-dire ce que le lecteur d'écran lit : vides, vagues (« bouton », « cliquez ici », « en savoir plus »), noms de fichier (`IMG_2034.jpg`). Il relève aussi les **champs sans étiquette** (un placeholder ne compte pas : il disparaît dès qu'on tape).
3. **Tab** jusqu'à revenir au début : l'ordre de focus, le nom et le rôle de chaque arrêt, le **focus invisible** (rien ne change à l'écran), le focus posé sur un élément caché, les **pièges** (le focus tourne en boucle ou ne bouge plus ; il tente alors Échap), les `tabindex` positifs et les grands sauts vers le haut.
4. **Maj+Tab** : le chemin inverse doit être le même, à l'envers.
5. Les éléments **inatteignables** : cliquables à la souris (curseur main, `onclick`) mais jamais atteints au clavier, par exemple un `<div>` « Ajouter au panier ».
6. **Entrée et Espace** sur les éléments « faits maison » (`<div role="button">`…) : réagissent-ils ?
7. Chaque **formulaire** visible : rempli et envoyé au clavier seulement. **Rien n'est envoyé** : l'envoi est intercepté et toute requête autre que GET est bloquée.

Sortie : `$RUN/rapport.json` et `$RUN/page.png` (capture de la page).

## 2. Lire et vérifier

1. Lis `rapport.json` en entier et **regarde `page.png`** (outil de lecture d'image) pour situer chaque élément.
2. Fusionne les doublons (axe et le parcours trouvent souvent le même bouton sans nom).
3. Écarte les faux positifs en le disant : un grand saut vers le haut dans une mise en page en colonnes est normal ; un piège dans une fenêtre modale ouverte est voulu si Échap la ferme.
4. Si le code du site est dans le dossier courant, retrouve chaque élément (texte, classe, `id`) et note le fichier et la ligne.

## 3. Classer, de la plus bloquante à la plus simple

- 🔴 **Bloquant** (impossible d'aller au bout) : piège à focus, formulaire impossible à finir au clavier, action principale inatteignable ou qui ne réagit pas à Entrée/Espace, bouton ou lien sans nom, champ obligatoire sans étiquette, violation axe « critical ».
- 🟠 **Grave** (on y arrive, mais à l'aveugle) : focus invisible, image porteuse d'information sans alternative, ordre de focus illogique (`tabindex` positif, Maj+Tab différent), champ avec un simple placeholder, violation axe « serious ».
- 🟡 **Gênant** : noms vagues ou répétés (12 liens « en savoir plus »), alternative qui est un nom de fichier, violation axe « moderate ».
- ⚪ **Simple** : le reste (axe « minor », langue de la page, cibles trop petites…), souvent une ligne à changer.

À gravité égale, ce qui touche le plus d'éléments passe devant.

## 4. Le rapport

Écris `$RUN/corrections.md` et rends ce format :

```
## Ton site face à un aveugle : 3 bloquants, 4 graves, 2 gênants, 1 simple

### Ce qu'entend un lecteur d'écran sur tes 8 premiers arrêts
1. « lien, Accueil » (focus invisible)  2. « bouton » (aucun nom)  3. …

### 🔴 1. Le bouton « Ajouter au panier » est inatteignable au clavier
Où : <div class="faux" onclick="…">Ajouter au panier</div> · src/components/Produit.tsx:42
Ce que vit l'utilisateur : Tab passe dessus sans s'arrêter ; impossible d'acheter sans souris.
Correction : <button type="button" class="faux" onclick="…">Ajouter au panier</button>
```

Un bloc par correction : où (extrait HTML, et fichier:ligne si trouvé), ce que vit l'utilisateur en une phrase concrète, la correction en code. Puis l'avertissement légal et « pas un audit RGAA certifié » du début.

Dans ta réponse : le nombre de corrections par gravité, les 5 premières en une ligne chacune, le chemin de `corrections.md`, puis **propose de corriger le code**, en commençant par la n° 1. Ne modifie rien sans accord. Après les corrections, relance `node $S/aveugle.mjs <url> $RUN-2` et compare.
