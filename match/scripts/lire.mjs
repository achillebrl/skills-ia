#!/usr/bin/env node
// Skill « match » : lit un site comme un visiteur pressé. Accueil (capture ordinateur + mobile, texte du premier écran, boutons visibles,
// poids de la page) puis quelques pages clés trouvées dans les liens (tarifs, avis, fonctionnalités, à propos).
// Usage : node lire.mjs <url> <dossier> [--pages 4]
// Sortie : <dossier>/site.json, accueil-ordi.png, accueil-mobile.png, page-<k>.png. Lecture seule : aucun formulaire n'est envoyé.
import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const [url, out] = args;
if (!url || !out || url.startsWith("--")) {
  console.error("usage : node lire.mjs <url> <dossier> [--pages 4]");
  process.exit(1);
}
const i = args.indexOf("--pages");
const MAX_PAGES = i >= 0 ? Number(args[i + 1]) : 4;
const TEXTE_MAX = 8000;
const ECRAN = { width: 1366, height: 860 };
const CLES = [
  ["tarifs", /tarif|prix|pricing|plans?\b|abonnement|offres?\b|price/i],
  ["preuves", /avis|t[ée]moignage|clients?\b|r[ée]f[ée]rences|reviews?|testimonials?|cas[-_ ]clients?|case[-_ ]stud|customers/i],
  ["produit", /fonctionnalit|features?|produit|product|services?|solutions?|comment[-_ ]ça[-_ ]marche|how[-_ ]it[-_ ]works/i],
  ["a-propos", /[àa][-_ ]propos|about|qui[-_ ]sommes|[ée]quipe|team/i],
];
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const ordi = await browser.newContext({ viewport: ECRAN, locale: "fr-FR" });
await ordi.route("**/*", (r) => (r.request().method() === "GET" ? r.continue() : r.abort()));

async function ouvrir(page, adresse) {
  await page.goto(adresse, { waitUntil: "load", timeout: 45000 });
  await page.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => {});
  await page.waitForTimeout(800); // laisse passer les bandeaux et animations d'arrivée
}

/** Texte, titres, prix et boutons visibles dans le premier écran. */
const lirePage = () => {
  const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && Number(s.opacity) > 0; };
  const premierEcran = (el) => el.getBoundingClientRect().top < innerHeight && el.getBoundingClientRect().bottom > 0;
  const texte = document.body.innerText.replace(/\n{3,}/g, "\n\n");
  const boutons = [...document.querySelectorAll("a,button,input[type=submit],[role=button]")]
    .filter((el) => visible(el) && premierEcran(el) && (el.innerText || el.value || "").trim())
    .map((el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return { texte: (el.innerText || el.value).trim().slice(0, 60), surface_px: Math.round(r.width * r.height), fond: s.backgroundColor, couleur: s.color, lien: el.getAttribute("href") }; })
    .sort((a, b) => b.surface_px - a.surface_px).slice(0, 15);
  const prix = [...texte.matchAll(/[^\n]{0,60}(\d[\d  .,]*\s?(€|EUR|\$|£)|(€|\$|£)\s?\d[\d.,]*)[^\n]{0,40}/g)].map((m) => m[0].trim()).slice(0, 20);
  return {
    titre: document.title, description: document.querySelector("meta[name=description]")?.content ?? null,
    h1: [...document.querySelectorAll("h1")].map((h) => h.innerText.trim()).filter(Boolean),
    premier_ecran: [...document.querySelectorAll("h1,h2,h3,p,li,a,button,span")].filter((el) => visible(el) && premierEcran(el) && el.children.length === 0).map((el) => el.innerText.trim()).filter(Boolean).join(" | ").slice(0, 1500),
    boutons_premier_ecran: boutons, prix_trouves: prix, texte,
    liens: [...document.querySelectorAll("a[href]")].map((a) => ({ texte: a.innerText.trim().slice(0, 60), href: a.href })),
  };
};

// 1. Accueil sur ordinateur, avec le poids réel de la page (repli si Lighthouse ne tourne pas).
const page = await ordi.newPage();
let octets = 0;
let requetes = 0;
page.on("requestfinished", async (req) => { requetes += 1; const t = await req.sizes().catch(() => null); if (t) octets += t.responseBodySize + t.responseHeadersSize; });
const t0 = Date.now();
await page.goto(url, { waitUntil: "load", timeout: 45000 });
const chargementS = (Date.now() - t0) / 1000;
await page.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => {});
await page.waitForTimeout(800);
const lcp = await page.evaluate(() => new Promise((ok) => { new PerformanceObserver((l) => ok(l.getEntries().at(-1)?.startTime ?? null)).observe({ type: "largest-contentful-paint", buffered: true }); setTimeout(() => ok(null), 1000); }));
await page.screenshot({ path: path.join(out, "accueil-ordi.png") });
const accueil = await page.evaluate(lirePage);
const site = {
  url: page.url(), date: new Date().toISOString(),
  poids_playwright: { ko: Math.round(octets / 1024), requetes, chargement_s: +chargementS.toFixed(1), lcp_s: lcp ? +(lcp / 1000).toFixed(1) : null, note: "mesure brute sur ta connexion, sans limitation : à comparer entre les deux sites seulement" },
  accueil: { ...accueil, texte: accueil.texte.slice(0, TEXTE_MAX), liens: undefined },
  pages: [],
};

// 2. Accueil sur mobile (le premier écran change souvent du tout au tout).
const mobile = await browser.newContext({ ...devices["iPhone 13"], locale: "fr-FR" });
await mobile.route("**/*", (r) => (r.request().method() === "GET" ? r.continue() : r.abort()));
const pm = await mobile.newPage();
await ouvrir(pm, url).catch((e) => (site.mobile_erreur = e.message));
await pm.screenshot({ path: path.join(out, "accueil-mobile.png") }).catch(() => {});
site.mobile = await pm.evaluate(lirePage).then((m) => ({ h1: m.h1, premier_ecran: m.premier_ecran, boutons_premier_ecran: m.boutons_premier_ecran })).catch(() => null);

// 3. Pages clés : une par type (tarifs, preuves, produit, à propos), sur le même site.
const origine = new URL(page.url()).origin;
const vues = new Set([page.url().split("#")[0]]);
const choisies = [];
for (const [type, motif] of CLES) {
  const l = accueil.liens.find((x) => x.href.startsWith(origine) && !vues.has(x.href.split("#")[0]) && (motif.test(x.texte) || motif.test(new URL(x.href).pathname)));
  if (l && choisies.length < MAX_PAGES - 1) { vues.add(l.href.split("#")[0]); choisies.push({ type, url: l.href.split("#")[0] }); }
}
for (const [k, c] of choisies.entries()) {
  try {
    await ouvrir(page, c.url);
    await page.screenshot({ path: path.join(out, `page-${k + 1}.png`) });
    const p = await page.evaluate(lirePage);
    site.pages.push({ ...c, capture: `page-${k + 1}.png`, titre: p.titre, h1: p.h1, prix_trouves: p.prix_trouves, texte: p.texte.slice(0, TEXTE_MAX) });
  } catch (e) { site.pages.push({ ...c, erreur: e.message }); }
}
await browser.close();

fs.writeFileSync(path.join(out, "site.json"), JSON.stringify(site, null, 2));
console.log(`${site.url} : ${site.poids_playwright.ko} Ko, ${site.poids_playwright.requetes} requêtes, chargé en ${site.poids_playwright.chargement_s} s ; pages lues : accueil${site.pages.map((p) => `, ${p.type}`).join("")}`);
console.log(`-> ${path.join(out, "site.json")}`);
