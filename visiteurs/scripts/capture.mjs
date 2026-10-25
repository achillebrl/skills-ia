#!/usr/bin/env node
// Capture d'une page pour le skill « visiteurs », sur ordinateur et sur mobile :
// - haut de page tel qu'on le voit en 5 secondes (fold.png), puis la page découpée écran par écran avec chaque élément cliquable numéroté ;
// - éléments cliquables (texte, position, visible sans défiler, taille de police, contraste) ;
// - titres, texte visible sans défiler, signaux (prix, preuves, formulaire, bannière cookies), temps de chargement, liens cassés.
// Usage : node capture.mjs <url> <dossier> [--name page] [--h1 "nouveau titre"] [--sub "nouveau sous-titre"]
// --h1 / --sub remplacent le premier <h1> et l'élément qui le suit dans la vraie page avant capture (test de variantes de titre).
import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const opt = (k) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const [url, out] = args;
if (!url || !out || url.startsWith("--")) {
  console.error('usage : node capture.mjs <url> <dossier> [--name page] [--h1 "titre"] [--sub "sous-titre"]');
  process.exit(1);
}
const NAME = opt("name") ?? "page";
const VARIANT = { h1: opt("h1"), sub: opt("sub") };
const MAX_SCREENS = 15;
const MAX_ELEMENTS = 60;
const MAX_LINKS = 15;

const PROFILES = {
  desktop: { prefix: "D", context: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: "fr-FR" } },
  mobile: { prefix: "M", context: { ...devices["iPhone 13"], locale: "fr-FR" } },
};

/** Tout ce qu'on mesure dans la page (exécuté dans le navigateur, page en haut, sans défilement). */
function extract({ prefix, maxElements }) {
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  // Toute couleur CSS (rgb, oklab, oklch de Tailwind v4, color-mix…) ramenée en sRGB par un canvas : [r, g, b, alpha].
  const cx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  const parse = (c) => {
    cx.clearRect(0, 0, 1, 1);
    cx.fillStyle = "#000";
    cx.fillStyle = c;
    cx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = cx.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a / 255];
  };
  // Texte semi-transparent : sa couleur réelle est un mélange avec le fond.
  const blend = (fg, bg) => fg.slice(0, 3).map((v, i) => Math.round(v * fg[3] + bg[i] * (1 - fg[3])));
  const lum = ([r, g, b]) => {
    const f = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const bgOf = (el) => {
    for (let n = el; n; n = n.parentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c[3] > 0.5) return c.slice(0, 3);
    }
    return [255, 255, 255];
  };
  const ratio = (a, b) => {
    const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
    return Math.round(((l1 + 0.05) / (l2 + 0.05)) * 10) / 10;
  };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 4 && r.height > 4 && s.visibility !== "hidden" && s.display !== "none" && Number(s.opacity) > 0.1;
  };
  const label = (el) => (el.innerText || el.value || el.getAttribute("aria-label") || el.getAttribute("title") || el.querySelector("img")?.alt || "").replace(/\s+/g, " ").trim().slice(0, 80);

  const sel = 'a[href], button, input[type="submit"], input[type="button"], [role="button"], summary';
  const elements = [];
  for (const el of document.querySelectorAll(sel)) {
    if (!visible(el) || elements.length >= maxElements) continue;
    const text = label(el);
    if (!text) continue;
    const r = el.getBoundingClientRect();
    if (r.right <= 0 || r.left >= vw) continue; // hors écran horizontal (carrousel) : n'apparaît dans aucune capture
    const s = getComputedStyle(el);
    const bg = bgOf(el);
    elements.push({
      id: `${prefix}${elements.length + 1}`,
      tag: el.tagName.toLowerCase(),
      text,
      href: el.getAttribute("href") || null,
      x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height),
      inFold: r.top < vh && r.bottom > 0,
      fontSize: parseFloat(s.fontSize),
      contrast: ratio(blend(parse(s.color), bg), bg),
    });
    el.setAttribute("data-visiteurs-id", elements[elements.length - 1].id);
  }

  // Texte visible sans défiler, dans l'ordre de lecture.
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const fold = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n.textContent.replace(/\s+/g, " ").trim();
    if (!t || !n.parentElement || !visible(n.parentElement)) continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    const r = range.getBoundingClientRect();
    if (r.top < vh && r.bottom > 0 && r.width > 0) fold.push(t);
  }
  const foldText = fold.join(" ").slice(0, 2000);
  const fullText = document.body.innerText.replace(/\s+/g, " ");
  const price = /(\d+[,.]?\d*\s?(€|\$|£)|(€|\$|£)\s?\d+|\/\s?mois|par mois|per month|\/mo\b|gratuit|free)/i;
  const proof = /(avis|témoignage|clients?|utilisateurs|★|⭐|note de|reviews?|testimonials?|trusted by|customers|\d+\s?(k|000)\+?\s?(membres|users|clients))/i;
  const banner = [...document.querySelectorAll("body *")].find((el) => {
    const s = getComputedStyle(el);
    if (!(s.position === "fixed" || s.position === "sticky") || !visible(el)) return false;
    return /cookie|consent|rgpd|gdpr/i.test(el.innerText || "");
  });
  const br = banner?.getBoundingClientRect();
  const small = [...document.querySelectorAll("p, li, span, a, button, label")].filter((el) => visible(el) && el.innerText?.trim() && parseFloat(getComputedStyle(el).fontSize) < 14).length;

  return {
    viewport: { width: vw, height: vh },
    pageHeight: document.documentElement.scrollHeight,
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content || null,
    headings: [...document.querySelectorAll("h1, h2, h3")].filter(visible).slice(0, 20).map((h) => ({ level: h.tagName, text: h.innerText.replace(/\s+/g, " ").trim().slice(0, 140), inFold: h.getBoundingClientRect().top < vh })),
    foldText,
    foldWords: foldText.split(" ").length,
    signals: {
      priceInFold: price.test(foldText), priceOnPage: price.test(fullText),
      proofInFold: proof.test(foldText), proofOnPage: proof.test(fullText),
      formFields: document.querySelectorAll("input:not([type=hidden]):not([type=submit]), textarea, select").length,
      cookieBanner: banner ? { coversFoldPct: Math.round((Math.min(br.height, vh) * Math.min(br.width, vw)) / (vh * vw) * 100) } : null,
      smallTextCount: small,
    },
    elements,
  };
}

