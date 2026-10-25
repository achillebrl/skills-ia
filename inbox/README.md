# Inbox : un agent trie ta boîte mail la nuit (workflow n8n)

Tu ouvres ta boîte : cinquante mails, trois qui comptent. Ce workflow [n8n](https://n8n.io) fait le tri pendant que tu dors :

- **à 6 h**, il lit chaque mail non lu des dernières 24 h et le classe avec Claude : **urgent, client, facture, newsletter ou poubelle** ;
- pour chaque **client**, il prépare un **brouillon de réponse** dans ton style, rangé dans Gmail : **jamais envoyé sans toi** ;
- les **factures** partent dans leur libellé, avec le **montant** et le fournisseur notés ;
- les newsletters et la poubelle sortent de ta boîte de réception (**rien n'est supprimé**, tout reste dans leur libellé) ;
- **à 8 h**, tu reçois un **résumé** : les mails à traiter, les brouillons prêts, les factures avec leur montant, et ce qui a été rangé.

## Installer (10 minutes)

1. Dans Gmail, crée 5 libellés : `IA-Urgent`, `IA-Client`, `IA-Facture`, `IA-Newsletter`, `IA-Poubelle`.
2. Dans n8n (cloud ou auto-hébergé), **Workflows → Import from File** et choisis [`inbox.json`](inbox.json).
3. Connecte ton compte Gmail sur les nœuds Gmail, et ta clé API Anthropic sur « Modèle Claude » (choisis un modèle Haiku : rapide et peu cher). Tu préfères OpenAI ? Remplace ce nœud par « OpenAI Chat Model ».
4. Ouvre « Réglages » : ton nom, ton email (pour le résumé) et ton style d'écriture (« tutoiement, phrases courtes, signature : Léa »).
5. Teste avec **Execute workflow** : si tu le lances après 8 h, le résumé part tout de suite. Puis active le workflow.

## Ce qu'il ne fait pas

- Il n'envoie **aucun** mail à tes contacts : les réponses sont des brouillons, à relire et envoyer toi-même. Le seul mail envoyé, c'est ton résumé, à toi.
- Il ne supprime rien : « poubelle » veut dire « sorti de la boîte de réception, rangé dans IA-Poubelle ».
- Il ne lit que les mails non lus des dernières 24 h (50 au plus par nuit), et ne retraite pas un mail déjà classé.
- Le contenu de tes mails est envoyé au modèle d'IA que tu choisis pour le classement : à toi de voir si c'est acceptable pour ta boîte.

## Coût

Le workflow est gratuit (licence MIT). Il tourne sur ton n8n : l'auto-hébergement est gratuit, n8n Cloud est payant. Le classement appelle le modèle une fois par mail : avec un modèle Haiku, quelques centimes pour une cinquantaine de mails.

— [@achille.ia](https://www.instagram.com/achille.ia/)
