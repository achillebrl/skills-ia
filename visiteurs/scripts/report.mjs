#!/usr/bin/env node
// Statistiques et rapport HTML du skill « visiteurs ».
// Usage :
//   node report.mjs <dossier> --stats            calcule stats.json à partir des réponses et l'affiche (à lire avant d'écrire analyse.json)
//   node report.mjs <dossier> [--avant <dossier>] écrit rapport.html (cartes des clics, chiffres, analyse, variantes, comparaison)
// Fichiers lus dans <dossier> : config.json, personas.json, reponses.json, page-capture.json,
// variante-N-reponses.json (facultatif), analyse.json (facultatif, écrit par l'agent).
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const dir = args[0];
const opt = (k) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : undefined;
};
if (!dir || !fs.existsSync(dir)) {
  console.error("usage : node report.mjs <dossier> [--stats] [--avant <dossier>]");
  process.exit(1);
}
const read = (f, fallback) => {
  const p = path.join(dir, f);
  if (!fs.existsSync(p)) {
    if (fallback !== undefined) return fallback;
    console.error(`fichier manquant : ${p}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
};

const config = read("config.json");
const personas = read("personas.json");
const reponses = read("reponses.json");
const capture = read("page-capture.json");
const byId = new Map(personas.map((p) => [String(p.id), p]));
const device = (r) => (/mobile/i.test(byId.get(String(r.id))?.appareil ?? "") ? "mobile" : "desktop");
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const ctaIds = (dev) => new Set((config.cta?.[dev] ?? []).map(String));
const element = (dev, id) => capture.profiles[dev].elements.find((e) => e.id === id);

/** Indicateurs d'un groupe de réponses. */
function metrics(list) {
  const n = list.length;
  const found = list.filter((r) => r.clic && ctaIds(device(r)).has(String(r.clic)));
  return {
    n,
    compris: pct(list.filter((r) => r.juste === true).length, n),
    reste: pct(list.filter((r) => r.reste === true).length, n),
    bouton: pct(found.length, n),
    boutonSansDefiler: pct(found.filter((r) => element(device(r), String(r.clic))?.inFold).length, n),
    perdus: pct(list.filter((r) => r.perdu).length, n),
    oui: pct(list.filter((r) => /^oui/i.test(r.decision ?? "")).length, n),
    peutEtre: pct(list.filter((r) => /peut/i.test(r.decision ?? "")).length, n),
    non: pct(list.filter((r) => /^non/i.test(r.decision ?? "")).length, n),
  };
}

function counts(list, key) {
  const out = {};
  for (const r of list) if (r[key]) out[r[key]] = (out[r[key]] ?? 0) + 1;
  return out;
}

function techChecks() {
  const checks = [];
  for (const dev of ["desktop", "mobile"]) {
    const p = capture.profiles[dev];
    const label = dev === "desktop" ? "Ordinateur" : "Mobile";
    const ctas = [...ctaIds(dev)].map((id) => element(dev, id)).filter(Boolean);
    if (!ctas.some((e) => e.inFold)) checks.push({ level: "ko", text: `${label} : le bouton principal n'est pas visible sans défiler` });
    for (const e of ctas.filter((c) => c.contrast < 4.5)) checks.push({ level: "warn", text: `${label} : contraste faible du bouton « ${e.text} » (${e.contrast}:1, il faut 4,5:1)` });
    const fold = ctas.filter((e) => e.inFold);
    if (dev === "mobile" && fold.length && fold.every((e) => e.h < 44)) checks.push({ level: "warn", text: "Mobile : bouton principal de moins de 44 px de haut, difficile à toucher" });
    if (p.perf.lcpMs > 2500) checks.push({ level: "warn", text: `${label} : le contenu principal s'affiche en ${(p.perf.lcpMs / 1000).toFixed(1)} s (objectif < 2,5 s)` });
    if (p.signals.cookieBanner?.coversFoldPct > 15) checks.push({ level: "warn", text: `${label} : la bannière cookies masque ${p.signals.cookieBanner.coversFoldPct} % du haut de page` });
    if (dev === "mobile" && p.foldWords > 70) checks.push({ level: "warn", text: `Mobile : ${p.foldWords} mots avant de défiler, c'est beaucoup pour 5 secondes` });
  }
  const s = capture.profiles.desktop.signals;
  if (!s.priceOnPage) checks.push({ level: "warn", text: "Aucun prix (ni « gratuit ») trouvé sur la page" });
  else if (!s.priceInFold) checks.push({ level: "info", text: "Le prix existe mais n'est pas visible sans défiler" });
  if (!s.proofOnPage) checks.push({ level: "warn", text: "Aucune preuve (avis, clients, chiffres) trouvée sur la page" });
  const broken = (capture.links ?? []).filter((l) => !l.ok);
  for (const l of broken) checks.push({ level: "ko", text: `Lien cassé : ${l.href} (${l.status})` });
  if (!checks.length) checks.push({ level: "ok", text: "Aucun problème technique détecté" });
  return checks;
}

function variants() {
  const files = fs.readdirSync(dir).filter((f) => /^variante-\d+-reponses\.json$/.test(f)).sort();
  if (!files.length) return [];
  const capVariants = fs.readdirSync(dir).filter((f) => /^variante-\d+-capture\.json$/.test(f));
  const rows = files.map((f) => {
    const name = f.replace("-reponses.json", "");
    const list = read(f);
    const cap = capVariants.includes(`${name}-capture.json`) ? read(`${name}-capture.json`) : null;
    const ids = new Set(list.map((r) => String(r.id)));
    const base = reponses.filter((r) => ids.has(String(r.id)));
    return { name, h1: cap?.variant?.h1 ?? null, sub: cap?.variant?.sub ?? null, n: list.length, compris: pct(list.filter((r) => r.juste === true).length, list.length), reste: pct(list.filter((r) => r.reste === true).length, list.length), base: { compris: pct(base.filter((r) => r.juste === true).length, base.length), reste: pct(base.filter((r) => r.reste === true).length, base.length) } };
  });
  return rows;
}

function computeStats() {
  const seg = {};
  for (const r of reponses) {
    const s = byId.get(String(r.id))?.segment ?? "inconnu";
    (seg[s] ??= []).push(r);
  }
  return {
    url: config.url,
    but: config.but,
    date: capture.capturedAt,
    total: metrics(reponses),
    parAppareil: { desktop: metrics(reponses.filter((r) => device(r) === "desktop")), mobile: metrics(reponses.filter((r) => device(r) === "mobile")) },
    parSegment: Object.fromEntries(Object.entries(seg).map(([k, v]) => [k, metrics(v)])),
    clics: { desktop: counts(reponses.filter((r) => device(r) === "desktop"), "clic"), mobile: counts(reponses.filter((r) => device(r) === "mobile"), "clic") },
    premierRegard: { desktop: counts(reponses.filter((r) => device(r) === "desktop"), "premier_regard"), mobile: counts(reponses.filter((r) => device(r) === "mobile"), "premier_regard") },
    technique: techChecks(),
    variantes: variants(),
  };
}

const stats = computeStats();
fs.writeFileSync(path.join(dir, "stats.json"), JSON.stringify(stats, null, 2));

if (args.includes("--stats")) {
  const t = stats.total;
  const line = (k, m) => `${k.padEnd(12)} n=${String(m.n).padStart(3)}  compris ${m.compris}%  restent ${m.reste}%  bouton ${m.bouton}% (dont sans défiler ${m.boutonSansDefiler}%)  hésitent ${m.perdus}%  oui ${m.oui}% / peut-être ${m.peutEtre}% / non ${m.non}%`;
  console.log(line("TOTAL", t));
  for (const [k, m] of Object.entries(stats.parAppareil)) console.log(line(k, m));
  for (const [k, m] of Object.entries(stats.parSegment)) console.log(line(k, m));
  for (const dev of ["desktop", "mobile"]) {
    const top = Object.entries(stats.clics[dev]).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, c]) => `${id} « ${element(dev, id)?.text ?? "?"} » ×${c}`);
    console.log(`clics ${dev} : ${top.join(" · ") || "aucun"}`);
  }
  for (const c of stats.technique) console.log(`[${c.level}] ${c.text}`);
  for (const v of stats.variantes) console.log(`${v.name} « ${v.h1 ?? ""} » : compris ${v.compris}% (base ${v.base.compris}%), restent ${v.reste}% (base ${v.base.reste}%)`);
  process.exit(0);
}

