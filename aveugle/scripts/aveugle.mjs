#!/usr/bin/env node
// Skill « aveugle » : audit axe-core + parcours de la page AU CLAVIER uniquement (Tab, Maj+Tab, Entrée, Espace), piloté par Playwright.
// Usage : node aveugle.mjs <url> <dossier> [--voir]
// Sortie : <dossier>/rapport.json (axe, noms accessibles, ordre de focus, pièges, focus invisible, éléments inatteignables,
// activation Entrée/Espace, formulaires) et <dossier>/page.png. Rien n'est envoyé : toute requête autre que GET est bloquée.
import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const [url, out] = args;
if (!url || !out || url.startsWith("--")) {
  console.error("usage : node aveugle.mjs <url> <dossier> [--voir]");
  process.exit(1);
}
fs.mkdirSync(out, { recursive: true });

const MAX_TABS = 250;
const MAX_LISTE = 40;
const MAX_ACTIVATIONS = 15;
const MAX_FORMULAIRES = 5;
const PAUSE_MS = 120;
const TAGS_WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const NOM_VAGUE = /^(bouton|button|btn|cliquez ici|clique ici|cliquer ici|click here|ici|here|lien|link|lire la suite|en savoir plus|voir plus|plus|more|read more|learn more|image|photo|img|picture|icon|icône|icone|logo|untitled|sans titre|[>»→←<x×+…]|\.\.\.)$/i;
const NOM_FICHIER = /(\.(jpe?g|png|gif|webp|svg|avif)$)|(^(img|dsc|image|photo|screenshot)[-_ ]?\d+)/i;

const browser = await chromium.launch({ headless: !args.includes("--voir") });
const context = await browser.newContext({ viewport: { width: 1366, height: 860 }, locale: "fr-FR" });
const page = await context.newPage();
const bloquees = [];
// Sécurité : on ne laisse passer que les GET, et on annule tout envoi de formulaire (on note seulement qu'il a eu lieu).
await page.route("**/*", (r) => (r.request().method() === "GET" ? r.continue() : (bloquees.push(`${r.request().method()} ${r.request().url()}`), r.abort())));
await context.addInitScript(() => {
  window.addEventListener("submit", (e) => { window.__aveugleEnvoi = [...document.forms].indexOf(e.target); e.preventDefault(); }, true);
});

async function charger(reperer = true) {
  await page.goto(url, { waitUntil: "load", timeout: 45000 });
  await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
  if (reperer) await page.evaluate(marquer);
}

/** Repère (dans l'ordre du DOM) tout ce qui devrait être utilisable au clavier, et garde son style « sans focus ». */
function marquer() {
  const SEL = "a[href],area[href],button,input:not([type=hidden]),select,textarea,summary,iframe,[tabindex],[contenteditable=''],[contenteditable=true],[onclick],[role=button],[role=link],[role=checkbox],[role=radio],[role=tab],[role=menuitem],[role=switch],[role=combobox],[role=slider],[role=textbox],[role=option]";
  const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && Number(s.opacity) > 0 && !el.closest("[inert],[aria-hidden=true]"); };
  const tous = [...document.querySelectorAll(SEL)];
  // Les « faux boutons » : un élément avec le curseur main dont le parent ne l'a pas (div cliquable).
  for (const el of document.body.querySelectorAll("div,span,li,img,svg,p,td,label,h1,h2,h3,h4")) {
    if (getComputedStyle(el).cursor === "pointer" && el.parentElement && getComputedStyle(el.parentElement).cursor !== "pointer" && !el.closest(SEL) && !el.querySelector(SEL) && el.tagName !== "LABEL") tous.push(el);
  }
  const style = (el) => { const s = getComputedStyle(el); return [s.outlineStyle, s.outlineWidth, s.outlineColor, s.boxShadow, s.borderColor, s.borderWidth, s.backgroundColor, s.color, s.textDecorationLine, s.transform].join("|"); };
  let n = 0;
  for (const el of tous) {
    if (el.dataset.aveugle) continue;
    el.dataset.aveugle = String(++n);
    el.dataset.aveugleVisible = visible(el) ? "1" : "0";
    el.dataset.aveugleStyle = style(el);
  }
}

