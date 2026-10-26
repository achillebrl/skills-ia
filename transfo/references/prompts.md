# Guide de prompts /transfo

## Personnes types (toujours fictives)

Le texte de `--personne` est inséré dans la consigne Nano Banana Pro du script :

> Edit this photo: replace the person with a different, fictional person: **{personne}**. Keep exactly the same pose, the same hand positions, the same object in hand, the same framing, the same room, the same lighting and colors. Photorealistic photo, natural skin texture, no text.

Écrire la personne en anglais, en 15 à 30 mots : âge, allure, coiffure, tenue. Ne jamais citer un nom réel ni « qui ressemble à ».

| Idée de reel | `--personne` | Voix |
|---|---|---|
| Coach qui présente un objet | `a fit woman in her early thirties, sports coach, hair in a high ponytail, light makeup, black fitted sports top` | Charlotte |
| Ta cliente type | `a woman in her forties, small business owner, shoulder-length brown hair, glasses, beige blazer over a white t-shirt` | Laura |
| Ton toi de 70 ans | `the same man aged seventy, grey hair, deeper wrinkles, same face shape, same t-shirt` | Bill |
| Ta version fille | `a woman who looks like the female version of this man, same age, same eye color, long dark hair` | Lily |
| Présentatrice télé | `a TV news presenter in her late thirties, sleek bob haircut, navy blazer, studio-ready makeup` | Sarah |
| Chercheuse en labo | `a scientist in her late twenties, curly hair tied back, white lab coat over a grey sweater, safety glasses on her head` | Alice |

« Ton toi de 70 ans » et « Ta version fille » restent l'utilisateur lui-même, transformé avec son accord : c'est permis, à condition de le filmer lui.

## Voix (ElevenLabs voice changer sur fal)

Voix du catalogue citées par fal : Aria, Sarah, Laura, Charlotte, Alice, Matilda, Jessica, Lily, Rachel (femmes) ; Roger, Charlie, George, Callum, River, Liam, Will, Eric, Chris, Brian, Daniel, Bill (hommes). Le voice changer garde les mots, le rythme et l'intonation de l'utilisateur : parler en français donne une voix en français. Écouter le résultat : si l'accent sonne faux, essayer une autre voix (seule l'étape voix est repayée, environ 0,30 $ la minute).

## Tournage qui marche avec Kling Motion Control

- Haut du corps entier dans le cadre, tête comprise, rien devant le visage (doc fal : « entire body or upper body visible, including head, without obstruction »).
- Gestes francs mais lents ; pas de mains qui sortent du cadre au moment de la bascule.
- L'objet présenté est visible sur l'image modèle (`--image-a`), sinon Kling peut l'oublier.
- Une pause nette avant la phrase de l'autre personne : c'est là que le script coupe.
- 10 à 30 s au total ; seules les secondes après la bascule sont transformées et facturées.

## Coût (prix publics fal.ai au 26/10/2026)

| Étape | Modèle | Prix |
|---|---|---|
| Nouvelle personne | `fal-ai/nano-banana-pro/edit` | 0,15 $ l'image |
| Gestes et bouche | `fal-ai/kling-video/v2.6/standard/motion-control` (ou `/pro/`) | 0,07 $/s (pro : 0,112 $/s) |
| Voix | `fal-ai/elevenlabs/voice-changer` | 0,30 $/min |

Exemple : 12 s de vidéo, bascule à 3 s, donc 9,5 s transformées : environ 0,86 $ en standard.
