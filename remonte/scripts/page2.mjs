// Trouve les requêtes coincées en page 2 de Google dans un export Search Console.
// Usage : node page2.mjs <dossier ou .zip de l'export « Performances »> [--min 30] [--sortie .remonte]
// Lit Requêtes.csv / Queries.csv (et Pages.csv / Pages.csv si présent), garde les positions 8 à 20,
// classe par clics gagnables si la requête montait en position 3 (CTR ~10 %, ordre de grandeur Backlinko / Sistrix).
// Écrit <sortie>/page2.json et <sortie>/page2.md. Node 18+, sans dépendance (unzip du système pour un .zip).
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const entree = args.find((a) => !a.startsWith("--") && fs.existsSync(a));
if (!entree) { console.error("usage : node page2.mjs <export Search Console (dossier ou .zip)> [--min 30] [--sortie .remonte]"); process.exit(2); }
const opt = (nom, def) => { const i = args.indexOf(nom); return i >= 0 ? args[i + 1] : def; };
const MIN_IMPRESSIONS = Number(opt("--min", 30));
const SORTIE = opt("--sortie", ".remonte");
const POSITION_MIN = 8;
const POSITION_MAX = 20;
const CTR_CIBLE = 0.10; // position 3 environ

function dossierExport(p) {
  if (!p.endsWith(".zip")) return p;
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "remonte-"));
  execFileSync("unzip", ["-q", "-o", p, "-d", d]);
  return d;
}

/** CSV avec guillemets, séparateur virgule. */
function lireCsv(fichier) {
  const texte = fs.readFileSync(fichier, "utf8").replace(/^﻿/, "");
  const lignes = [];
  let ligne = [], champ = "", guillemets = false;
  for (let i = 0; i < texte.length; i += 1) {
    const c = texte[i];
    if (guillemets) {
      if (c === '"' && texte[i + 1] === '"') { champ += '"'; i += 1; } else if (c === '"') guillemets = false; else champ += c;
    } else if (c === '"') guillemets = true;
    else if (c === ",") { ligne.push(champ); champ = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && texte[i + 1] === "\n") i += 1;
      ligne.push(champ); champ = "";
      if (ligne.some((x) => x !== "")) lignes.push(ligne);
      ligne = [];
    } else champ += c;
  }
  if (champ || ligne.length) { ligne.push(champ); lignes.push(ligne); }
  return lignes;
}

// « 1 234 », « 2,5 % », « 8,3 », « 2.5% » → nombres
const nombre = (s) => Number(String(s).replace(/[\s  %]/g, "").replace(",", ".")) || 0;

function lignes(dossier, noms) {
  const f = fs.readdirSync(dossier).find((n) => noms.includes(n.normalize("NFC").toLowerCase()));
  if (!f) return null;
  const [, ...corps] = lireCsv(path.join(dossier, f));
  return corps.filter((l) => l[0]).map((l) => ({
    cle: l[0], clics: nombre(l[1]), impressions: nombre(l[2]), ctr: nombre(l[3]) / 100, position: nombre(l[4]),
  }));
}

function enPage2(liste) {
  return liste
    .filter((l) => l.position >= POSITION_MIN && l.position <= POSITION_MAX && l.impressions >= MIN_IMPRESSIONS)
    .map((l) => ({ ...l, clics_gagnables: Math.max(0, Math.round(l.impressions * CTR_CIBLE - l.clics)) }))
    .sort((a, b) => b.clics_gagnables - a.clics_gagnables);
}

const dossier = dossierExport(entree);
const requetes = lignes(dossier, ["requêtes.csv", "queries.csv"]);
if (!requetes) { console.error(`Requêtes.csv / Queries.csv introuvable dans ${entree}`); process.exit(1); }
const pages = lignes(dossier, ["pages.csv"]);
const rapport = {
  source: path.resolve(entree), date: new Date().toISOString(),
  regle: `positions ${POSITION_MIN} à ${POSITION_MAX}, ${MIN_IMPRESSIONS} impressions au moins, clics gagnables = impressions × ${CTR_CIBLE} − clics actuels`,
  requetes: enPage2(requetes),
  pages: pages ? enPage2(pages) : [],
};
fs.mkdirSync(SORTIE, { recursive: true });
fs.writeFileSync(path.join(SORTIE, "page2.json"), JSON.stringify(rapport, null, 1));
const tableau = (liste) => ["| | clics gagnables | impressions | position | clics |", "|---|---|---|---|---|",
  ...liste.slice(0, 20).map((l) => `| ${l.cle} | ${l.clics_gagnables} | ${l.impressions} | ${l.position.toFixed(1)} | ${l.clics} |`)].join("\n");
fs.writeFileSync(path.join(SORTIE, "page2.md"), [
  `# Coincé en page 2 (${rapport.requetes.length} requêtes, ${rapport.pages.length} pages)`, "", rapport.regle, "",
  "## Requêtes", "", tableau(rapport.requetes), "",
  ...(pages ? ["## Pages", "", tableau(rapport.pages), ""] : []),
].join("\n"));
console.log(`${rapport.requetes.length} requêtes en page 2 -> ${path.join(SORTIE, "page2.md")}`);