/** Ce qui a le focus : identifiant, balise, rôle et nom calculés par le navigateur, position, focus visible ou non. */
async function focusActuel(cdp) {
  const info = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body || el === document.documentElement) return null;
    if (!el.dataset.aveugle) { // élément non repéré au départ : identifiant stable tiré de sa place dans le DOM
      let chemin = "", n = el;
      while (n && n.parentElement) { chemin = `${[...n.parentElement.children].indexOf(n)}.${chemin}`; n = n.parentElement; }
      el.dataset.aveugle = `x${chemin}`;
    }
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const style = [s.outlineStyle, s.outlineWidth, s.outlineColor, s.boxShadow, s.borderColor, s.borderWidth, s.backgroundColor, s.color, s.textDecorationLine, s.transform].join("|");
    const anneau = (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0) || s.boxShadow !== "none";
    const change = el.dataset.aveugleStyle ? el.dataset.aveugleStyle !== style : anneau;
    return {
      id: el.dataset.aveugle, balise: el.tagName.toLowerCase(), type: el.getAttribute("type") || undefined,
      html: el.outerHTML.replace(/ data-aveugle[\w-]*="[^"]*"/g, "").replace(/\s+/g, " ").slice(0, 180),
      x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY),
      cache: r.width < 2 || r.height < 2 || s.visibility === "hidden" || Number(s.opacity) === 0 || r.right < 0 || r.bottom + scrollY < 0 || r.left > innerWidth,
      focus_visible: change || anneau && s.outlineStyle === "auto",
      iframe: el.tagName === "IFRAME",
    };
  });
  if (!info) return null;
  try {
    const { result } = await cdp.send("Runtime.evaluate", { expression: "document.activeElement" });
    const { nodes } = await cdp.send("Accessibility.getPartialAXTree", { objectId: result.objectId, fetchRelatives: false });
    info.role = nodes[0]?.role?.value;
    info.nom = (nodes[0]?.name?.value || "").trim().slice(0, 120);
  } catch { /* le nom calculé n'est pas disponible pour cet élément */ }
  return info;
}

const rapport = { url, date: new Date().toISOString(), navigateur: "Chromium (Playwright), 1366×860, fr-FR" };

// 1. axe-core (avant tout repérage, pour qu'il voie la page telle quelle)
await charger(false);
await page.screenshot({ path: path.join(out, "page.png") });
const axe = await new AxeBuilder({ page }).withTags(TAGS_WCAG).analyze();
rapport.axe = {
  version: axe.testEngine.version, regles_ok: axe.passes.length, a_verifier_a_la_main: axe.incomplete.map((v) => v.id),
  violations: axe.violations.map((v) => ({ regle: v.id, impact: v.impact, aide: v.help, lien: v.helpUrl, nb: v.nodes.length,
    exemples: v.nodes.slice(0, 8).map((n) => ({ cible: n.target.join(" "), html: n.html.slice(0, 180), resume: n.failureSummary?.slice(0, 240) })) })),
};

// 2. Noms accessibles vagues ou vides (boutons, liens, images, champs), calculés par le navigateur.
const cdp = await context.newCDPSession(page);
const { nodes } = await cdp.send("Accessibility.getFullAXTree");
const ROLES = new Set(["button", "link", "image", "img", "textbox", "searchbox", "combobox", "checkbox", "radio", "switch", "slider", "spinbutton", "listbox", "menuitem", "tab"]);
const noms = [];
for (const n of nodes) {
  const role = n.role?.value;
  if (n.ignored || !ROLES.has(role)) continue;
  const nom = (n.name?.value || "").trim();
  const probleme = !nom ? "sans nom" : NOM_VAGUE.test(nom) ? "nom vague" : NOM_FICHIER.test(nom) ? "nom de fichier" : null;
  if (!probleme) continue;
  let html = "";
  try {
    const { object } = await cdp.send("DOM.resolveNode", { backendNodeId: n.backendDOMNodeId });
    html = (await cdp.send("Runtime.callFunctionOn", { objectId: object.objectId, functionDeclaration: "function(){return this.outerHTML ? this.outerHTML.replace(/\\s+/g,' ').slice(0,180) : ''}", returnByValue: true })).result.value;
  } catch { /* nœud sans élément DOM */ }
  if (!nom && html.startsWith("<svg") && !html.includes('role="img"')) continue; // icône SVG sans rôle : couverte par le nom du bouton ou du lien
  noms.push({ role, nom, probleme, html });
}
const repetes = {};
for (const n of noms) repetes[`${n.role}|${n.nom}`] = (repetes[`${n.role}|${n.nom}`] || 0) + 1;
rapport.noms = noms.slice(0, MAX_LISTE).map((n) => ({ ...n, fois_sur_la_page: repetes[`${n.role}|${n.nom}`] }));
// Champs sans vraie étiquette : un placeholder ou un title ne suffit pas (il disparaît dès qu'on tape).
rapport.champs_sans_etiquette = await page.evaluate(() => [...document.querySelectorAll("input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=image]):not([type=reset]),select,textarea")]
  .filter((el) => el.getClientRects().length && !el.labels?.length && !el.getAttribute("aria-label")?.trim() && !el.getAttribute("aria-labelledby"))
  .map((el) => ({ champ: el.name || el.id || el.type, placeholder: el.getAttribute("placeholder"), html: el.outerHTML.replace(/\s+/g, " ").slice(0, 180) })));

