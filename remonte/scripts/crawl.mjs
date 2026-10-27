// Passe sur toutes les pages d'un site et relève ce qui est cassé ou mal titré.
// Usage : node crawl.mjs https://ton-site.fr [--max 200] [--sortie .remonte]
// Pages : sitemap.xml (et ses sous-sitemaps), sinon liens internes depuis l'accueil.
// Relevé par page : statut HTTP, redirections, <title>, meta description, <h1>, canonical, noindex, nombre de mots,
// puis chaque lien interne vérifié (404, 5xx). Écrit <sortie>/crawl.json et <sortie>/crawl.md. Node 18+, sans dépendance.
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const site = args.find((a) => /^https?:\/\//.test(a));
if (!site) { console.error("usage : node crawl.mjs https://ton-site.fr [--max 200] [--sortie .remonte]"); process.exit(2); }
const opt = (nom, def) => { const i = args.indexOf(nom); return i >= 0 ? args[i + 1] : def; };
const MAX = Number(opt("--max", 200));
const SORTIE = opt("--sortie", ".remonte");
const ORIGINE = new URL(site).origin;
const UA = "remonte-skill/1.0 (+https://github.com/achillebrl/skills-ia)";
const DELAI_MS = 15000;

async function lire(url, { corps = true } = {}) {
  try {
    const r = await fetch(url, { redirect: "manual", headers: { "user-agent": UA }, signal: AbortSignal.timeout(DELAI_MS) });
    const loc = r.headers.get("location");
    return { statut: r.status, redirection: loc ? new URL(loc, url).href : null, html: corps && r.status < 300 ? await r.text() : "" };
  } catch (e) {
    return { statut: 0, erreur: e.name === "TimeoutError" ? "délai dépassé" : "injoignable", html: "" };
  }
}

/** Suit les redirections (5 au plus) et garde la chaîne. */
async function suivre(url) {
  const chaine = [];
  let courant = url;
  for (let i = 0; i < 5; i += 1) {
    const r = await lire(courant);
    if (r.statut >= 300 && r.statut < 400 && r.redirection) { chaine.push(courant); courant = r.redirection; continue; }
    return { ...r, url: courant, chaine };
  }
  return { statut: 310, url: courant, chaine, html: "" };
}

const texte = (html, re) => (html.match(re)?.[1] ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const decoder = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

function analyser(html, url) {
  const corps = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ");
  const liens = [...html.matchAll(/<a\s[^>]*href=["']([^"'#]+)["']/gi)]
    .map((m) => { try { const u = new URL(decoder(m[1]), url); u.hash = ""; return u.href; } catch { return null; } })
    .filter((h) => h && h.startsWith(ORIGINE));
  return {
    title: decoder(texte(html, /<title[^>]*>([\s\S]*?)<\/title>/i)),
    description: decoder(html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] ?? html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)?.[1] ?? ""),
    h1: decoder(texte(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i)),
    canonical: html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1] ?? "",
    noindex: /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html),
    mots: corps.replace(/<[^>]+>/g, " ").split(/\s+/).filter((w) => /[\p{L}]{2,}/u.test(w)).length,
    liens: [...new Set(liens)],
  };
}

async function pagesDuSitemap() {
  const vues = new Set();
  const pages = [];
  const file = [`${ORIGINE}/sitemap.xml`];
  while (file.length && pages.length < MAX) {
    const url = file.shift();
    if (vues.has(url)) continue;
    vues.add(url);
    const r = await suivre(url);
    if (r.statut !== 200) continue;
    for (const m of r.html.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
      const loc = decoder(m[1]);
      if (/\.xml(\?|$)/.test(loc)) file.push(loc); else if (loc.startsWith(ORIGINE)) pages.push(loc);
    }
  }
  return [...new Set(pages)].slice(0, MAX);
}

