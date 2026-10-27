# Skill « voix » pour Claude Code

Tu paies encore un abonnement pour cloner ta propre voix ? [VoiceStudio](https://github.com/debpalash/VoiceStudio) le fait sur ton ordi, gratuitement (près de 90 000 ★ sur GitHub). Mais attention : **son moteur par défaut, OmniVoice, est sous licence non commerciale** (c'est écrit dans l'inventaire de licences du dépôt). Pour une pub, il faut en changer.

Ce skill fait le tri pour toi :

- il vérifie que c'est **ta** voix (ou que la personne a dit oui par écrit) ;
- il lit l'inventaire de licences de VoiceStudio et te dit **quel moteur a le droit de servir pour une pub** (VoxCPM2, CosyVoice 3, MOSS-TTS… sous apache-2.0) ;
- il installe ou retrouve VoiceStudio et le branche à Claude Code (serveur MCP) ;
- il contrôle ton enregistrement de référence (durée, niveau, silences) ;
- il génère tes voix off paragraphe par paragraphe et les normalise à −14 LUFS pour Instagram et YouTube.

Ce n'est pas un avis juridique : le skill lit la licence affichée par l'auteur de chaque modèle.

## Installer (1 minute)

1. Copie le dossier `voix` dans `~/.claude/skills/` (Mac / Linux) ou `%USERPROFILE%\.claude\skills\` (Windows).
2. Relance Claude Code.

Il faut Node.js 18+ et ffmpeg. VoiceStudio s'installe à part (le skill te guide, avec ton accord) : Mac Apple Silicon, Windows, Linux ; sur Mac Intel, l'application a besoin d'un serveur distant.

## Utiliser

    /voix script.txt --pub --ref mon-enregistrement.m4a

Juste pour voir quels moteurs ont le droit de servir pour une pub :

    node ~/.claude/skills/voix/scripts/licences.mjs
