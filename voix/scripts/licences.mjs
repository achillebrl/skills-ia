// Dit quels moteurs de VoiceStudio ont le droit de servir pour une pub, d'après l'inventaire de licences du dépôt.
// Usage : node licences.mjs [chemin/vers/VoiceStudio] [--json]
// Lit backend/config/model_licenses.json (copie locale de VoiceStudio, sinon la version publique sur GitHub).
// Verdict par modèle : NON (licence non commerciale), À VÉRIFIER (licence absente, « other », openrail), OUI SELON LA FICHE (apache, mit, cc-by).
// « OUI SELON LA FICHE » n'est pas un avis juridique : c'est la licence affichée par l'auteur du modèle. Node 18+, sans dépendance.
import fs from "node:fs";
import path from "node:path";

const RAW = "https://raw.githubusercontent.com/debpalash/VoiceStudio/main/backend/config/model_licenses.json";
const args = process.argv.slice(2);
const dossier = args.find((a) => !a.startsWith("--"));
const enJson = args.includes("--json");

// Moteurs de synthèse qui clonent une voix (docs/engines/README.md de VoiceStudio, 27/10/2026).
const CLONENT = new Set(["omnivoice", "omnivoice-subprocess", "omnivoice-gguf", "voxcpm2", "moss-tts-nano", "cosyvoice", "cosyvoice-gguf",
  "gpt-sovits", "indextts2", "moss-tts-v15", "dots-tts", "pockettts", "confucius4-tts", "audiocpp"]);
const PAR_DEFAUT = "omnivoice";
const ORDRE = ["NON", "À VÉRIFIER", "OUI SELON LA FICHE"];

async function inventaire() {
  const local = dossier && path.join(dossier, "backend/config/model_licenses.json");
  if (local && fs.existsSync(local)) return { source: local, data: JSON.parse(fs.readFileSync(local, "utf8")) };
  const r = await fetch(RAW, { signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`inventaire introuvable (${RAW} : HTTP ${r.status})`);
  return { source: RAW, data: await r.json() };
}

function verdict(m) {
  const lic = String(m.license ?? "").toLowerCase();
  if (m.review_status === "noncommercial" || /\bnc\b|non-?commercial|-nc-|cc-by-nc/.test(lic)) return "NON";
  if (!lic || /noassertion|other|openrail|research/.test(lic)) return "À VÉRIFIER";
  if (/^(apache|mit|cc-by-4\.0)/.test(lic)) return "OUI SELON LA FICHE";
  return "À VÉRIFIER";
}

const { source, data } = await inventaire().catch((e) => { console.error(e.message); process.exit(1); });
const moteurs = (m) => (m.used_by ?? m.engines ?? []).filter((e) => CLONENT.has(e));
const lignes = data.models
  .filter((m) => moteurs(m).length)
  .map((m) => ({ modele: m.id, moteurs: moteurs(m), licence: m.license, verdict: verdict(m), defaut: moteurs(m).includes(PAR_DEFAUT) }))
  .sort((a, b) => ORDRE.indexOf(a.verdict) - ORDRE.indexOf(b.verdict));

if (enJson) { console.log(JSON.stringify({ source, inventaire_du: data.checked_at, lignes }, null, 1)); process.exit(0); }
console.log(`Inventaire VoiceStudio du ${data.checked_at} (${source})\n`);
for (const l of lignes) console.log(`${l.verdict.padEnd(19)} ${l.moteurs.join(", ").padEnd(28)} ${l.modele}${l.defaut ? "  ← moteur par défaut" : ""}\n${" ".repeat(20)}licence : ${l.licence}`);
console.log("\nOUI SELON LA FICHE = licence affichée par l'auteur du modèle, pas un avis juridique. Relis la fiche avant une pub ; une licence CC-BY demande de créditer l'auteur.");
