#!/usr/bin/env node
// Fusionne les lots de réponses des sous-agents (lot-K.json) en reponses.json et signale les manques.
// Usage : node merge.mjs <dossier>
import fs from "node:fs";
import path from "node:path";

const dir = process.argv[2];
if (!dir) {
  console.error("usage : node merge.mjs <dossier>");
  process.exit(1);
}
const REQUIRED = ["id", "compris_5s", "juste", "reste", "clic", "decision", "citation"];
const personas = JSON.parse(fs.readFileSync(path.join(dir, "personas.json"), "utf8"));
const all = [];
const problems = [];
for (const f of fs.readdirSync(dir).filter((x) => /^lot-\d+\.json$/.test(x)).sort()) {
  try {
    const list = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    if (!Array.isArray(list)) throw new Error("pas un tableau");
    for (const r of list) {
      const missing = REQUIRED.filter((k) => !(k in r));
      if (missing.length) problems.push(`${f} : visiteur ${r.id ?? "?"} sans ${missing.join(", ")}`);
      all.push(r);
    }
  } catch (err) {
    problems.push(`${f} illisible (${err.message})`);
  }
}
const seen = new Set();
const unique = all.filter((r) => !seen.has(String(r.id)) && seen.add(String(r.id)));
const absent = personas.filter((p) => !seen.has(String(p.id))).map((p) => p.id);
fs.writeFileSync(path.join(dir, "reponses.json"), JSON.stringify(unique, null, 1));
console.log(`reponses.json : ${unique.length} réponses sur ${personas.length} visiteurs`);
if (absent.length) console.log(`manquants : ${absent.join(", ")}`);
for (const p of problems) console.log(`à corriger : ${p}`);