// ---------- rapport HTML ----------
const analyse = read("analyse.json", {});
const avant = opt("avant") ? JSON.parse(fs.readFileSync(path.join(opt("avant"), "stats.json"), "utf8")) : null;
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function kpi(label, value, before, hint) {
  const delta = before === undefined ? "" : `<span class="delta ${value - before >= 0 ? "up" : "down"}">${value - before >= 0 ? "+" : ""}${value - before} pts</span>`;
  return `<div class="kpi"><div class="v">${value}<small>%</small>${delta}</div><div class="l">${esc(label)}</div><div class="h">${esc(hint)}</div></div>`;
}

function heatmap(dev, data, color, title) {
  const p = capture.profiles[dev];
  const total = Object.values(data).reduce((a, b) => a + b, 0) || 1;
  const dots = Object.entries(data).map(([id, c]) => {
    const e = element(dev, id);
    if (!e || !e.inFold) return "";
    const size = Math.round(22 + 40 * Math.sqrt(c / total));
    return `<div class="dot" style="left:${((e.x + e.w / 2) / p.viewport.width) * 100}%;top:${((e.y + e.h / 2) / p.viewport.height) * 100}%;width:${size}px;height:${size}px;background:${color}">${c}</div>`;
  }).join("");
  const below = Object.entries(data).filter(([id]) => element(dev, id) && !element(dev, id).inFold).map(([id, c]) => `${esc(element(dev, id).text)} ×${c}`);
  return `<figure class="map ${dev}"><figcaption>${esc(title)} · ${dev === "desktop" ? "ordinateur" : "mobile"}</figcaption><div class="shot"><img src="${esc(p.screenshots.fold)}" alt="">${dots}</div>${below.length ? `<p class="below">Après défilement : ${below.join(" · ")}</p>` : ""}</figure>`;
}