async function main() {
  let pages = await pagesDuSitemap();
  const source = pages.length ? "sitemap.xml" : "liens depuis l'accueil";
  if (!pages.length) pages = [new URL(site).href]; // « https://site.fr » et « https://site.fr/ » sont la même page
  const resultats = [];
  const vues = new Set();
  for (let i = 0; i < pages.length && resultats.length < MAX; i += 1) {
    const url = pages[i];
    if (vues.has(url)) continue;
    vues.add(url);
    const r = await suivre(url);
    const a = r.html ? analyser(r.html, r.url) : { liens: [] };
    resultats.push({ url, statut: r.statut, erreur: r.erreur, redirige_vers: r.chaine.length ? r.url : null, ...a });
    if (source !== "sitemap.xml") for (const l of a.liens) if (!vues.has(l) && pages.length < MAX) pages.push(l);
    process.stdout.write(`\r${resultats.length} pages lues`);
  }
  // Liens internes cassés : chaque cible vérifiée une seule fois.
  const statuts = new Map(resultats.map((p) => [p.url, p.statut]));
  const casses = [];
  for (const p of resultats) for (const l of p.liens ?? []) {
    if (!statuts.has(l)) statuts.set(l, (await lire(l, { corps: false })).statut);
    const s = statuts.get(l);
    if (s === 0 || s >= 400) casses.push({ page: p.url, lien: l, statut: s });
  }
  const titres = new Map();
  for (const p of resultats) if (p.title) titres.set(p.title, [...(titres.get(p.title) ?? []), p.url]);
  const ok = resultats.filter((p) => p.statut === 200);
  const rapport = {
    site: ORIGINE, source, date: new Date().toISOString(), pages: resultats.length,
    pages_en_erreur: resultats.filter((p) => p.statut !== 200 && !p.redirige_vers).map(({ url, statut, erreur }) => ({ url, statut, erreur })),
    redirections: resultats.filter((p) => p.redirige_vers).map(({ url, redirige_vers }) => ({ url, redirige_vers })),
    liens_casses: casses,
    sans_title: ok.filter((p) => !p.title).map((p) => p.url),
    title_trop_long: ok.filter((p) => p.title.length > 60).map((p) => ({ url: p.url, title: p.title, longueur: p.title.length })),
    title_en_double: [...titres].filter(([, u]) => u.length > 1).map(([title, urls]) => ({ title, urls })),
    sans_description: ok.filter((p) => !p.description).map((p) => p.url),
    sans_h1: ok.filter((p) => !p.h1).map((p) => p.url),
    noindex: ok.filter((p) => p.noindex).map((p) => p.url),
    contenu_mince: ok.filter((p) => p.mots < 250).map((p) => ({ url: p.url, mots: p.mots })),
    detail: resultats.map(({ liens, ...p }) => p),
  };
  fs.mkdirSync(SORTIE, { recursive: true });
  fs.writeFileSync(path.join(SORTIE, "crawl.json"), JSON.stringify(rapport, null, 1));
  const ligne = (t, l) => `- **${t}** : ${l.length}`;
  fs.writeFileSync(path.join(SORTIE, "crawl.md"), [
    `# Crawl de ${ORIGINE} (${rapport.pages} pages, ${source})`, "",
    ligne("pages en erreur (404, 5xx, injoignables)", rapport.pages_en_erreur),
    ligne("liens internes cassés", rapport.liens_casses),
    ligne("redirections", rapport.redirections),
    ligne("pages sans <title>", rapport.sans_title),
    ligne("<title> de plus de 60 caractères", rapport.title_trop_long),
    ligne("<title> en double", rapport.title_en_double),
    ligne("pages sans meta description", rapport.sans_description),
    ligne("pages sans <h1>", rapport.sans_h1),
    ligne("pages en noindex", rapport.noindex),
    ligne("pages de moins de 250 mots", rapport.contenu_mince), "",
    "Détail complet : crawl.json",
  ].join("\n"));
  console.log(`\nOK -> ${path.join(SORTIE, "crawl.md")}`);
}

main();
