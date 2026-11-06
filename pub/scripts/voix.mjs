// Voix off ElevenLabs avec le temps de chaque mot.
// Usage : ELEVENLABS_API_KEY=… node scripts/voix.mjs <dossier-marque> [voice_id]
// Lit <dossier>/texte.txt, écrit <dossier>/voix.mp3 et <dossier>/voix.json ({ mots: [{ w, s, e }], duree }).
// Modèle : ELEVENLABS_MODEL (eleven_multilingual_v2 par défaut). La clé ne s'affiche jamais.
import fs from "node:fs";
import path from "node:path";

const [dossier, voiceId = "HUIkvxZj0mU5hsHnKc8f"] = process.argv.slice(2);
if (!dossier) throw new Error("usage : node scripts/voix.mjs <dossier-marque> [voice_id]");
const cle = process.env.ELEVENLABS_API_KEY;
if (!cle) throw new Error("ELEVENLABS_API_KEY manquante (variable d'environnement)");
const texte = fs.readFileSync(path.join(dossier, "texte.txt"), "utf8").trim();

const rep = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`, {
  method: "POST",
  headers: { "xi-api-key": cle, "Content-Type": "application/json" },
  body: JSON.stringify({ text: texte, model_id: process.env.ELEVENLABS_MODEL ?? "eleven_multilingual_v2", language_code: "fr" }),
});
if (!rep.ok) throw new Error(`ElevenLabs ${rep.status} : ${(await rep.text()).slice(0, 300)}`);
const { audio_base64: audio, alignment: a } = await rep.json();
fs.writeFileSync(path.join(dossier, "voix.mp3"), Buffer.from(audio, "base64"));

// Caractères → mots (début du premier caractère, fin du dernier).
const mots = [];
let courant = null;
a.characters.forEach((c, i) => {
  if (/\s/.test(c)) {
    if (courant) mots.push(courant);
    courant = null;
    return;
  }
  if (!courant) courant = { w: "", s: a.character_start_times_seconds[i], e: 0 };
  courant.w += c;
  courant.e = a.character_end_times_seconds[i];
});
if (courant) mots.push(courant);
const duree = a.character_end_times_seconds.at(-1);
fs.writeFileSync(path.join(dossier, "voix.json"), JSON.stringify({ mots, duree }, null, 1));
console.log(`voix.mp3 + voix.json : ${mots.length} mots, ${duree.toFixed(2)} s, ${texte.length} caractères`);
for (const m of mots) process.stdout.write(`${m.w}@${m.s.toFixed(2)} `);
process.stdout.write("\n");