/** Pastilles numérotées sur chaque élément cliquable, pour que les visiteurs puissent dire « je clique sur D3 ». */
function annotate(on) {
  document.getElementById("__visiteurs")?.remove();
  if (!on) return;
  const layer = document.createElement("div");
  layer.id = "__visiteurs";
  // Couche bornée à la page : une case qui déborde élargirait le document et fausserait le viewport mobile.
  layer.style.cssText = `position:absolute;left:0;top:0;width:100%;height:${document.documentElement.scrollHeight}px;overflow:hidden;z-index:2147483647;pointer-events:none`;
  for (const el of document.querySelectorAll("[data-visiteurs-id]")) {
    const r = el.getBoundingClientRect();
    const box = document.createElement("div");
    box.style.cssText = `position:absolute;left:${r.left + scrollX}px;top:${r.top + scrollY}px;width:${r.width}px;height:${r.height}px;outline:2px solid #ff2d55;outline-offset:1px`;
    const tag = document.createElement("div");
    tag.textContent = el.getAttribute("data-visiteurs-id");
    tag.style.cssText = `position:absolute;left:${r.left + scrollX - 4}px;top:${r.top + scrollY - 14}px;background:#ff2d55;color:#fff;font:700 12px/16px system-ui;padding:0 4px;border-radius:4px`;
    layer.append(box, tag);
  }
  document.body.appendChild(layer);
}

async function timings(page) {
  return page.evaluate(() => new Promise((resolve) => {
    const nav = performance.getEntriesByType("navigation")[0];
    let lcp = null;
    try {
      new PerformanceObserver((list) => {
        const e = list.getEntries().at(-1);
        if (e) lcp = Math.round(e.startTime);
      }).observe({ type: "largest-contentful-paint", buffered: true });
    } catch { /* navigateur sans LCP */ }
    setTimeout(() => resolve({
      domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
      loadMs: nav ? Math.round(nav.loadEventEnd) : null,
      lcpMs: lcp,
      transferKb: nav ? Math.round((nav.transferSize || 0) / 1024) : null,
    }), 400);
  }));
}

async function scrollThrough(page) {
  const { h, vh } = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, vh: window.innerHeight }));
  const stop = Math.min(h, vh * (MAX_SCREENS + 2));
  for (let y = 0; y < stop; y += Math.round(vh * 0.6)) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(220);
  }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(500);
}

async function applyVariant(page) {
  if (!VARIANT.h1 && !VARIANT.sub) return false;
  return page.evaluate(({ h1, sub }) => {
    const title = document.querySelector("h1");
    if (!title) return false;
    if (h1) title.textContent = h1;
    if (sub) {
      let next = title.nextElementSibling;
      while (next && !next.innerText?.trim()) next = next.nextElementSibling;
      if (next) next.textContent = sub;
    }
    return true;
  }, VARIANT);
}