// 3. Parcours au clavier : Tab jusqu'à revenir au début, en surveillant les pièges.
await charger();
const arrets = [];
let fin = "limite de " + MAX_TABS + " tabulations atteinte";
let piege = null;
let memeElement = 0;
for (let i = 0; i < MAX_TABS; i++) {
  await page.keyboard.press("Tab");
  await page.waitForTimeout(PAUSE_MS);
  const f = await focusActuel(cdp);
  if (!f) { if (arrets.length) { fin = "retour au début de la page (normal)"; break; } continue; }
  const dernier = arrets.at(-1);
  if (dernier && dernier.id === f.id) {
    memeElement += 1;
    if (f.iframe && memeElement < 40) continue; // on navigue à l'intérieur d'une iframe
    if (memeElement >= 3) { piege = { type: "le focus ne bouge plus", sur: f, debut: arrets.length - 1 }; break; }
    continue;
  }
  memeElement = 0;
  if (arrets.some((a) => a.id === f.id)) {
    const debut = arrets.findIndex((a) => a.id === f.id);
    if (debut === 0) { fin = "retour au premier élément (normal)"; break; }
    piege = { type: "le focus tourne en boucle", debut, boucle: arrets.slice(debut).map((a) => `${a.balise} « ${a.nom || ""} »`) };
    break;
  }
  arrets.push({ ordre: arrets.length + 1, ...f });
}
if (piege) {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(PAUSE_MS);
  await page.keyboard.press("Tab");
  await page.waitForTimeout(PAUSE_MS);
  const apres = await focusActuel(cdp);
  piege.sortie_avec_echap = !!apres && !arrets.some((a) => a.id === apres.id);
  fin = "piège à focus";
}
const sauts = [];
for (let i = 1; i < arrets.length; i++) if (arrets[i].y < arrets[i - 1].y - 300) sauts.push({ de: arrets[i - 1].ordre, vers: arrets[i].ordre, remonte_de_px: arrets[i - 1].y - arrets[i].y, element: arrets[i].html });

// 3 bis. Maj+Tab : le chemin inverse doit être le même, à l'envers.
// En cas de piège, on vérifie seulement le chemin jusqu'au piège.
const chemin = piege ? arrets.slice(0, piege.debut) : arrets;
let inverse = null;
if (chemin.length > 1) {
  await charger();
  for (let i = 0; i < chemin.length; i++) { await page.keyboard.press("Tab"); await page.waitForTimeout(40); }
  const retour = [];
  for (let i = 0; i < chemin.length + 3; i++) {
    const f = await focusActuel(cdp);
    if (!f) break;
    if (retour.at(-1) !== f.id) retour.push(f.id);
    await page.keyboard.press("Shift+Tab");
    await page.waitForTimeout(40);
  }
  const attendu = chemin.map((a) => a.id).reverse();
  const ecart = attendu.findIndex((id, k) => retour[k] !== id);
  inverse = ecart === -1 ? { identique: true, arrets_verifies: chemin.length } : { identique: false, premier_ecart: { attendu: chemin.find((a) => a.id === attendu[ecart])?.html, obtenu: arrets.find((a) => a.id === retour[ecart])?.html ?? "rien (focus perdu)" } };
}

