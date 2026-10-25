#!/usr/bin/env node
// Horde de testeurs pour le skill « testeurs » : N testeurs (gremlins.js piloté par Playwright) ouvrent l'app et font n'importe quoi
// (clics, double clics, retour arrière, champs vides, emoji, dates absurdes…). Chaque erreur est notée avec l'écran et les dernières étapes.
// Usage : node horde.mjs <url> <dossier> [--n 20] [--secondes 40] [--rejouer <id>] [--voir]
// Sortie : <dossier>/testeur-<id>.json, ecran-<id>-<k>.png, bugs-bruts.json (erreurs regroupées, du plus fréquent au plus rare).
import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PROFILS, attaque, testeurs } from "./profils.mjs";

const args = process.argv.slice(2);
const opt = (k, d) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : d;
};
const [url, out] = args;
if (!url || !out || url.startsWith("--")) {
  console.error("usage : node horde.mjs <url> <dossier> [--n 20] [--secondes 40] [--rejouer <id>] [--voir]");
  process.exit(1);
}
const N = Number(opt("n", 20));
const SECONDES = Number(opt("secondes", 40));
const REJOUER = opt("rejouer");
const EN_PARALLELE = 5;
const ETAPES_GARDEES = 10;
const ORIGIN = new URL(url).origin;
const GREMLINS = path.join(path.dirname(fileURLToPath(import.meta.url)), "node_modules/gremlins.js/dist/gremlins.min.js");
fs.mkdirSync(out, { recursive: true });

/** Clé de regroupement : le message sans la valeur saisie (après « : »), sans nombres, identifiants ni adresses. */
const sansValeur = (m) => { const i = m.indexOf(":"); return i >= 8 ? m.slice(0, i) : m; };
const cle = (e) => `${e.type}|${sansValeur(e.message).replace(/https?:\/\/\S+/g, "<url>").replace(/[0-9a-f]{8,}/gi, "<id>").replace(/\d+/g, "<n>").slice(0, 160)}`;

async function testeur(browser, p) {
  const profil = PROFILS[p.style];
  const context = await browser.newContext(p.appareil === "mobile" ? { ...devices["iPhone 13"], locale: "fr-FR" } : { viewport: { width: 1366, height: 860 }, locale: "fr-FR" });
  const page = await context.newPage();
  const etapes = [];
  const erreurs = [];
  const t0 = Date.now();
  const note = (msg) => etapes.push({ t: +((Date.now() - t0) / 1000).toFixed(1), page: page.url().replace(ORIGIN, "") || "/", action: msg });
  const erreur = async (type, message) => {
    const e = { type, message: String(message).slice(0, 400), page: page.url().replace(ORIGIN, "") || "/", t: +((Date.now() - t0) / 1000).toFixed(1), etapes: etapes.slice(-ETAPES_GARDEES) };
    if (!erreurs.some((x) => cle(x) === cle(e))) {
      e.ecran = `ecran-${p.id}-${erreurs.length + 1}.png`;
      await page.screenshot({ path: path.join(out, e.ecran) }).catch(() => (e.ecran = null));
    }
    erreurs.push(e);
  };
  await context.exposeBinding("__testeur", (_src, msg) => {
    note(String(msg));
    if (String(msg).startsWith("ALERTE ")) erreur("valeur absurde acceptée", String(msg).slice(7));
  });
  page.on("pageerror", (err) => erreur("exception JS", err.message));
  page.on("console", (m) => m.type() === "error" && !m.text().startsWith("Failed to load resource") && erreur("erreur console", m.text()));
  page.on("dialog", (d) => { note(`boîte de dialogue « ${d.message().slice(0, 80)} »`); d.dismiss().catch(() => {}); });
  page.on("crash", () => erreur("page plantée", "le navigateur a fermé la page"));
  page.on("response", (r) => {
    const req = r.request();
    if (r.status() >= 400 && r.url().startsWith(ORIGIN) && ["fetch", "xhr", "document"].includes(req.resourceType())) erreur(`HTTP ${r.status()}`, `${req.method()} ${r.url().replace(ORIGIN, "")}`);
  });
  page.on("requestfailed", (req) => req.url().startsWith(ORIGIN) && req.failure()?.errorText !== "net::ERR_ABORTED" && erreur("requête échouée", `${req.method()} ${req.url().replace(ORIGIN, "")} (${req.failure()?.errorText})`));

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 }).catch((e) => erreur("chargement", e.message));
  let manche = 0;
  while ((Date.now() - t0) / 1000 < SECONDES) {
    manche += 1;
    // Reste sur l'app : si un clic l'a fait sortir, retour à l'adresse de départ.
    if (!page.url().startsWith(ORIGIN)) { note("sorti de l'app, retour au départ"); await page.goto(url, { waitUntil: "domcontentloaded" }).catch(() => {}); }
    try {
      await page.addScriptTag({ path: GREMLINS });
      await page.evaluate(attaque, { graine: p.graine * 1000 + manche, actions: 60, style: p.style });
    } catch {
      // Une navigation a coupé la manche : on attend la nouvelle page et on continue.
      await page.waitForLoadState("domcontentloaded").catch(() => {});
    }
  }
  await context.close();
  const res = { ...p, profil: profil.nom, secondes: SECONDES, nb_etapes: etapes.length, erreurs };
  fs.writeFileSync(path.join(out, `testeur-${p.id}.json`), JSON.stringify(res, null, 2));
  console.log(`testeur ${String(p.id).padStart(2)} ${p.prenom.padEnd(9)} (${profil.nom}, ${p.appareil}) : ${etapes.length} actions, ${erreurs.length} erreur(s)`);
  return res;
}

const liste = testeurs(N).filter((p) => !REJOUER || String(p.id) === String(REJOUER));
if (!liste.length) { console.error(`aucun testeur ${REJOUER}`); process.exit(1); }
const browser = await chromium.launch({ headless: !args.includes("--voir") });
const resultats = [];
for (let i = 0; i < liste.length; i += EN_PARALLELE) resultats.push(...(await Promise.all(liste.slice(i, i + EN_PARALLELE).map((p) => testeur(browser, p)))));
await browser.close();

// Regroupe les erreurs identiques : combien de testeurs l'ont vue, et le premier exemple pour la reproduire.
const groupes = new Map();
for (const r of resultats) for (const e of r.erreurs) {
  const k = cle(e);
  const g = groupes.get(k) ?? { type: e.type, message: e.message, testeurs: new Set(), occurrences: 0, exemple: null };
  g.testeurs.add(r.id);
  g.occurrences += 1;
  if (!g.exemple && e.ecran) g.exemple = { testeur: r.id, prenom: r.prenom, profil: r.profil, appareil: r.appareil, graine: r.graine, page: e.page, t: e.t, ecran: e.ecran, etapes: e.etapes };
  groupes.set(k, g);
}
const bugs = [...groupes.values()].map((g) => ({ ...g, testeurs: [...g.testeurs] })).sort((a, b) => b.testeurs.length - a.testeurs.length || b.occurrences - a.occurrences);
if (!REJOUER) fs.writeFileSync(path.join(out, "bugs-bruts.json"), JSON.stringify({ url, n: liste.length, secondes: SECONDES, date: new Date().toISOString(), bugs }, null, 2));
console.log(`${bugs.length} erreur(s) différente(s) -> ${path.join(out, REJOUER ? `testeur-${REJOUER}.json` : "bugs-bruts.json")}`);