async function captureProfile(browser, key, { prefix, context }) {
  const ctx = await browser.newContext(context);
  const page = await ctx.newPage();
  const started = Date.now();
  const response = await page.goto(url, { waitUntil: "load", timeout: 45000 });
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(800);
  const perf = await timings(page);
  const variantApplied = await applyVariant(page);
  // Défile toute la page comme un visiteur : déclenche les apparitions au défilement et les images différées.
  await scrollThrough(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  const data = await page.evaluate(extract, { prefix, maxElements: MAX_ELEMENTS });
  // Écran (1, 2, 3…) où se trouve chaque élément quand on défile.
  for (const e of data.elements) e.ecran = Math.floor(e.y / data.viewport.height) + 1;
  const base = path.join(out, `${NAME}-${key}`);
  await page.screenshot({ path: `${base}-fold.png` });
  await page.evaluate(annotate, true);
  const vh = data.viewport.height;
  const screens = Math.min(MAX_SCREENS, Math.ceil(data.pageHeight / vh));
  // Un élément au-delà du dernier écran capturé serait cité aux visiteurs sans qu'ils puissent le voir.
  const cut = data.elements.filter((e) => e.ecran > screens);
  if (cut.length) console.log(`ATTENTION ${key} : page de plus de ${MAX_SCREENS} écrans, ${cut.length} éléments du bas écartés (${cut.map((e) => e.id).join(", ")})`);
  data.elements = data.elements.filter((e) => e.ecran <= screens);
  const files = [];
  for (let i = 0; i < screens; i += 1) {
    const file = `${base}-ecran-${i + 1}.png`;
    // Vraie position de défilement : on voit ce que voit le visiteur (en-tête collant compris).
    await page.evaluate((y) => window.scrollTo(0, y), i * vh);
    await page.waitForTimeout(350);
    await page.screenshot({ path: file });
    files.push(path.basename(file));
  }
  await page.evaluate(annotate, false);
  const result = { ...data, status: response?.status() ?? null, finalUrl: page.url(), wallMs: Date.now() - started, perf, variantApplied, screenshots: { fold: path.basename(`${base}-fold.png`), screens: files } };
  await ctx.close();
  return result;
}

async function checkLinks(browser, elements, finalUrl) {
  const ctx = await browser.newContext();
  const seen = new Map();
  const targets = elements.filter((e) => e.href && !e.href.startsWith("mailto:") && !e.href.startsWith("tel:") && !e.href.startsWith("javascript:"));
  const page = await ctx.newPage();
  await page.goto(finalUrl, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
  for (const e of targets) {
    if (seen.size >= MAX_LINKS) break;
    if (e.href.startsWith("#")) {
      const ok = e.href === "#" ? false : await page.evaluate((id) => !!document.getElementById(id), e.href.slice(1)).catch(() => false);
      seen.set(e.href, { href: e.href, ok, status: ok ? "ancre ok" : "ancre introuvable", ids: [] });
      continue;
    }
    const abs = new URL(e.href, finalUrl).href;
    if (seen.has(abs)) continue;
    try {
      const res = await ctx.request.get(abs, { timeout: 10000, maxRedirects: 5 });
      seen.set(abs, { href: abs, ok: res.status() < 400, status: res.status() });
    } catch (err) {
      seen.set(abs, { href: abs, ok: false, status: String(err.message).slice(0, 60) });
    }
  }
  await ctx.close();
  return [...seen.values()];
}

const browser = await chromium.launch();
try {
  fs.mkdirSync(out, { recursive: true });
  const result = { url, name: NAME, variant: VARIANT.h1 || VARIANT.sub ? VARIANT : null, capturedAt: new Date().toISOString(), profiles: {} };
  for (const [key, profile] of Object.entries(PROFILES)) result.profiles[key] = await captureProfile(browser, key, profile);
  if (!result.variant) result.links = await checkLinks(browser, result.profiles.desktop.elements, result.profiles.desktop.finalUrl);
  const file = path.join(out, `${NAME}-capture.json`);
  fs.writeFileSync(file, JSON.stringify(result, null, 2));
  const d = result.profiles.desktop, m = result.profiles.mobile;
  console.log(`OK ${file}`);
  console.log(`ordinateur : ${d.elements.length} éléments (${d.elements.filter((e) => e.inFold).length} sans défiler), ${d.screenshots.screens.length} écrans, chargement ${d.perf.loadMs} ms, LCP ${d.perf.lcpMs} ms`);
  console.log(`mobile : ${m.elements.length} éléments (${m.elements.filter((e) => e.inFold).length} sans défiler), ${m.screenshots.screens.length} écrans, ${m.foldWords} mots sans défiler`);
  if (result.variant && !d.variantApplied) console.log("ATTENTION : aucun <h1> trouvé, la variante n'a pas été appliquée");
  if (result.links) console.log(`liens vérifiés : ${result.links.length}, cassés : ${result.links.filter((l) => !l.ok).length}`);
} finally {
  await browser.close();
}