function segmentTable() {
  const names = { cible: "Public visé", proche: "Proches", "hors-cible": "Hors cible", desktop: "Ordinateur", mobile: "Mobile" };
  const rows = [...Object.entries(stats.parAppareil), ...Object.entries(stats.parSegment)].map(([k, m]) => `<tr><td>${esc(names[k] ?? k)}</td><td>${m.n}</td><td>${m.compris} %</td><td>${m.reste} %</td><td>${m.bouton} %</td><td>${m.perdus} %</td><td>${m.oui} %</td></tr>`).join("");
  return `<table><thead><tr><th></th><th>n</th><th>Compris en 5 s</th><th>Restent</th><th>Trouvent le bouton</th><th>Hésitent ou bloquent</th><th>Passeraient à l'action</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function quotes() {
  const pick = [...reponses].filter((r) => r.citation).sort((a, b) => String(a.id).localeCompare(String(b.id), "fr", { numeric: true }));
  const step = Math.max(1, Math.floor(pick.length / 8));
  return pick.filter((_, i) => i % step === 0).slice(0, 8).map((r) => {
    const p = byId.get(String(r.id)) ?? {};
    return `<blockquote><p>« ${esc(r.citation)} »</p><cite>${esc(p.prenom)}, ${esc(p.age)} ans, ${esc(p.metier)} · ${esc(p.appareil)}${r.juste ? "" : " · n'a pas compris"}</cite></blockquote>`;
  }).join("");
}

const t = stats.total;
const b = avant?.total;
const list = (items, render) => (items?.length ? items.map(render).join("") : "<p class=\"muted\">—</p>");
const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>100 visiteurs · ${esc(config.url)}</title>
<style>
:root{--ink:#14171f;--muted:#6b7280;--line:#e5e7eb;--bg:#f7f7f5;--card:#fff;--accent:#2457f5;--ok:#16a34a;--warn:#d97706;--ko:#dc2626}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:1080px;margin:0 auto;padding:32px 20px 64px}h1{font-size:28px;margin:0 0 4px;letter-spacing:-.02em}h2{font-size:19px;margin:36px 0 12px}
.sub{color:var(--muted);margin:0 0 20px}.note{background:#fff7e6;border:1px solid #fde3a7;border-radius:10px;padding:10px 14px;font-size:13px;color:#7a5200}
.verdict{background:var(--ink);color:#fff;border-radius:14px;padding:18px 22px;font-size:17px;margin:20px 0}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.kpi{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px}
.kpi .v{font-size:34px;font-weight:800;letter-spacing:-.03em}.kpi .v small{font-size:18px;margin-left:2px}.kpi .l{font-weight:600}.kpi .h{color:var(--muted);font-size:12.5px}
.delta{font-size:13px;font-weight:700;margin-left:8px;vertical-align:middle}.delta.up{color:var(--ok)}.delta.down{color:var(--ko)}
.maps{display:grid;grid-template-columns:2fr 1fr;gap:16px;align-items:start}.map{margin:0;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px}
.map figcaption{font-weight:600;margin-bottom:8px}.shot{position:relative}.shot img{width:100%;display:block;border-radius:8px;border:1px solid var(--line)}
.dot{position:absolute;transform:translate(-50%,-50%);border-radius:50%;color:#fff;font:700 12px/1 system-ui;display:flex;align-items:center;justify-content:center;opacity:.88;box-shadow:0 0 0 3px rgba(255,255,255,.7)}
.below{font-size:12.5px;color:var(--muted);margin:8px 0 0}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px}.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px}
.card h3{margin:0 0 6px;font-size:16px}.card .n{color:var(--muted);font-size:13px}.card .q{display:block;color:#374151;font-style:italic;margin-top:6px}
ol.fix{padding:0;list-style:none;counter-reset:f}ol.fix li{counter-increment:f;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px 14px 56px;position:relative;margin-bottom:10px}
ol.fix li:before{content:counter(f);position:absolute;left:16px;top:14px;width:28px;height:28px;border-radius:8px;background:var(--accent);color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center}
ol.fix b{display:block}.tag{display:inline-block;font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px;background:#eef2ff;color:var(--accent);margin-left:6px}
table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden}th,td{padding:9px 12px;border-bottom:1px solid var(--line);text-align:left;font-size:14px}th{background:#fafafa;font-weight:600}
.checks li{margin:4px 0}.checks .ko{color:var(--ko)}.checks .warn{color:var(--warn)}.checks .ok{color:var(--ok)}.checks .info{color:var(--muted)}
blockquote{margin:0;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px 16px}blockquote p{margin:0 0 6px}cite{color:var(--muted);font-size:12.5px;font-style:normal}
.quotes{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px}.muted{color:var(--muted)}
@media(max-width:760px){.maps{grid-template-columns:1fr}}
</style></head><body><main>
<h1>${t.n} visiteurs ont testé votre page</h1>
<p class="sub">${esc(config.url)} · but : ${esc(config.but)} · public : ${esc(config.public)} · ${new Date(stats.date).toLocaleString("fr-FR")}</p>
<p class="note">Visiteurs simulés par l'IA à partir de captures réelles de la page (ordinateur et mobile). Un premier filtre pour repérer les problèmes évidents, à confirmer avec de vrais utilisateurs.</p>
${analyse.verdict ? `<div class="verdict">${esc(analyse.verdict)}</div>` : ""}
<div class="kpis">
${kpi("comprennent en 5 s", t.compris, b?.compris, "ce que fait le site, avec leurs mots")}
${kpi("resteraient", t.reste, b?.reste, "après la première impression")}
${kpi("trouvent le bouton", t.bouton, b?.bouton, `dont ${t.boutonSansDefiler} % sans défiler`)}
${kpi("passeraient à l'action", t.oui, b?.oui, `${t.peutEtre} % peut-être, ${t.non} % non`)}
</div>
<h2>Où ils cliqueraient</h2>
<div class="maps">${heatmap("desktop", stats.clics.desktop, "#2457f5", "Clics")}${heatmap("mobile", stats.clics.mobile, "#2457f5", "Clics")}</div>
<h2>Ce qu'ils regardent en premier</h2>
<div class="maps">${heatmap("desktop", stats.premierRegard.desktop, "#e11d48", "Premier regard")}${heatmap("mobile", stats.premierRegard.mobile, "#e11d48", "Premier regard")}</div>
<h2>Ce que personne n'a compris</h2>
<div class="cards">${list(analyse.incompris, (i) => `<div class="card"><h3>${esc(i.titre)}</h3><div class="n">${esc(i.nb)} visiteurs</div>${(i.citations ?? []).map((c) => `<span class="q">« ${esc(c)} »</span>`).join("")}</div>`)}</div>
<h2>Ce que tout le monde a raté</h2>
<div class="cards">${list(analyse.rates, (i) => `<div class="card"><h3>${esc(i.titre)}</h3><div class="n">${esc(i.nb)} visiteurs</div>${i.detail ? `<p>${esc(i.detail)}</p>` : ""}</div>`)}</div>
<h2>Les ${analyse.corrections?.length ?? 5} trucs à corriger ce soir</h2>
<ol class="fix">${list(analyse.corrections, (c) => `<li><b>${esc(c.titre)}<span class="tag">impact ${esc(c.impact ?? "")}</span></b>${esc(c.quoi)}${c.pourquoi ? `<div class="muted">${esc(c.pourquoi)}</div>` : ""}</li>`)}</ol>
${stats.variantes.length ? `<h2>Titres testés</h2><table><thead><tr><th>Variante</th><th>n</th><th>Compris en 5 s</th><th>Restent</th></tr></thead><tbody>
<tr><td>Titre actuel</td><td>${stats.variantes[0].n}</td><td>${stats.variantes[0].base.compris} %</td><td>${stats.variantes[0].base.reste} %</td></tr>
${stats.variantes.map((v) => `<tr><td><b>${esc(v.h1)}</b>${v.sub ? `<br><span class="muted">${esc(v.sub)}</span>` : ""}</td><td>${v.n}</td><td>${v.compris} %</td><td>${v.reste} %</td></tr>`).join("")}</tbody></table>` : ""}
<h2>Par profil</h2>${segmentTable()}
<h2>Vérifications techniques</h2><ul class="checks">${stats.technique.map((c) => `<li class="${c.level}">${esc(c.text)}</li>`).join("")}</ul>
<p class="muted">Chargement : ordinateur ${capture.profiles.desktop.perf.loadMs ?? "?"} ms (contenu principal ${capture.profiles.desktop.perf.lcpMs ?? "?"} ms), mobile ${capture.profiles.mobile.perf.loadMs ?? "?"} ms.</p>
<h2>Ils ont dit</h2><div class="quotes">${quotes()}</div>
<p class="muted" style="margin-top:32px">Généré par le skill Claude Code « visiteurs » · github.com/achillebrl/skills-ia</p>
</main></body></html>`;
fs.writeFileSync(path.join(dir, "rapport.html"), html);
console.log(`OK ${path.join(dir, "rapport.html")}`);