// 4. Éléments utilisables à la souris mais jamais atteints au clavier.
const vus = new Set(arrets.map((a) => a.id));
await charger();
const inatteignables = await page.evaluate((ids) => {
  const reperes = [...document.querySelectorAll("[data-aveugle]")];
  const atteints = reperes.filter((o) => ids.includes(o.dataset.aveugle));
  return reperes.filter((el) => el.dataset.aveugleVisible === "1" && !ids.includes(el.dataset.aveugle) && !el.disabled && el.tagName !== "IFRAME")
  .filter((el) => !atteints.some((o) => o.contains(el) || el.contains(o)))
  // tabindex="-1" seul = focus réservé au code (bandeau, titre) : pas un oubli
  .filter((el) => !(el.getAttribute("tabindex") === "-1" && !el.matches("[onclick],[role],a[href],button,input,select,textarea") && getComputedStyle(el).cursor !== "pointer"))
  .map((el) => ({ balise: el.tagName.toLowerCase(), tabindex: el.getAttribute("tabindex"), faux_bouton: !el.matches("a[href],button,input,select,textarea,summary,[tabindex]"), texte: (el.innerText || el.getAttribute("aria-label") || el.getAttribute("alt") || "").trim().slice(0, 60), html: el.outerHTML.replace(/ data-aveugle[\w-]*="[^"]*"/g, "").replace(/\s+/g, " ").slice(0, 180) }));
}, [...vus]);

// 5. Entrée et Espace sur les éléments « faits maison » (pas un vrai bouton ni un vrai lien).
const NATIF = new Set(["a", "button", "input", "select", "textarea", "summary", "iframe", "area"]);
const maison = arrets.filter((a) => !NATIF.has(a.balise) && !String(a.id).startsWith("x")).slice(0, MAX_ACTIVATIONS);
const activation = [];
for (const a of maison) {
  const res = { element: a.html, role: a.role, nom: a.nom };
  for (const touche of ["Enter", "Space"]) {
    await charger();
    const avant = page.url();
    await page.evaluate((id) => {
      const el = document.querySelector(`[data-aveugle="${id}"]`);
      el.focus();
      window.__aveugleEffet = 0;
      new MutationObserver(() => window.__aveugleEffet++).observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
      el.addEventListener("click", () => window.__aveugleEffet++);
    }, a.id);
    await page.keyboard.press(touche);
    await page.waitForTimeout(400);
    const effet = page.url() !== avant || (await page.evaluate(() => window.__aveugleEffet).catch(() => 1)) > 0;
    res[touche === "Enter" ? "entree" : "espace"] = effet ? "réagit" : "rien ne se passe";
  }
  activation.push(res);
}

// 6. Formulaires : les remplir et les envoyer au clavier seulement (l'envoi est intercepté, rien ne part).
const VALEURS = { email: "test@example.com", tel: "0612345678", url: "https://example.com", number: "3", password: "Test-1234!", search: "test", date: "01012030" };
const nbFormulaires = await page.evaluate(() => document.forms.length);
const formulaires = [];
/** Remplit le formulaire n° k au clavier seulement, puis tente de l'envoyer (Entrée sur le bouton, sinon Entrée dans le dernier champ). */
async function testerFormulaire(k) {
  await charger();
  const champs = await page.evaluate((k) => [...document.forms[k].elements].filter((e) => e.type !== "hidden" && e.tagName !== "FIELDSET" && e.tagName !== "OUTPUT")
    .map((e) => ({ id: e.dataset.aveugle, nom: e.name || e.id || e.type, requis: e.required, visible: e.dataset.aveugleVisible === "1" })), k);
  if (!champs.some((c) => c.visible)) return null; // formulaire caché (menu fermé, fenêtre non ouverte) : non testé
  const atteints = [];
  const bloqueesAvant = bloquees.length;
  let bouton = null;
  for (let i = 0; i < MAX_TABS; i++) {
    await page.keyboard.press("Tab");
    await page.waitForTimeout(60);
    const ici = await page.evaluate((k) => { const el = document.activeElement; return el && el !== document.body && document.forms[k].contains(el) ? { id: el.dataset.aveugle, tag: el.tagName.toLowerCase(), type: el.type } : null; }, k);
    if (!ici) { if (atteints.length) break; continue; }
    atteints.push(ici.id);
    if (ici.tag === "button" || ["submit", "image", "button", "reset"].includes(ici.type)) {
      if (["submit", "image"].includes(ici.type)) { await page.keyboard.press("Enter"); bouton = "envoyer"; break; }
      if (ici.type === "button") bouton = "bouton JavaScript"; // un vrai <button> réagit toujours à Entrée et Espace
      continue;
    }
    if (["checkbox", "radio"].includes(ici.type)) await page.keyboard.press("Space");
    else if (ici.tag === "select") await page.keyboard.press("ArrowDown");
    else await page.keyboard.type(VALEURS[ici.type] ?? "Test");
  }
  if (atteints.length && !bouton) { // aucun bouton atteint : retour au dernier champ et Entrée (envoi implicite)
    await page.keyboard.press("Shift+Tab");
    if (await page.evaluate((k) => document.forms[k].contains(document.activeElement), k)) await page.keyboard.press("Enter");
  }
  await page.waitForTimeout(600);
  const envoi = await page.evaluate((k) => window.__aveugleEnvoi === k, k).catch(() => true); // page quittée = envoyé
  const invalides = await page.evaluate((k) => [...document.forms[k].elements].filter((e) => e.willValidate && !e.checkValidity()).map((e) => `${e.name || e.id || e.type} : ${e.validationMessage}`), k).catch(() => []);
  return {
    formulaire: k + 1, champs: champs.filter((c) => c.visible).length,
    jamais_atteints: champs.filter((c) => c.visible && !atteints.includes(c.id)).map((c) => c.nom + (c.requis ? " (obligatoire)" : "")),
    bouton_atteint: bouton ?? "aucun",
    envoye_au_clavier: envoi || bloquees.length > bloqueesAvant || bouton === "bouton JavaScript",
    bloque_par_la_validation: invalides,
  };
}
for (let k = 0; k < nbFormulaires && formulaires.length < MAX_FORMULAIRES; k++) {
  const f = await testerFormulaire(k);
  if (f) formulaires.push(f);
}

const tabindexPositif = await page.evaluate(() => [...document.querySelectorAll("[tabindex]")].filter((el) => el.tabIndex > 0).map((el) => el.outerHTML.replace(/ data-aveugle[\w-]*="[^"]*"/g, "").replace(/\s+/g, " ").slice(0, 180))).catch(() => []);
rapport.clavier = { nb_arrets: arrets.length, fin, piege, sauts_en_arriere: sauts, tabindex_positif: tabindexPositif, maj_tab: inverse,
  focus_invisible: arrets.filter((a) => !a.focus_visible && !a.cache).map(({ ordre, balise, role, nom, html }) => ({ ordre, balise, role, nom, html })),
  focus_sur_element_cache: arrets.filter((a) => a.cache).map(({ ordre, nom, html }) => ({ ordre, nom, html })),
  inatteignables: inatteignables.slice(0, MAX_LISTE), nb_inatteignables: inatteignables.length,
  ordre: arrets.map(({ ordre, balise, role, nom, focus_visible }) => ({ ordre, balise, role, nom, focus_visible })) };
rapport.activation = activation;
rapport.formulaires = formulaires;
rapport.requetes_bloquees = bloquees.length;
await browser.close();

fs.writeFileSync(path.join(out, "rapport.json"), JSON.stringify(rapport, null, 2));
const c = rapport.clavier;
console.log(`axe : ${rapport.axe.violations.length} règle(s) violée(s) (${rapport.axe.violations.map((v) => `${v.regle}×${v.nb}`).join(", ") || "aucune"})`);
console.log(`noms vides ou vagues : ${noms.length}`);
console.log(`clavier : ${c.nb_arrets} arrêts, fin = ${c.fin}${piege ? ` (${piege.type})` : ""}, focus invisible ${c.focus_invisible.length}, inatteignables ${c.nb_inatteignables}, sauts ${sauts.length}, Maj+Tab ${inverse ? (inverse.identique ? "ok" : "différent") : "non testé"}`);
console.log(`Entrée/Espace : ${activation.filter((a) => a.entree !== "réagit" || a.espace !== "réagit").length} élément(s) maison sans réaction sur ${activation.length}`);
console.log(`formulaires : ${formulaires.map((f) => `n°${f.formulaire} ${f.envoye_au_clavier ? "envoyé" : "PAS envoyé"} au clavier`).join(", ") || "aucun"}`);
console.log(`-> ${path.join(out, "rapport.json")}`);
