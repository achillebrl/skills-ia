---
name: voix
description: Clone ta propre voix en local, gratuitement, avec VoiceStudio (l'alternative open source à ElevenLabs), et fabrique tes voix off de pub ou de vidéo sans réenregistrer, sans te faire piéger par les licences. Vérifie l'accord de la personne dont c'est la voix, vérifie que le moteur choisi a le droit de servir pour une pub (le moteur par défaut de VoiceStudio, OmniVoice, est sous licence non commerciale), contrôle l'enregistrement de référence, puis génère les voix off par l'API ou le serveur MCP de VoiceStudio. À utiliser quand l'utilisateur dit « /voix », « clone ma voix », « voix off avec ma voix », « alternative gratuite à ElevenLabs », « VoiceStudio », ou veut une voix off pour une pub, une vidéo ou un livre audio.
argument-hint: [script.txt ou texte] [--pub | --perso] [--ref mon-enregistrement.wav]
---

# Voix : ta voix clonée en local, sans piège de licence

Tu aides l'utilisateur à cloner **sa** voix sur sa machine avec [VoiceStudio](https://github.com/debpalash/VoiceStudio) (AGPL-3.0, gratuit) et à produire ses voix off. Tout s'écrit dans `.voix/<AAAA-MM-JJ>/` du dossier courant.

`S` = le dossier `scripts` de ce skill (en général `~/.claude/skills/voix/scripts`). Il faut Node 18+ et ffmpeg.

## 1. À qui est la voix ? L'accord d'abord

Demande à qui est la voix. Tu continues seulement si :
- c'est la voix de l'utilisateur ;
- ou une autre personne a donné son accord **par écrit** pour cet usage (demande-lui de le confirmer).

Écris `.voix/consentement.md` : la personne, l'usage prévu, la date, « accord écrit confirmé par l'utilisateur ». Sans accord : tu t'arrêtes, et tu proposes une voix inventée (`design_voice` de VoiceStudio) à la place. Jamais la voix d'une célébrité, d'un client ou d'un proche sans son accord.

## 2. Usage : perso ou pub ?

Demande si les voix off serviront à vendre (pub, vidéo d'un client, contenu monétisé) : c'est `--pub`. Dans ce cas :

1. `node $S/licences.mjs [dossier de VoiceStudio]` lit l'inventaire de licences de VoiceStudio (`backend/config/model_licenses.json`) et classe chaque moteur qui clone : **NON** (licence non commerciale), **À VÉRIFIER**, **OUI SELON LA FICHE** (apache, mit, cc-by).
2. Le moteur par défaut, **OmniVoice, est NON** (CC-BY-NC) : pour une pub, change de moteur. Sur Mac Apple Silicon ou PC, propose **VoxCPM2** (apache-2.0, CUDA, MPS ou CPU, clonage + création de voix) ; sinon CosyVoice 3 ou MOSS-TTS-Nano (apache-2.0).
3. Dis-le clairement : « OUI SELON LA FICHE » = la licence affichée par l'auteur du modèle, pas un avis juridique. La licence AGPL de l'application ne donne aucun droit sur les modèles. Pour une campagne importante, fais relire la fiche du modèle.

En `--perso` (tests, usage privé), OmniVoice convient.

## 3. Installer ou retrouver VoiceStudio

1. `curl -s http://127.0.0.1:3900/.well-known/voicestudio-speech` : s'il répond, VoiceStudio tourne déjà.
2. Sinon, montre la commande d'installation officielle et **demande l'accord** avant de la lancer (elle télécharge l'application et ~5 Go de dépendances) : `curl -fsSL https://voicestudio.sh/install | sh` (Mac / Linux), `irm https://voicestudio.sh/install | iex` (Windows). Mac Intel : application seule, il faut un serveur distant. Ou les installateurs de la page Releases.
3. Ouvre l'application une fois (premier lancement Mac : clic droit → Ouvrir), installe le moteur choisi à l'étape 2 dans **Model Catalogue**.
4. Pour piloter depuis Claude Code : `claude mcp add --transport http voicestudio http://127.0.0.1:3900/mcp/` (outils `clone_voice`, `generate_speech`, `list_voices`). Pour écrire les fichiers sur le disque, lance VoiceStudio avec `OMNIVOICE_MCP_OUTPUT_MODE=files` et `OMNIVOICE_MCP_BASE_PATH=<dossier du projet>/.voix`.

## 4. L'enregistrement de référence

Le clone vaut ce que vaut l'enregistrement. Demande 10 à 15 secondes de parole naturelle, une seule voix, pièce calme, micro à 20 cm, sans musique. Contrôle avec ffmpeg :
- durée : `ffprobe -v error -show_entries format=duration -of csv=p=0 ref.wav` (entre 5 et 20 s ; OmniVoice en garde 15 s, VoxCPM2 30 s) ;
- niveau et silences : `ffmpeg -i ref.wav -af "volumedetect,silencedetect=n=-45dB:d=0.6" -f null -` (pic sous −1 dB, pas de long silence au milieu).
Convertis en WAV mono 24 kHz : `ffmpeg -i ref.m4a -ac 1 -ar 24000 .voix/ref.wav`. Écris la transcription exacte de l'enregistrement (elle améliore le clone).

## 5. Cloner et générer

1. `clone_voice` (MCP) avec `.voix/ref.wav` et sa transcription, ou **Voice cloning** dans l'application → garde le `profile_id`.
2. Découpe le script en paragraphes de 1 à 3 phrases (meilleure stabilité), génère chaque paragraphe avec `generate_speech` et ce `profile_id`, dans la langue du texte.
3. Écoute (ou fais écouter) le premier paragraphe avant de lancer le reste. Voix trop rapide, accent qui dérive : refais l'enregistrement plutôt que de forcer.
4. Assemble : `ffmpeg -f concat -safe 0 -i liste.txt -c copy .voix/<date>/voix-off.wav`, puis normalise pour Instagram ou YouTube : `ffmpeg -i voix-off.wav -af loudnorm=I=-14:TP=-1.5 voix-off-14lufs.wav`.

## 6. Livrer

`.voix/<date>/` : les WAV, `voix-off-14lufs.wav`, et `credits.md` (moteur, modèle, licence, lien de la fiche, crédit exigé pour une licence CC-BY). Pour une pub : rappelle que certaines plateformes demandent d'indiquer un contenu généré par IA.
